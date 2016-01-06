Config.appid = "sample";
Config.version = "6";
Config.title = "HashMap Sample";

Config.tables["leads"] = "id;name;regionid";
Config.tables["regions"] = "id;name";

function main(tab) {
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
