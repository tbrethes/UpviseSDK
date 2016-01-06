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
using System.Text;

namespace com.upvise.samples {

    class FileSample {
        public void run() {
            try {
                // Login
                string token = Query.login("demobiz@upvise.com", "demobiz");
                Query query = new Query(token);

                
                // Create a new test Contact
                string contactId = "TESTCONTACT1";
                JSONObject contact = new JSONObject();
                contact.put("id", contactId);
                contact.put("name", "John Smith");
                query.insert("Contacts.contacts", contact);

                //  Now upload 5 simple test files linked to the test contact
                for (var i = 0; i < 5; i++) {
                    File file = new File();
                    file.id = "TESTFILE" + i;
                    file.name = "Test File " + i;
                    file.mime = "txt";

                    file.linkedtable = "unybiz.contacts.contacts";
                    file.linkedid = contactId;

                    byte[] content = Encoding.UTF8.GetBytes("This is a text file content");
                    // You can also load from a local file
                    // byte[] content = System.IO.File.ReadAllBytes(@"c:\temp\test.txt");


                    query.uploadFile(file, content);
                    Console.WriteLine("Uploaded one file : " + file.id);
                }
                
                // Select All Files for the contact and download their content
                JSONObject where = new JSONObject();
                where.put("linkedrecid", contactId);
                JSONObject[] files = query.select(File.TABLE, where);
                foreach (JSONObject obj in files) {
                    File file = File.fromJson(obj);
                    Console.WriteLine("File ID: " + file.id);
                    Console.Write(" Name: " + file.name);
                    Console.Write(" Size: " + file.size + " bytes");
                    Console.Write(" Creation Date: " + file.date);

                    // Download and write in disk the file content
                    byte[] content = query.downloadFile(file.id);
                    System.IO.File.WriteAllBytes(@"C:\temp\" + file.name + ".txt", content);
                }

                // Delete All Files in batch operation
                query.beginBatch();
                foreach (JSONObject obj in files) {
                    query.deleteId(File.TABLE, obj.getString("id"));
                }
                query.commitBatch();
                Console.Write(" Deleted Files!");

            } catch (Exception e) {
                Console.WriteLine("Error:" + e.Message);
            }
        }


    }
}
