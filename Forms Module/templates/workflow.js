
function writeStates(states) {
    List.addHeader([R.RANK, R.STATENAME, R.ACTIONBUTTON, R.STAFF]);
    List.add([0, R.DRAFT, R.SUBMIT, R.EVERYONE], "App.alert(" + R.STATEEDITALERT + ")");
    for (var i = 0; i < states.length; i++) {
        var state = states[i];
        List.add([state.status, state.name, state.action, state.staff], "editState({state.id})");
    }
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
    //List.addComboBoxMulti("staff", R.STAFF, "", null, getStateStaffOptions());
    //List.addHelpPane(R.STATE_HELP1);
    //List.addCheckBox("sign", R.DIGISIGNSTATE, "", null);
    List.show("pane");
}

function saveNewState(templateid) {
    var values = {};
    values.templateid = templateid;
    values.name = List.getValue("name");
    values.action = List.getValue("action");
    //values.staff = List.getValue("staff");
    //values.sign = List.getValue("sign") == "1" ? 1 : 0;

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
    List.addComboBoxMulti("staff", R.STAFF, state.staff, onchange, getStateStaffOptions(state.staff));
    List.addHelp(R.STATE_HELP1);
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


