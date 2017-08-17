
Qhse.viewRoleList = function () {
    writeToolbar();
    List.addTitle(R.ROLES);
    var roles = Query.select("roles", null, "name");
    List.addHeader([R.NAME, ""]);
    for (var i = 0; i < roles.length; i++) {
        var role = roles[i];
        List.add([role.name, ""], "viewRole({role.id})", "img:contact");
    }
    List.show();
}

function viewRole(roleid) {
    var role = Query.selectId("Qhse.roles", roleid);
    if (role == null) {History.back();return;}

    var articles = Query.select("Qhse.procedures", null, "roleid CONTAINS {role.id}", "rank");
    Toolbar.setTitle("Role Details");
    List.addItemTitle(role.name);
    writeArticleList(articles);
    List.show();
}

