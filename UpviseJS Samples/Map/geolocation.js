Config.appid = "geolocation";
Config.version = "8";
Config.title = "Geo Location Sample";
Config.tables["defects"] = "id;name;geo;address;owner;date DATE";

function main() {
    Toolbar.setTitle("Defects");
    Toolbar.addButton("New", "newDefect()", "new");
    List.addItem("View List", "viewList()", "count:" + Query.count("defects"));
    List.addItem("View Map", "viewMap()");
    List.show();
}

function viewList() {
    var defects = Query.select("defects", "id;name;address;date", null, "date DESC");
    for (var i = 0; i < defects.length; i++) {
        var defect = defects[i];
        var style = "label:" + Format.datetime(defect.date);
        List.addItemSubtitle(defect.name, defect.address, "viewDefect({defect.id})", style);
    }
    List.show();
}

function viewMap() {
    var defects = Query.select("defects", "id;name;geo");
    for (var i = 0; i < defects.length; i++) {
        var defect = defects[i];
        Map.addItem(defect.name, defect.geo, "viewDefect({defect.id})");
    }
    Map.show();
}

function viewDefect(id) {
    var defect = Query.selectId("defects", id);
    if (defect == null) { History.back(); return; }
    Toolbar.setTitle("Defect");
    Toolbar.addButton("Edit", "editDefect({id})", "edit");
    List.addItemTitle(defect.name, Format.datetime(defect.date));
    List.addItemLabel("Address", defect.address, "App.map({defect.geo})");
    List.show();
}

function newDefect() {
    var values = { date: Date.now(), owner: User.getName(), name: "new defect" };
    values.geo = Settings.getLocation();
    values.address = Settings.getAddress(values.geo);
    var id = Query.insert("defects", values);
    History.redirect("editDefect({id})");
}

function editDefect(id) {
    var defect = Query.selectId("defects", id);
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteDefect({id})", "delete");

    var onchange = "Query.updateId('defects',{id},this.id,this.value)";
    List.addTextBox("name", "Description", defect.name, onchange, "text");
    List.addTextBox("date", "Date", defect.date, onchange, "date");
    List.show();
}

function deleteDefect(id) {
    Query.deleteId("defects", id);
    History.back();
}