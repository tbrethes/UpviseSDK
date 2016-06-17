

Forms.REJECTED = -1;
Forms.DRAFT = 0;
var SUBMITTED = 1;

//////////////////////////////////

Forms.LOCK = 0;

Forms.submitForm = function (id, goBack) {
    var form = Query.selectId("Forms.forms", id);
    // TBR: shield for KONE email loop bug. 9/22/2015
    if (form.status == 1) return;

    if (Forms.checkEmptyFields(form) == false) return;

    //NB LOCK is to handle double tap execution, but will not fix all concurrent execution cases
    if (Forms.LOCK == 1) {
        App.alert("Lock");
        return;
    }

    // Execute on Submit
    var returnValue = Forms.evalSubmit(form);
    if (returnValue == 0) return;

    Forms.LOCK = 1;
    try {
        Query.updateId("Forms.forms", id, "status", 1);
        // notify all managers : null
        Forms.notify(form, R.SUBMITTED, null);
        Forms.archive(id);
    } catch (e) {}
    if (returnValue != 2) {
        if (goBack === true) History.back();
        else History.reload();
    }

    Forms.LOCK = 0;
}

Forms.checkEmptyFields = function (form) {
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return true;
    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var isMandatory = (field.mandatory == 1 && (field.status == form.status || field.status == -1));
        if (isMandatory) {
            var isEmpty = false;
            if (field.type == "signature" && Settings.getPlatform() == "web") continue; // signature never mandatory on web.
            else if (field.type == "photo") {
                var items = Files.select("Forms.forms", field.value);
                if (items.length == 0) isEmpty = true;
            } else if (field.value == null || field.value == "") {
                isEmpty = true;
            }
            if (isEmpty) {
                if (App.confirm("Edit mandatory field: " + field.label) == true) {
                    History.replace(Forms._EDITFORM + "({form.id})");
                }
                return false;
            }
        }
    }
    return true;
}

// return=0 : do not submit, return=1: submit, return=2 : submit but do no go back because we navigated to a new page...
Forms.evalSubmit = function (form) {
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return 1;
    var onsubmit = template.onsubmit.trim();
    if (onsubmit == "") return 1;

    var fields = Query.select("Forms.fields", "name;label;value;type;seloptions", "formid=" + esc(form.templateid), "rank");
    var formValues = Forms._getFullValues(form, fields);

    var js = "function f1(){" + onsubmit + "};f1();";
    var returnValue = Forms._evalFormula(js, formValues, form);
    if (returnValue != 0 && returnValue != 1 && returnValue != 2) {
        App.alert("Javascript Error: " + returnValue);
    }
    return returnValue;
}

// staff is a pipe separated list of user names
Forms.notify = function (form, statename, staff) {
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return;

    var title = template.name + " " + "Form " + form.name;
    var type = "form." + template.id;
    var body = statename + " by " + User.getName();

    var emails = (staff != null) ? User.getEmails(staff) : null;
    Notif.send(title, body, Forms._VIEWFORM + "({form.id})", type, emails);
    if (emails != null) App.alert("Notification sent to " + emails);
}

Forms.archive = function (id) {
    var email = AccountSettings.get("Forms.archive");
    if (email != null && email != "") {
        Forms.exportPdf(id, "archive", email);
    }
}


/////////////////////////////

Forms.getState = function (form) {
    var count = Query.count("Forms.states", "templateid={form.templateid}");

    if (count == 0) {
        if (form.status == 0) {
            return { name: R.DRAFT, action: R.SUBMIT, onclick: "Forms.submitForm({form.id})" };
        } else {
            // we assume form.status = 1 : means Submitted : nothing to do
            return { name: null };
        }
    }

    // Here we have a form with a workflow
    if (form.status == Forms.REJECTED) {
        return { name: R.REJECTED };
    } else if (form.status == Forms.DRAFT) {
        return { name: R.DRAFT, action: R.SUBMIT, onclick: "Forms.nextState({form.id},{form.status})" };
    } else {
        var states = Query.select("Forms.states", "name;action;staff", "templateid={form.templateid} AND status={form.status}");
        if (states.length == 0) return { name: "Error Status" };
        var state = states[0];
        var obj = { name: state.name };
        var statestaff = Forms.getStateStaff(form, state);
        if (state.action != "" && Forms.containsUser(form, statestaff)) {
            obj.action = state.action;
            obj.onclick = "Forms.nextState({form.id},{form.status})";
            obj.reject = "Forms.reject({form.id})";
        }
        return obj;
    }
}

