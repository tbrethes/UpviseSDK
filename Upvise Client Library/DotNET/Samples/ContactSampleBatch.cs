using System;
using com.upvise.client;

namespace com.upvise.samples {

    class ContactSampleBatch {

        public void run() {
            try {
                // Login
                string token = Query.login("demobiz@upvise.com", "demobiz");
                Query query = new Query(token);

                // 1. Start a batch operation
                query.beginBatch();
                for (var i = 1; i < 5; i++) {
                    // 2. Create a new contact
                    Contact contact = new Contact();
                    contact.id = "JOHN_ID" + i;
                    contact.name = "John " + i;
                    contact.email = "John" + i + "@gmail.com";
                    // this add the insert query to the internal batch query buffer
                    query.insert(Contact.TABLE, contact.toJson());
                }
                // this performs one HTTPS web service call and executes all previous queries
                query.commitBatch();

                // 2. Now Batch Update the Records
                query.beginBatch();
                for (var i = 1; i < 5; i++) {
                    Contact updatedValues = new Contact();
                    updatedValues.email = "john" + i + "@yahoo.com";
                    query.updateId(Contact.TABLE, "JOHN_ID" + i, updatedValues.toJson());
                }
                query.commitBatch();

                // 3. Now Batch Delete the Records
                query.beginBatch();
                for (var i = 1; i < 5; i++) {
                    query.deleteId(Contact.TABLE, "JOHN_ID" + i);
                }
                query.commitBatch();
            } catch (Exception e) {
                Console.WriteLine("Error:" + e.Message);
            }
        }
    }
}
