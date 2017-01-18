
function viewRoleList() {
    if (User.isAdminOrManager()) Toolbar.addButton(R.EDITROLES, "editRoles()", "edit");
    var roles = Query.select("roles", "id;name", null, "name");
    for (var i = 0; i < roles.length; i++) {
        var role = roles[i];
        List.addItem(role.name, "viewRole({role.id})", "img:contact");
    }
    List.show();
}

function viewRole(roleid) {
    var where = "roleid CONTAINS {roleid}";
    viewArticleList(where);
}
