Config.appid = "dashboard3";
Config.title = "Forms Map";
Config.version = "1";


function leftpane() {
    List.show("leftpane");
}

function main() {
    var templatename = "My Template Name";
    var templates = Query.select("Forms.templates", "id", "name={templatename}");
    var templateid = (templates.length > 1) ? templates[0].id : "";
    
    // Show the list of forms in a Map
    var forms = Query.select("Forms.forms", "*", "template={templateid}");
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        var label = form.name;
        Map.addItem(label, form.geo, "Forms.viewForm({form.id})");
   }
   Map.show();
}