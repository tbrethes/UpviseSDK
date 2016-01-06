Config.appid = "MyAppId";
Config.version = "8";
Config.title = "NFC Code Sample";

function MyAppId() {}

function leftpane() {}

function main() {
    List.addItemTitle("NFC Code Sample");
  	var info = [];
  	info.push("1. Make sure NFC is Enabled in Android Settings");
  	info.push("2. Select a Contact below");
  	info.push("3. Tap on Write NFC Tag");
  	info.push("4. Exit the app");
    info.push("5. Put your phone on top of the NFC Tag");
  	List.addItemLabel("How to use", info.join("\n"));
  	List.addHeader("Contacts");
    List.bindItems("Contacts.contacts", "name", null, "MyAppId.viewContact(this.id)");
    List.show();
}

MyAppId.viewContact = function(id) {
    var contact = Query.selectId("Contacts.contacts", id);
    if (contact == null) {History.back(); return;}
    Toolbar.setTitle("Contact");
    List.addItemTitle(contact.name, contact.jobtitle);
    var func = "MyAppId.viewContact({id})";
    List.addButton("Write NFC Tag", "App.writeNfc({func})");
    List.show();
}