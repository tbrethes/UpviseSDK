
using com.upvise.client;
using System;

namespace com.upvise.samples {

    class ContactSample {

        public void run() {
            try {
                // Login
                string token = Query.login("demobiz@upvise.com", "demobiz");
                Query query = new Query(token);

                // 1. Select All Contacts
                JSONObject[] items = query.select(Contact.TABLE, null);
                foreach (JSONObject item in items) {
                    // get Contact object from Json for easy record values manipulation
                    Contact contact = Contact.fromJson(item);
                    Console.WriteLine("Name: " + contact.name + ", email:" + contact.email + ", mobile: " + contact.mobile);
                }

                // 2. Create a new contact
                Contact newContact = new Contact();
                newContact.id = "MyUniqueId";
                newContact.name = "John Smith";
                newContact.email = "John@gmail.com";
                newContact.mobile = "6979 0486";
                newContact.jobtitle = "CTO";

                query.insert(Contact.TABLE, newContact.toJson());

                // Verify that the contact has been correctly inserted by selecting it again
                JSONObject obj = query.selectId(Contact.TABLE, newContact.id);
                if (obj != null) {
                    Console.WriteLine("Contact: " + obj.serialize());
                }

                // 3. Update Contact
                Contact updatedContact = new Contact();
                updatedContact.mobile = "111111";
                query.updateId(Contact.TABLE, newContact.id, updatedContact.toJson());

                // Verify that the contact has been correctly updated
                obj = query.selectId(Contact.TABLE, newContact.id);
                if (obj != null) {
                    Console.WriteLine("Contact Mobile:" + obj.getString("mobile"));
                }

                // 4. Delete Contact
                query.deleteId(Contact.TABLE, newContact.id);
                // Verify that the contact has been correctly updated
                obj = query.selectId(Contact.TABLE, newContact.id);
                if (obj == null) {
                    Console.WriteLine("Contact has been deleted");
                }
            } catch (Exception e) {
                Console.WriteLine("Error:" + e.Message);
            }
        }
    }
}
