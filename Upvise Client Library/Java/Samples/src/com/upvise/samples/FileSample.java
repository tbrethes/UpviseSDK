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

package com.upvise.samples;

import com.upvise.client.File;
import com.upvise.client.Query;
import org.json.JSONObject;

import java.nio.file.Files;
import java.nio.file.Paths;

class FileSample {
    public void run() {
        try {
            // Login
            String token = Query.login("demobiz@upvise.com", "demobiz");
            Query query = new Query(token);

            // Create a new test Contact
            String contactId = "TESTCONTACT1";
            JSONObject contact = new JSONObject();
            contact.put("id", contactId);
            contact.put("name", "John Smith");
            query.insert("Contacts.contacts", contact);

            //  Now upload 5 simple test files linked to the test contact
            for (int i = 0; i < 5; i++) {
                File file = new File();
                file.id = "TESTFILE" + i;
                file.name = "Test File " + i;
                file.mime = "txt";

                file.linkedtable = "unybiz.contacts.contacts";
                file.linkedid = contactId;

                byte[] content = new String("This is a text file content").getBytes();
                // You can also load from a local file
                // byte[] content = Files.read((Paths.get("c:\\temp\\test.txt"));

                query.uploadFile(file, content);
                System.out.println("Uploaded one file : " + file.id);
            }

            // Select All Files for the contact and download their content
            JSONObject where = new JSONObject();
            where.put("linkedrecid", contactId);
            JSONObject[] files = query.select(File.TABLE, where);
            for (JSONObject obj : files) {
                File file = File.fromJson(obj);
                System.out.println("File ID: " + file.id);
                System.out.print(" Name: " + file.name);
                System.out.print(" Size: " + file.size + " bytes");
                System.out.print(" Creation Date: " + file.date);

                // Download and write in disk the file content
                byte[] content = query.downloadFile(file.id);
                Files.write(Paths.get("C:\\temp\\" + file.name + ".txt"), content);
            }

            // Delete All Files in batch operation
            query.beginBatch();
            for (JSONObject obj : files) {
                query.deleteId(File.TABLE, obj.getString("id"));
            }
            query.commitBatch();
            System.out.println(" Deleted Files!");

        } catch (Exception e) {
            System.out.println("Error:" + e.getMessage());
        }
    }


}