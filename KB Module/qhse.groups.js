function viewGroups() {
    var groups = Query.select("groups", "id;name", null, "rank");
    var procedures = Query.groupby("procedures", "groupid", "type=0");
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var count = procedures.count(group.id);
        List.addItem(group.name, "viewGroup({group.id})", "img=folder;number=" + count);
    }
    List.show();
}

function viewGroup(groupid) {
    var group = Query.selectId("groups", groupid);
    Toolbar.setTitle(group.name);
    if (User.isManager()) Toolbar.addButton(R.EDIT, "editGroup({groupid})", "edit");
    var where = "type=0 AND groupid CONTAINS {groupid}";
    viewArticleList(where);
}



