
//////////////////////////////////
Forms.LOCK = 0;

Forms.checkEmptyFields = function (form) {
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return true;
    var fields = Forms.getFields(form);
    var subforms = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var isMandatory = (field.mandatory == 1 && (field.status == form.status || field.status == -1));
        if (isMandatory) {
            var isEmpty = false;
            if (field.type == "signature") {
                isEmpty = (field.value == "");
                if (isEmpty && WEB() && GlobalSettings.getString("forms.websignature.mandatory") != "1") isEmpty = false; 
            } else if (field.type == "photo") {
                var count = Query.count("System.files", "linkedtable='Forms.forms' AND linkedrecid={field.value}");
                if (count == 0) isEmpty = true;
            } else if (field.type == "date" || field.type == "datetime" || field.type == "time") {
                isEmpty = !(Math.abs(parseInt(field.value)) > 0);
            } else if (field.type == "checkbox") {
                isEmpty = (field.value != "1"); // Added 9 May 2023
            } else if (field.value == null || field.value === "") { // use === because 0 should not be empty
                isEmpty = true;
            }
            if (isEmpty) {
                if (Forms._EDITFORM != null) {
                    if (App.confirm(R.EDITMANDATORYFIELD + ": " + field.label) == true) {
                        History.redirect(Forms._EDITFORM + "({form.id},null,{i})");
                    }
                } else {
                    App.alert("Mandatory field: " + field.label);
                }
                return false;
            }
        }
        if (field.type == "button" && field.value == "newsubform") {
            var linkedid = form.id + ":" + field.id;
            var subitems = Query.select("Forms.forms", "*", "linkedtable='Forms.forms' AND linkedid={linkedid}");
            subforms = subforms.concat(subitems);
        }
    }

    // check for subforms mandatory fields
    for (var i = 0; i < subforms.length; i++) {
        var subform = subforms[i];
        if (Forms.checkEmptyFields(subform) == false) {
            return false;
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

    var js = "function f1() {\n" + onsubmit + "\n};f1();";
    var returnValue = Forms._evalFormula(js, formValues, form, "ONSUBMIT");

    // if no return value and the submit code contains App.open, we decide you navigated to a new page.
    if (returnValue == null && onsubmit.indexOf("App.open") > -1) returnValue = 2;

    if (returnValue != undefined && returnValue != 0 && returnValue != 1 && returnValue != 2) {
        App.alert("Javascript Error: " + returnValue);
    }
    return returnValue;
}

// return=0 : do not submit, return=1: submit, return=2 : submit but do no go back because we navigated to a new page...
Forms.evalReject = function (form) {
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return ;
    if (!template.onreject) return;
    var onreject = template.onreject.trim();
    if (onreject == "") return;

    var fields = Query.select("Forms.fields", "name;label;value;type;seloptions", "formid=" + esc(form.templateid), "rank");
    var formValues = Forms._getFullValues(form, fields);

    var js = "function f1() {\n" + onreject + "\n};f1();";
    var returnValue = Forms._evalFormula(js, formValues, form, "ONREJECT");
}

// staff is a pipe separated list of user names
Forms.notify = function (form, statename, staff) {
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return;

    var values = Forms._getValues(form);
    if (values["NONOTIF"] == 1) return;

    var title = template.name + " " + "Form " + form.name;
    var type = "form." + template.id;
    // this will change type to "" to force notify for workflow.
    if (staff && GlobalSettings.getString("forms.forcenotify") == "1") type = "";
    if (values["EMAILNOTIF"] == 1) type = "high"; // force notif also sent by email
    
    var body = statename + " by " + User.getName();

    var emails = (staff != null) ? User.getEmails(staff) : null;
    Notif.send(title, body, Forms._VIEWFORM + "({form.id})", type, emails);
    if (emails != null) App.alert("Notification sent to " + emails);
}

Forms.archive = function (id) {
    var email = AccountSettings.get("Forms.archive");
    if (email) {
        FormsPdf.export(id, "archive", email);
    }
    // NEW April 2023
    if (AccountSettings.get("forms.pdfapistore") == "1") {
        FormsPdf.export(id, "api-store"); // qrcode-store public-store cold-store
    }         
}

Forms.notifyDelete = function (form) {
    try {
        if (!form || form.value == '') return;

        var values = form.value ? JSON.parse(form.value) : {};
        var email = values["EMAILDELETE"];
        if (!email) return;
        var body = [];
        body.push("Form Template: " + Query.names("forms.templates", form.templateid));
        body.push("Form ID: " + form.name);
        body.push("Deleted by: " + User.getName());
        body.push("Date: " + new Date().toUTCString());
        body.push("Device: " + Settings.getPlatform());
        body.push("Database: " + Settings.get("company"));
        Notif.send("Deleted Form Notification", body.join("\n"), "", "", email);
    } catch(e) {
        //alert(e.message);
    }
}

/////////////////////////////

Forms.getState = function (form) {
    // empty state for subforms
    if (form.linkedtable == "Forms.forms") return {};

    // superseded status can apply with or without workflow
    if (form.status == -2) {
        return { name: "Superseded"};
    }
 
    var count = Query.count("Forms.states", "templateid={form.templateid}");
    if (count == 0) {
        if (form.status == 0) {
            return { name: R.DRAFT, action: R.SUBMIT, onclick: "Forms.submit({form.id})" };
        } else {
            // we assume form.status = 1 : means Submitted : nothing to do
            return { name: null };
        }
    }

    // Here we have a form with a workflow

    if (form.status == Forms.REJECTED) {
        return { name: R.REJECTED };
    } else if (form.status == Forms.DRAFT) {
        var obj = { name: R.DRAFT };
        if (User.isManager() || MultiValue.contains(form.owner, User.getName()) ) {
            obj.action =  R.SUBMIT;
            obj.onclick = "Forms_nextState({form.id},{form.status})";
        }
        return obj;
    } else {
        var states = Query.select("Forms.states", "status;name;action;staff;roleid", "templateid={form.templateid} AND status={form.status}");
        if (states.length == 0) return { name: "Error Status" };
        var state = states[0];
        var obj = { name: state.name };
        var statestaff = Forms.getStateStaff(form, state);
        if (state.action != "" && Forms.containsUser(form, statestaff, state.roleid)) {
            obj.action = state.action;
            obj.onclick = "Forms_nextState({form.id},{form.status})";
            if (AccountSettings.get("forms.noreject") != "1") {
                obj.reject = "Forms.reject({form.id})";
            }
        }
        return obj;
    }
}

Forms.containsUser = function (form, statestaff, roleid) {
    if (statestaff == "" || User.isAdmin()) return true;
    if (MultiValue.contains(statestaff, User.getName())) return true;
    if (MultiValue.contains(statestaff, 'Initiator') && Forms.getCreator(form) == User.getName() ) return true;
    
    var role = User.getRole();
    if (role && roleid && role.id == roleid) return true;

    return false;
}

/////////////////////
// this function can be overriden to return custom staff based on form linked record
Forms.getStateStaff = function (form, state) {
    if (state.roleid != "") {
        var staffArray = [];
        // role based
        // get a map of all users by role (optionally filter for the projectid)
        var roleMap = User.getRoleMap(form.projectid);

        // Workflow State roleid may be multi value
        var roles = state.roleid.split("|");
        for (var i = 0; i < roles.length; i++) {
            var users = roleMap.get(roles[i]);
            if (users) staffArray = staffArray.concat(users);
        }
        return staffArray.join("|");
    } else {
        // 4 April 2023 : ns form column indicates next staff for dynamic workflow
        if (state.staff == "" && form.ns) {
            return form.ns;
        }
        // user based staff
        return state.staff;
    }
}

Forms.shouldArchive = function (state) {
    return state.action == ""; // archive last state only
}

//////////////////////

Forms.submit = function(id, noReload) {
    var form = Query.selectId("Forms.forms", id);
    // TBR: shield for KONE email loop bug. 9/22/2015
    if (form.status == 1) return false;
    //NB LOCK is to handle double tap execution, but will not fix all concurrent execution cases
    if (Forms.LOCK == 1) {
        App.alert("Lock");
        return false;
    }

    if (Forms.checkEmptyFields(form) == false) return false;
    if (Forms.signOnSubmit(form) == false) return false;

    // Execute on Submit
    var returnValue = Forms.evalSubmit(form);
    if (returnValue === 0) return false;

    Forms.LOCK = 1;
    try {
        Query.updateId("Forms.forms", id, "status", 1);
        // submit the subforms
        Forms.setSubFormsStatus(form, Forms.SUBMITTED);
        // Add an history state 
        Forms.addHistory(form, R.SUBMITTED);
        // notify all managers : null
        Forms.notify(form, R.SUBMITTED, null);
        Forms.archive(id);
    } catch (e) {}
    Forms.LOCK = 0;

    // returnValue == 2 means the onsubmit script has already navigated itself to another screen
    if (returnValue == 2 || noReload === true) {
        return true;
    }

    History.reload();
    return true;
}

Forms.signOnSubmit = function(form) {
    // do we require on submit signature?
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template.signonsubmit != 1) return true;

    // try to get existing user signature
    var signature = Forms.getUserSignature();
    if (!signature) {
        if (WEB()) {
            App.confirm("Signature required. Please submit on a mobile device to sign.");
            return false;
        } else {
            signature = App.prompt("Signature", "", "signature");
            if (!signature) return false;
            Forms.saveUserSignature(signature);
        }
    }
}