Forms.containsUser = function (form, statestaff) {
    if (statestaff == "" || User.isAdmin() || MultiValue.contains(statestaff, User.getName()) ||
       (MultiValue.contains(statestaff, 'Initiator') && Forms.getCreator(form.owner) == User.getName())) {
        return true;
    } else {
        return false;
    }
}

/////////////////////
// this function can be overriden to return custom staff based on form linked record
Forms.getStateStaff = function (form, state) {
    return state.staff;
}

//////////////////////

Forms.reject = function (id) {
    var note = App.prompt("Enter Reason", "");
    if (note == "" || note == null) return;

    var form = Query.selectId("Forms.forms", id);
    Query.updateId("Forms.forms", id, "status", Forms.REJECTED);
    Forms.addHistory(form, R.REJECTED, note, "");
    Forms.notify(form, R.REJECTED, Forms.getCreator(form));
    Forms.archive(id);

    History.reload();
}

Forms.nextState = function (id, currentStatus) {

    var form = Query.selectId("Forms.forms", id);
    if (form == null) return;
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return;

    // To prevent fast double tap on the Next state button
    if (form.status != currentStatus) {
        App.alert("Warning Double Tap");
        return;
    }

    var states = Query.select("Forms.states", "status;name;action;staff;sign;note;onload", "templateid={form.templateid} AND status>{form.status}", "status");
    var newstate = (states.length > 0) ? states[0] : null;
    if (newstate == null) {
        App.alert("Cannot change form state : this is the last state");
        return;
    }

    // ensure no empty mandatory fiels
    if (Forms.checkEmptyFields(form) == false) return;
    if (newstate.note != "" && App.confirm(newstate.note) == false) return;

    var signature = "";
    if (newstate.sign == 1) {
        if (WEB() == true) {
            signature = Forms.getLastSignature(User.getName());
            if (signature == null) {
                if (App.confirm("No previous mobile signature found. Are you sure you want to continue?") == false) return;
            }
        } else {
            signature = App.prompt("Signature", "", "signature");
            if (signature == "" || signature == null) return;
        }
    }

    // Execute the onload script for this state - if any.
    Forms.evalOnLoad(form, newstate.onload);

    // Set the form default values for the new state
    var values = Forms._getValues(form);
    Forms.setDefaultValues(form, values, newstate.status);
    Query.updateId("Forms.forms", id, "value", JSON.stringify(values));

    Query.updateId("Forms.forms", id, "status", newstate.status);
    Forms.addHistory(form, newstate.name, newstate.note, signature);

    // if the new state staff is not a manager, add it to the form owner, required for the new statestaff to see the form
    var newstaff = Forms.getStateStaff(form, newstate);

    var newowners = Forms.addStandardUsers(form.owner, newstaff);
    if (newowners != form.owner) Query.updateId("Forms.forms", id, "owner", newowners);

    // notify the state staff + form owner
    var users = newstaff + "|" + Forms.getCreator(form);
    if (template.notifusers != "") users += "|" + template.notifusers;
    Forms.notify(form, newstate.name, users);

    // If this is the last stage, ie no action button, archive the form
    if (newstate.action == "") Forms.archive(id);
    History.reload();
}

Forms.evalOnLoad = function (form, onload) {
    onload = onload.trim();
    if (onload == "") return;

    var fields = Query.select("Forms.fields", "name;label;value;type;seloptions", "formid={form.templateid}", "rank");
    var formValues = Forms._getFullValues(form, fields);

    var js = "function f1(){" + onload + "};f1();";
    var error = Forms._evalFormula(js, formValues, form);
    if (error != null && error != "") App.alert(error);
}

// formowner and staff can be multi owner
// Warning: staff can contain the owner 'Initiator' which must not be added
Forms.addStandardUsers = function (formowner, staff) {
    var newowners = formowner;
    var owners = staff.split("|");
    for (var i = 0; i < owners.length; i++) {
        var owner = owners[i];
        if (owner == 'Initiator') continue;
        if (Query.count("System.users", "type!={User.STANDARD} AND status=1 AND name={owner}") == 0) {
            newowners = MultiValue.add(newowners, owner);
        }
    }
    return newowners;
}
