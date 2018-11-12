Templates.editRoles = function () {

    Toolbar.addButton(R.HELP, "App.help('forms/help/options/roles.htm')", 'support');
    Toolbar.addButton(R.NEW, "Templates.newRolePane()", "new");
    var roles = Query.select("System.roles", "*", "", "name");

    List.addItemBox("", R.EDITROLES, "", "img:group");
    List.addHeader([R.ROLE, R.FORMGROUPS, R.FORMS]);
    for (var i = 0; i < roles.length; i++) {
        var role = roles[i];
        var style = "img:group;oncontext:Templates.showRolePopup({role.id})";
        List.add([role.name, Templates.formatGroupNames(role.groupid), Templates.formatTemplateNames(role.templateid)], "Templates.editRole({role.id})", style);
    }
    List.show();
}

Templates.formatGroupNames = function (groupid) {
    if (groupid == "all") return R.ALL;
    else return Query.names("Forms.groups", groupid);
}

Templates.formatTemplateNames = function (templateid) {
    if (templateid == "all") return R.ALL;
    else return Query.names("Forms.templates", templateid);
}

Templates.newRolePane = function () {
    Toolbar.setTitle(R.NEWROLE);
    Toolbar.addButton(R.SAVE, "Templates.onNewRole()", "save");
    List.addTextBox("name", R.NAME, "");
    List.show("pane");
}

Templates.onNewRole = function () {
    var name = List.getValue("name");
    if (name == "") {
        App.alert(R.ENTERNAME);
        return;
    }
    var id = Query.insert("System.roles", { name: name });
    History.redirect("Templates.editRole({id})");
}

Templates.editRole = function (id) {
    var role = Query.selectId("System.roles", id);
    var onchange = "Query.updateId('System.roles',{id},this.id,this.value);";
    Toolbar.addTab(R.ROLE, "Templates.editRole({id})");
    List.addItemBox("", role.name, "", "img:contact");

    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "Templates.deleteRole({id})", "delete");
    List.forceNewLine = true;
    List.addTextBox("name", R.NAME, role.name, onchange);
    List.addComboBoxMulti("groupid", R.FORMGROUPS, role.groupid, "Templates.onUpdateGroupRights({id},this.value)", "all:" + R.ALL + "|" + Query.options("Forms.groups"));
    List.addComboBoxMulti("templateid", R.FORMS, role.templateid,  "Templates.onUpdateTemplateRights({id},this.value)", Templates.getTemplateOptions(role.groupid));
    List.show();
}

Templates.deleteRole = function (id) {
    Query.deleteId("System.roles", id);
    History.back();
}

Templates.onUpdateGroupRights = function (roleid, groupid) {
    if (MultiValue.contains(groupid, "all")) groupid = "all";
    Query.updateId('System.roles', roleid, "groupid", groupid);
    History.reload();
}

Templates.onUpdateTemplateRights = function (roleid, templateid) {
    if (MultiValue.contains(templateid, "all")) templateid = "all";
    Query.updateId('System.roles', roleid, "templateid", templateid);
    History.reload();
}


Templates.getTemplateOptions = function (groupids) {
    var options = [];
    options.push("all:" + R.ALL);
    var templates = Query.select("Forms.templates", "id;name;groupid", "", "name");
    for (var i = 0; i < templates.length; i++) {
        var template = templates[i];
        var add = false;
        if (groupids == "all") {
            add = (template.groupid == "");
        } else {
            add = (template.groupid == "" || MultiValue.contains(groupids, template.groupid) == false);
        } 
        if (add) {
            var label = template.name;
            if (template.groupid) label += " (" + Query.names("Forms.groups", template.groupid) + ")";
            options.push(template.id + ":" + label);
        }
    }

    return options.join("|");
}

Templates.duplicateRole = function (roleid) {
    var role = Query.selectId("System.roles", roleid);
    var newRole = Utils.clone(role);
    newRole.name += " Copy";
    Query.insert("System.roles", newRole);
    History.reload();
}

Templates.showRolePopup = function (roleid) {
    Popup.add(R.DUPLICATE, "Templates.duplicateRole({roleid})", "img:duplicate");
    Popup.show();
}

