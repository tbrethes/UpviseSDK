/*
 * Copyright (C) 2016 Upvise
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

using com.upvise.client;
using System;

namespace com.upvise.samples {

    class ContactSample {

        public void run() {
            try {
                // Login
                string token = Query.login("email", "password");
                Query query = new Query(token);

                // 1. Select All Contacts
                JSONObject[] items = query.select(Contact.TABLE, "");
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
                    Console.WriteLine("Contact: " + obj.ToString());
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
