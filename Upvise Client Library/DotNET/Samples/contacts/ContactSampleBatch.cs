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

using System;
using com.upvise.client;

namespace com.upvise.samples {

    class ContactSampleBatch {

        public void run() {
            try {
                // Login : replace with your Upvise email and password
                Query query = Query.login("email", "password");
              
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
