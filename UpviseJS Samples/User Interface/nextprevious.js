Config.appid = "sample";
Config.version = "2";
Config.title = "Next Previous";

function main() {
    List.bindItems("Contacts.contacts", "name", "viewContact(this.id)");
    List.show();
}

function viewContact(id) {
    Toolbar.setStyle("nextprevious");
    var contact = Query.selectId("Contacts.contacts", id);
    List.addContactTitle(contact.name);
    List.addItemLabel("email", contact.email);
    List.addItemLabel("phone", contact.phone);
    List.show();
}