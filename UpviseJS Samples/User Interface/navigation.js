Config.appid = "sample";
Config.version = "2";
Config.title = "Sample 1";

function main() {
    Toolbar.setTitle("Page 1");
    List.addItemTitle("Navigation Sample");
    for (var i = 0; i < 50; i++) {
        List.addItem("View Item " + i, "showItem({i})");
    }
    List.show();
}

function showItem(i) {
    Toolbar.setTitle("Page " + i);
    List.addItem("Go Back", "History.back");
    List.show();
}
