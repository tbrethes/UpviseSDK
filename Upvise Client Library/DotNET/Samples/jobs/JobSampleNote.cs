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
    class JobSampleNote {

        public void run() {
            // Login : replace with your Upvise email and password
            Query query = Query.login("email", "password");
           
            // 1. insert one test job
            Job newjob = new Job();
            newjob.id = "ID1";
            newjob.status = Job.OPEN;
            newjob.name = "Maintain Air Conditining";
            newjob.note = "Verify gaz pressure";
            newjob.duedate = DateTime.Now.AddHours(2);
            newjob.owner = "John"; // if you want to assign a Job, set the Upvise user Display name here
            newjob.street = "1 infinite Loop";
            newjob.city = "Cupertino";
            newjob.country = "USA";
            newjob.geo = "12,3.444"; // set the coordinates for the job
            
            query.insert(Job.TABLE, newjob.toJson());

            // 2. Attach a Note to the Job
            JSONObject note = new JSONObject();
            note.put("description", "This is the <b>note</b> content"); // 
            note.put("jobid", "ID1"); // id of the job to link to
            note.put("creator", "John doe");
            note.putDate("creationdate", DateTime.Now);

            query.insert("Notes.notes", note);

            // 3. Attach a file to this job
            File file = new File();
            file.id = "TESTFILE1"; // unique id for the file, optional
            file.name = "testFile.pdf";
            file.mime = "application/pdf";
            file.linkedid = "ID1"; // job id
            file.linkedtable = Job.TABLE;
            byte[] content = System.IO.File.ReadAllBytes(@"c:\\temp\testFile.pdf");

            query.uploadFile(file, content);
        }
    }
}