Forms.reject = function(id) {
    var note = App.prompt("Enter Reason", "", "textarea");
    if (note == "" || note == null) return;

    var form = Query.selectId("Forms.forms", id);
    Forms.addHistory(form, R.REJECTED, note);
    Forms.notify(form, R.REJECTED, Forms.getCreator(form));
    Forms.archive(id);

    var newstatus = Forms.REJECTED;
    if (GlobalSettings.getString("forms.rejecttodraft") == "1") {
        newstatus = Forms.DRAFT;
    }
    Query.updateId("Forms.forms", id, "status", newstatus);
    Query.updateId("Forms.forms", id, "color", "");
    
    Forms.evalReject(form);

    History.reload();
}

function Forms_nextState(id, currentStatus) {
    var form = Query.selectId("Forms.forms", id);
    if (form == null) return;
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return;

    // To prevent fast double tap on the Next state button
    if (form.status != currentStatus) {
        App.alert("Warning Double Tap");
        return;
    }

    var where = "templateid={form.templateid} AND status>{form.status}";
    var states = Query.select("Forms.states", "status;name;action;staff;sign;note;roleid;onload", where + " AND days=1", "status");
    if (states.length == 0) {
        states = Query.select("Forms.states", "status;name;action;staff;sign;note;roleid;onload", where, "status");
    }
    var newstate = (states.length > 0) ? states[0] : null;
    if (newstate == null) {
        App.alert("Cannot change form state : this is the last state");
        return;
    }

    // ensure no empty mandatory fiels
    if (Forms.checkEmptyFields(form) == false) return;

    // Execute the onload script for this state - if any. If the onload script returns a non null string, display the message and do not continue to next state
    var errorMsg = Forms.evalOnLoad(form, newstate.onload);
    if (errorMsg) {
        // ensure it is a String
        errorMsg = String(errorMsg);
        if (errorMsg.startsWith("#")) {
            var newStatus = parseInt(errorMsg.substring(1)) - 1;
            Query.updateId("Forms.forms", id, "status", newStatus);
            Forms_nextState(id, newStatus);
            return;
        }
        return App.alert(errorMsg);
    }
    if (newstate.note != "" && App.confirm(newstate.note) == false) return;

    // ask for signature
    if (newstate.sign == 1) {
        // 3 Jan 2022: We always reuse signature
        if (!WEB()) {
            var hasSignature = (Forms.getUserSignature() != null);
            if (hasSignature) {
                if (App.confirm("Reuse your existing signature?") == false) {
                    hasSignature = false; 
                }
            }
            if (!hasSignature) {
                var newSignature = App.prompt("Signature", "", "signature");
                if (!newSignature) {
                    return; // cancel;
                }
                // save signature and continue
                Forms.saveUserSignature(newSignature);
            }
        }
    }

    // Set the form default values for the new state
    // Bug fix. TBR: Feb. 8th 2019 : we need to re select the form from the database because Forms.evalOnLoad may have modified it....
    form = Query.selectId("Forms.forms", id);
    //var values = Forms._getValues(form);
    //Forms.setDefaultValues(form, values, newstate.status);
    //Query.updateId("Forms.forms", id, "value", JSON.stringify(values));

    Query.updateId("Forms.forms", id, "status", newstate.status);
    Forms.addHistory(form, newstate.name, newstate.note);

    // Nov 6th, 2022
    // if this is the last step , set all sub form state to 1 (submitted), so that manager cannot edit the subforms anymore
    if (Forms.hasFinalStatus(form)) {
        Forms.setSubFormsStatus(form, Forms.SUBMITTED);
    }
    
    // if the new state staff is not a manager, add it to the form owner, required for the new statestaff to see the form
    var newstaff = Forms.getStateStaff(form, newstate);
    var newowners = Forms.addStandardUsers(form.owner, newstaff);
    Forms.changeOwner(id, newowners); // we may update the photos and subforms here

    // notify the state staff + form owner
    var users = newstaff + "|" + Forms.getCreator(form);
    if (template.notifusers != "") users += "|" + template.notifusers;
    Forms.notify(form, newstate.name, users);

    // If this is the last stage, ie no action button, archive the form
    if (Forms.shouldArchive(newstate)) Forms.archive(id);
    History.reload();
}

