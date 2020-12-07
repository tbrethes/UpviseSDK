Config.appid = "democustom";
Config.version = "1";
Config.title = "Custom";

function leftpane() {
    List.show("leftpane");
}

function main() {
    if (WebView.showUi == undefined) {
        List.addItem("Please upgrade to the latest Version of Upvise first.")
        List.show();
        return;
    }

    // Create your own HTML5 content.
    var html = [];
    html.push('<style>');
    html.push('.button {', 'padding:20px;margin:30px;text-align:center;background-color:green;color:white;font-size:20px;border-radius:10px;}');
    html.push('.icon {', 'width:30px;height:30px;padding:5px;border-radius:5px;}');
    html.push('</style>');

    // Use upvise.call(onclick) API inside the WebView screen to make a call back to upvise app.
    var onclick = "showList('1234')";
    onclick = "upvise.call(" + esc(onclick) + ")";
    html.push('<div class="button" onclick="', onclick, '">My Button</div>');

    // Reference Upvise icons
    var src = "contact" + (Settings.getPlatform() == 'iphone') ? "@2x" : "";
    html.push('<img class="icon" src="', src, '.png" />');  

    // Show it on screen
    WebView.showUi(html.join(''));
}

function showList(id) {
    List.addItemTitle("Upvise", id);
    for (var i = 0; i < 1000; i++) {
        List.addItem("Item " + i);
    }
    List.show();
}
