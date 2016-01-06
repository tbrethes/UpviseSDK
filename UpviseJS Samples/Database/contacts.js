Config.appid = "sample";
Config.version = "4";
Config.title = "Sample Contacts";

function main() {
    var contacts = Query.select("Contacts.contacts", "id;name;jobtitle", null, "name");
    contacts.forEach(function (contact) {
        List.addItemSubtitle(contact.name, contact.jobtitle, "viewContact({contact.id})");
    });
    List.show();
}

function viewContact(id) {
    var contact = Query.selectId("Contacts.contacts", id);
    List.addItemTitle(contact.name, contact.jobtitle);
    List.addItemLabel("Mobile", Format.phone(contact.mobile), "App.call({contact.mobile})");
    List.show();
}