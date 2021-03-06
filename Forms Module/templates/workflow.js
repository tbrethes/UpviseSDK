
function writeStates(states) {
    List.addHeader([R.RANK, R.STATENAME, R.ACTIONBUTTON, R.ROLE, R.STAFF]);
    if (states.length > 0) List.add([0, R.DRAFT, R.SUBMIT, "", R.EVERYONE], "");
    for (var i = 0; i < states.length; i++) {
        var state = states[i];
        List.add([state.status, state.name, state.action, Query.names("System.roles", state.roleid), formatStaffList(state.staff)], "editState({state.id})");
    }
}

// staiff is a multi value string and can contain user name or roleid
function formatStaffList(staff) {
    var list = [];
    var parts = staff.split("|");
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var role = Query.selectId("System.roles", part);
        if (role) list.push(role.name);
        else list.push(part);
    }
    return list.join(", ");
}

/////////////////////////////////////

function newState(templateid) {
    Toolbar.setTitle(R.NEWSTATE);
    Toolbar.addButton(R.SAVE, "saveNewState({templateid})", "save");
    List.forceNewLine = true;
    var name = Query.count("states", "templateid={templateid}") == 0 ? "Submitted" : "";
    List.addTextBox("name", R.STATENAME, name, null);
    List.addTextBox("action", R.ACTIONBUTTON, "", null);
    List.addHelpPane(R.STATE_HELP2);
    List.show("pane");
}

function saveNewState(templateid) {
    var values = {};
    values.templateid = templateid;
    values.name = List.getValue("name");
    values.action = List.getValue("action");
  
    if (values.name == "") { App.alert(R.ENTERSTATE); return; }

    var states = Query.select("Forms.states", "id;action;status", "templateid={templateid}", "status DESC");
    var curstate = states.length > 0 ? states[0] : null;
    if (curstate != null) {
        if (curstate.action == "") Query.updateId("Forms.states", curstate.id, "action", R.MARKAS + " " + values.name);
        values.status = 1 + curstate.status;
    } else {
        values.status = 1;
    }
        
    var id = Query.insert("Forms.states", values);
    History.reload();
}

function editState(id) {
    var state = Query.selectId("states", id);
    if (state == null) { History.back(); return; }
    var onchange = "Query.updateId('states',{id},this.id,this.value)";

    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteState({id})", "delete");
    List.forceNewLine = true;
    List.addItemTitle(R.EDITSTATE);

    List.forceNewLine = true;
    List.addTextBox("name", R.STATENAME, state.name, onchange);
    List.addTextBox("action", R.ACTIONBUTTON, state.action, onchange);
    List.addHelp(R.STATE_HELP2);

    if (state.roleid == '' || state.staff != '') {
        List.addComboBoxMulti("staff", R.STAFF, state.staff, onchange + ";History.reload()", getStateStaffOptions(state.staff));
        List.addHelp(R.STATE_HELP1);
    }
    if (state.staff == "") {
        List.addComboBoxMulti("roleid", R.ROLE, state.roleid, onchange + ";History.reload()", Query.options("System.roles"));
        List.addHelp("If you use role, leave staff field empty, it is incompatible");
    }

    List.addHeader();
    List.addCheckBox("sign", R.DIGISIGNSTATE, state.sign, onchange);
    List.addHelp(R.STATE_HELP3);
    List.addTextBox("note", R.LEGALNOTICE, state.note, onchange, "longtext");
    List.addHelp(R.STATE_HELP5);
    List.addTextBox("onload", R.EXECUTEONLOAD, state.onload, onchange, "code");
    List.addHelp(R.STATE_HELP4);

    List.show("");
}

// statestaff is the currently set value of statestaff in a State. can be null
function getStateStaffOptions(statestaff) {
    var options = "Initiator" + "|" + User.getOptions();

    // add usernames that are not in User.getOptions, e.g. Disabled or Deleted users
    if (statestaff != null && statestaff != "") {
        var users = statestaff.split("|");
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            if (!MultiValue.contains(options, user+":"+user)) options = MultiValue.add(options, user+":"+user);
        }        
    }
    return options;
}

function deleteState(id) {
    Query.deleteId("states", id);
    History.back();
}


