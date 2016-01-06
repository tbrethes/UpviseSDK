Config.appid = "sample";
Config.version = "8";
Config.title = "Sortby";
Config.tables["leads"] = "id;name;date DATE";

// we store as a global variable the sortby user value
var _sortby = null;

function main() {
    Toolbar.setTitle("Leads");
    Toolbar.addButton("New", "newLead()", "new");
    // this button will popup the sort popup list, style="sortby" is a custom icon style for mobile.
    Toolbar.addButton("Sort", "popupSort()", "sortby");
    List.addItemTitle("SortBy Demo");

    // based on the value of the _sortby variable, compute the orderby SQL clause
    var orderby = "name"; // default is name
    if (_sortby == "mostrecent") orderby = "date DESC";
    else if (_sortby == "date") orderby = "date";

    List.addHeader(_sortby);
    var leads = Query.select("leads", "id;name;date", null, orderby);
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        List.addItemSubtitle(lead.name, Format.datetime(lead.date), "viewLead({lead.id})");
    }
    List.show();
}

// Display a popup list for sorting options
function popupSort() {
    Toolbar.setTitle("Sort By");
    List.addItem("Name", "onSort('name')");
    List.addItem("Date", "onSort('date')");
    List.addItem("Most Recent", "onSort('mostrecent')");
    List.show("popup"); // popup parameter wil ensure that this screen is not added to the history.
}

// this callback function stores the user selection in the _sortby variable and refreshes the current list screen.
function onSort(value) {
    _sortby = value;
    History.reload();
}

function viewLead(id) {
    var lead = Query.selectId("leads", id);
    Toolbar.setTitle("Lead Info");
    List.addItemTitle(lead.name);
    List.addItemLabel("Date", Format.datetime(lead.date));
    List.show();
}

function newLead() {
    var name = App.prompt("Lead Name", "");
    if (name == null) return;
    var id = Query.insert("leads", { name: name, date: Date.now() });
    History.reload();
}