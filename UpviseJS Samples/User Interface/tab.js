Config.appid = "sample";
Config.version = "1";
Config.title = "Tabs";



function main() {
    List.addItemTitle("Tabs Sample");
    List.addItem("Simple Tab", "tab1()");
    List.addItem("Info / Activity Tab", "viewContact(543)");
    List.addItem("List / Map Tab", "viewCities()");
    List.show();
}

function tab1() {
    Toolbar.addTab("Tab 1", "tab1()");
    Toolbar.addTab("Tab 2", "tab2()");
    List.addItemTitle("This is Tab 1");
    List.show();
}

function tab2() {
    Toolbar.addTab("Tab 1", "tab1()");
    Toolbar.addTab("Tab 2", "tab2()");
    List.addItemTitle("This is Tab 2");
    List.show();
}

function viewContact(id, tab) {
    Toolbar.addTab("Info", "viewContact({id})");
    Toolbar.addTab("Activity", "viewContactActivity({id})");

    List.addItemTitle("John Smith", "Vice President");
    List.addItemLabel("phone", "1234332");
    List.addItemLabel("email", "john@gmail.com");
    List.show();
}

function viewContactActivity(id) {
    Toolbar.addTab("Info", "viewContact({id})");
    Toolbar.addTab("Activity", "viewContactActivity({id})");

    List.addItem("Notes", "", { count: 12, img: 'note' });
    List.addItem("Tasks", "", { count: 6, img: 'task' });
    List.addItem("Photos", "", { count: 3, img: 'file' });
    List.show();
}

// tab is an optional parameter = 0 or 1 to indicate which view to display "map" or "list"
function viewCities(tab) {
    var cities = [{ name: "London", geo: "51.522020, -0.122198" }, { name: "Paris", geo: "48.858238, 2.347918" }, { name: "Berlin", geo: "52.518198, 13.380823"}];

    Toolbar.addTab("List", "viewCities(0)");
    Toolbar.addTab("Map", "viewCities(1)");
    if (tab == 1) { // Map View
        cities.forEach(function (city) {
            Map.addItem(city.name, city.geo);
        });
        Map.show();
    } else { // List view
        cities.forEach(function (city) {
            List.addItem(city.name);
        });
        List.show();
    }
}