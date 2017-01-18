Config.appid = "sample";
Config.version = "6";
Config.title = "HashMap Sample";

Config.tables["leads"] = "id;name;regionid";
Config.tables["regions"] = "id;name";

Config.uses = "Files"; // need this to make a call for the Standard File app to view the photo.

function main() {
    List.addItem("Charts", "mainChart()", "img:chart;icon:arrow");
    List.addItem("Maps", "mainMap()", "img:map;icon:arrow");  
    List.addItem("Camera", "mainCamera()", "img:camera;icon:arrow");  
  
    List.show(); 
}

///////////////////////////////////

function mainChart(tab) {
    Toolbar.addTab("List", "main()");
    Toolbar.addTab("Chart", "main('chart')");

    // Insert some sample data
    insertSampleData();

    // Select All Leads
    var leads = Query.select("leads", "id;name;regionid", null, "name");

    // Iterate through all leads and group the leads in the HashMap based on their regionid field
    // The key for the HashMap is the regionid
    // The Value for the key in the HashMap is an object contains a label and a list of leads (items property)
    var map = new HashMap();
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        var obj = map.get(lead.regionid);
        if (obj == null) {
            // If the regionid key does not exist yet in the map, create it and add it
            obj = { label: Query.names("regions", lead.regionid), items: [] };
            map.set(lead.regionid, obj);
        }
        // add the lead to the object corresponding to its region
        obj.items.push(lead);
    }

    // Now we can write the list of regions and the number of leds per region in a list or chart
    if (tab == null) {
        List.addItemTitle("HashMap Sample");
        for (var i = 0; i < map.keys.length; i++) {
            var key = map.keys[i];
            var obj = map.get(key);
            List.addItem(obj.label, "viewLeadsByRegion({key})", "count:" + obj.items.length);
        }
        List.show();
    } else if (tab == "chart") {
        Chart.init();
        Chart.addColumn("string", "Region");
        Chart.addColumn("number", "Number of Leads");
        for (var i = 0; i < map.keys.length; i++) {
            var key = map.keys[i];
            var obj = map.get(key);
            Chart.addRow(obj.label, obj.items.length);
            Chart.addRowClick("viewLeadsByRegion({key})");
        }
        Chart.show("pie");
    }
}

function insertSampleData() {
    if (Query.count("regions") == 0) {
        Query.insert("regions", { id: "r1", name: "Europe" });
        Query.insert("regions", { id: "r2", name: "Asia" });
        Query.insert("regions", { id: "r3", name: "Africa" });
        Query.insert("regions", { id: "r4", name: "USA" });
    }

    //var leads = Query.select("leads", "id");
    //for (var i = 0; i < leads.length; i++) Query.deleteId("leads", leads[i].id);
    if (Query.count("leads") > 0) return;
    for (var i = 1; i < 100; i++) {
        var number = Math.round(Math.random() * 3) + 1;
        Query.insert("leads", { name: "Lead " + i, regionid: "r" + number });
    }
}

function viewLeadsByRegion(regionid) {
    var title = Query.names("regions", regionid);
    var where = "regionid={regionid}";
    var leads = Query.select("leads", "id;name", where, "name");

    Toolbar.setStyle("search");
    List.addItemTitle(title, leads.length + " Leads");
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        List.addItem(lead.name);
    }
    List.show();
}

////////////////////////////////

function mainMap() {
    List.addItemTitle("Map Sample");
    List.addItemSubtitle("Start Map App", "Using App.map()", "startMapApp()");
    List.addItemSubtitle("Embed Map with markers", "Using Map class", "viewMap()");
    List.addItemSubtitle("User LocationMap", "Using Map class", "viewUserMap()");
    List.show();
}

function startMapApp() {
    List.addItemTitle("Start Map Application");
    List.addItemSubtitle("With Adress", "Paris, France", "App.map('Paris, France')");
    List.addItemSubtitle("With Geo Coordinates", "48.858238, 2.347918", "App.map('My Label','48.858238, 2.347918')");
    List.show();
}

function viewMap() {
    var cities = [{ name: "London", geo: "51.522020, -0.122198" }, { name: "Paris", geo: "48.858238, 2.347918" }, { name: "Berlin", geo: "52.518198, 13.380823"}];
    for (var i = 0; i < cities.length; i++) {
        var city = cities[i];
        Map.addItem(city.name, city.geo, "viewCity({city.name})");
    }
    Map.show();
}

function viewCity(name) {
    List.addItemTitle(name);
    List.show();
}

function viewUserMap() {
    Map.addUsers();
    Map.show();
}

///////////////////// Camera

function mainCamera() {
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
    List.addButton("EXPORT PDF", "exportPopup({id})");
  
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

///////////// EXPORT PDF

function exportPdf(leadid, action) {
    var lead = Query.selectId("leads", leadid);
    Pdf.clear();
    Pdf.tableStyle += "border:0;";
    Pdf.cellStyle += "border:0;";
    
    // Title
    Pdf.setHeader();
    Pdf.setTitle("Lead");
    Pdf.addLabel("Name", lead.name);
    Pdf.addLabel("Date", leadFormat.date(Date.now()));
    
    Pdf.addHeader("Lead Activity");
    Pdf.addLabel("Status", "Activity");
        
    Pdf.addLineHeader("Caption1", "Caption2", "Caption3", "Caption4");
    for (var i = 0; i < 10; i++) {
        Pdf.addLine("Item " + i, "Subtitle goes here", 'value1', 'value2', 'value3');
    }
    
    // Files
    var files = Files.select("sample.leads", id);
    if (files.length > 0) Pdf.addHeader("Photos");
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.mime.substr(0, 5) == "image") Pdf.addImage(file.id, 200);
    }

    Pdf.download("Lead " + lead.name + ".pdf");
}