Forms.evalOnLoad = function (form, onload) {
    onload = onload.trim();
    if (onload == "") return;

    var fields = Query.select("Forms.fields", "name;label;value;type;seloptions", "formid={form.templateid}", "rank");
    var formValues = Forms._getFullValues(form, fields);

    var js = "function f1(){" + onload + "\n};f1();";
    return Forms._evalFormula(js, formValues, form, "ONLOAD");
}

// formowner and staff can be multi owner
// Warning: staff can contain the owner 'Initiator' which must not be added
Forms.addStandardUsers = function (formowner, staff) {
    var newowners = formowner;
    var owners = staff.split("|");
    for (var i = 0; i < owners.length; i++) {
        var owner = owners[i];
        if (owner == 'Initiator') continue;
        var user1 = Query.select("System.users", "id;status;type", "name={owner}")[0];
        if (user1 && user1.status == 1 && user1.type == User.STANDARD) {
            newowners = MultiValue.add(newowners, owner);
        } 
    }
    return newowners;
}

//////////////////////

Forms.resetToDraft = function(id, silent) {
    if (silent === null) silent = false;   
    if (!silent) if (App.confirm("Are you sure?") == false) return;

    var form = Query.selectId("Forms.forms", id);
    Query.updateId("Forms.forms", form.id, "status", 0);
    Query.updateId("Forms.forms", form.id, "color", "");

    // Remove signature
    let fields = Query.select("Forms.fields", "name", "formid={form.templateid} AND type='signature'");
    for (let field of fields) {
        Forms.setValue(field.name, "");
    }

    Forms.addHistory(form, "Reset To Draft");

    // also reset the subforms
    Forms.setSubFormsStatus(form, Forms.DRAFT);

    if (!silent) History.reload();
}

