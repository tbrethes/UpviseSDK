
Qhse.viewAssetGroups = function (type) {
    var grouptypes = Query.selectDistinct("Assets.groups", "type");
    if (grouptypes.length > 1) {
        for (var i = 0; i < grouptypes.length; i++) {
            var type = grouptypes[i].type;
            var name = (type != "") ? type : "#No Type";
            Popup.add(name, "Qhse.viewAssetGroupType({type})");
        }
        Popup.show();
    } else {
        Qhse.writeAssetGroups();
        List.show();
    }
}

Qhse.viewAssetGroupType = function (type) {
    Qhse.writeAssetGroups("type={type}");
    List.show();
}

Qhse.writeAssetGroups = function (where) {
    Toolbar.setStyle("search");
    var groups = Query.select("Assets.groups", "id;name", where, "name");
    var articles = Query.groupby("procedures", "assetgroupid");
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var count = articles.count(group.id);
        var where = "assetgroupid CONTAINS {group.id}";
        if (count > 0) List.addItem(group.name, "viewArticleList({where})", "img:folder;number:" + count);
    }
}