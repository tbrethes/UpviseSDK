Config.appid = "sample";
Config.version = "3";
Config.title = "Camera";
Config.tables["leads"] = "id;name";
Config.uses = "Files"; // need this to make a call for the Standard File app to view the photo.

function main() {
    Toolbar.setTitle("Leads");
    Toolbar.addButton("New", "newLead()", "new");
    List.addItemTitle("Camera Demo");
    var leads = Query.select("leads", "id;name", null, "name");
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        List.addItem(lead.name, "viewLead({lead.id})");
    }
    List.show();
}

function viewLead(id) {
    var lead = Query.selectId("leads", id);
    Toolbar.setTitle("Lead Info");
    List.addItemTitle(lead.name);

    var files = Query.select("system.files", "id;name;date", "linkedtable='sample.leads' AND linkedrecid={id}", "date");
    List.addHeader("Photos (" + files.length + ")");
    List.addButton("New Photo", "App.takePicture('sample.leads',{id})");
    List.addHeader("Photos (" + files.length + ")");
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var img = Settings.getFileUrl(file.id);
        List.addItem(Format.datetime(file.date), "Files.viewFile({file.id})", "scale:crop;img:" + img);
    }
    List.show();
}

function newLead() {
    var name = App.prompt("Lead Name", "");
    if (name == null) return;
    var id = Query.insert("leads", {name:name});
    History.redirect("viewLead({id})"); 
}