Forms.resetToSuperseded = function(id, silent) {
    if (silent === null) silent = false;   
    if (!silent) if (App.confirm("Are you sure?") == false) return;

    let form = Query.selectId("Forms.forms", id);
    Query.updateId("Forms.forms", form.id, "status", Forms.SUPERSEDED);
    Query.updateId("Forms.forms", form.id, "color", "");
    Forms.addHistory(form, "Reset To Superseded");

    // also reset the subforms
    Forms.setSubFormsStatus(form, Forms.SUPERSEDED);
   
    // update the form pdf for QRCode
    FormsPdf.export(id, "update-qrcode");
    
    if (!silent) History.reload();
}

Forms.resetColor = function(id, silent = false) {
    Query.updateId("Forms.forms", id, "color", "");
    if (!silent) History.reload();
}

Forms.setSubFormsStatus = function(form, status) {
    let subforms = Forms.selectSubForms(form, "id");
    for (let subform of subforms) {
        Query.updateId("Forms.forms", subform.id, "status", status);
    }
}

///////////// ROLE WORKFLOW

// returns a hashmap, key is roleid, value is array of user display name
User.getRoleMap = function(projectid) {
    var where = "";
    if (AccountSettings.get("forms.workflowproject") == 1) {
        // if projectid, filter users by project owners.
        var project = Query.selectId("Projects.projects", projectid);
        if (project && project.owner) {
            where = "name IN " + list3(project.owner); // FIX_IN
        }
    }

    var users = Query.select("system.users", "id;name", where);
    var roleMap = new HashMap();
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        var role = User.getRole(user.id);
        if (role) {
            var obj = roleMap.get(role.id);
            if (!obj) {
                obj = [];
                roleMap.set(role.id, obj);
            }
            obj.push(user.name);
        }
    }
    return roleMap;
}

Forms.hasFinalStatus = function(form) {
    if (!form) return false; // error
    
    var where = "templateid={form.templateid}";
    var count = Query.count("Forms.states", where);
    if (count == 0) {
        // No workflow, final stage if status = 1 (submitted) (rejected =-1 or superseded == -2) do not count
        return (form.status == 1);
    } else {
        // form template has a workflow, do we have later stages after the current form status?
        var where2 = "templateid={form.templateid} AND status>{form.status}";
        var count2 = Query.count("Forms.states", where2);
        return count2 > 0 ? false : true;
    }
}
///////////////

Forms.getUserSignature = function (staff) {
    if (!staff) staff = User.getName();
    
    let users = Query.select("System.users", "id", "name={staff}");
    if (users.length == 0) return null;
    let userId = users[0].id;
    let item = Query.selectId("Forms.signatures", userId);
    return item ? item.signature : null;
}

Forms.saveUserSignature = function(signature) {
    var values = {};
    values.id = User.getId();
    values.signature = signature;
    values.date = Date.now();
    Query.insert("Forms.signatures", values);
}