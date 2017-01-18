////////////////// Edit groups

Qhse.showOptions = function(tab) {
    Toolbar.addTab(R.OPTIONS, "Qhse.showOptions()");
    Toolbar.addTab(R.GROUPS, "Qhse.showOptions(1)");
    Toolbar.addTab(R.ROLES, "Qhse.showOptions(2)");
    Toolbar.moreButton = false;
    if (tab == null) {
        var onchange = "AccountSettings.set(this.id,this.value)";
        List.forceNewLine = true;
        List.addCheckBox("qhse.noweb", "Disable Web Access for non Admin", AccountSettings.get("qhse.noweb"), onchange);
    } else if (tab == 1) editGroups();
    else if (tab == 2) editRoles();
    List.show();
}


function editGroups() {
    //Toolbar.setStyle("edit");
    Toolbar.addButton(R.NEWGROUP, "newGroup()", "new");
    Toolbar.moreButton = false;
    var groups = Query.select("groups", "id;name", null, "rank");
    List.addHeader([R.RANK, R.NAME, ""], ["50px", null, null])
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var onicon = "deleteGroup({group.id})";
        List.add([group.rank, group.name, ""], "editGroup({group.id})");

        //Query.updateId("groups", group.id, "rank", (i+1));
    }
}

function newGroup() {
    var rank = 1 + Query.max("groups", "rank");
    var id = Query.insert("groups", { rank: rank });
    History.redirect("editGroup({id})");
}

function editGroup(id) {
    var group = Query.selectId("groups", id);
    var onchange = "Query.updateId('groups',{id},this.id,this.value)";
    //var name = App.prompt(R.ENTERNAME, group.name);
    //if (name == null) return;
    //Query.updateId("groups", id, "name", name);
    //History.reload();
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteGroup({id})", "delete");
    List.forceNewLine = true;
    List.addItemTitle(R.EDITGROUP);
    List.addTextBox("name", R.NAME, group.name, onchange);
    List.addTextBox("rank", R.RANK, group.rank, onchange, "numeric");
    List.show();
}

function deleteGroup(id) {
    Query.update("procedures", { groupid: '' }, "groupid={id}");
    Query.deleteId("groups", id);
    History.back();
}

//////////////////////


//////////// EDIT ROLES

function editRoles() {
    Toolbar.addButton(R.NEWROLE, "newRole()");
    var roles = Query.select("roles", "id;name", null, "name");
    List.addHeader(["Role"], null, "contact");
    for (var i = 0; i < roles.length; i++) {
        var role = roles[i];
        List.add([role.name], "editRole({role.id})");
    }
}

function newRole() {
    var id = Query.insert("roles", {});
    History.replace("editRole({id})");
}

function editRole(id) {
    var role = Query.selectId("roles", id);

    Toolbar.setStyle("edit");
    Toolbar.setTitle("Edit Role");
    Toolbar.addButton(R.DELETE, "deleteRole({id})", "delete");

    var onchange = "Query.updateId('roles',{id},this.id,this.value)";
    List.addTextBox("name", R.NAME, role.name, onchange);
    List.show();
}

function deleteRole(id) {
    Query.update("steps", {roleid:''}, "roleid={id}");
    Query.deleteId("roles", id);
    History.back();
}