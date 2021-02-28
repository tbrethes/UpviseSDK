/*
 * Copyright (C) 2016-2021 Upvise
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
using System.Collections.Generic;
using System.Reflection;
using UpviseClient;

namespace UpviseSample {
    class JobSampleBatchInsert {

        // Query object used to conect to Upvise Cloud
        Query mQuery;
        
        private const int JOB_COUNT = 200;

        public JobSampleBatchInsert(Query query) {
            mQuery = query;
        }

        public void run() {
            // Step 1: create  a list of job to insert
            List<Job> newJobs = getNewJobList();

            // Step 2: insert the new jobs in Batch mode
            mQuery.beginBatch();
            foreach (Job job in newJobs) {
                mQuery.insert(Job.TABLE, job.toJson());
            }
            // This will perform only only HTTPS insert query
            mQuery.commitBatch();
           
        }
        
        
        private List<Job> getNewJobList() {
            // Create a list of jobs and contacts to create
            List<Job> list = new List<Job>();
            for (int i = 1; i < JOB_COUNT; i++) {
                Job job = new Job();
                job.status = Job.OPEN; // means this is a new job
                job.owner = ""; // leave it blank for unassigned

                // Base Fields
                job.id = "JOBID" + i;
                job.status = Job.OPEN;
                job.owner = "John Smith"; // Make sure the owner field is set to an actual Upise user
                job.name = "Job Title " + i;
                job.note = "Job Description " + i;
                job.priority = Job.HIGHPRIORITY;
                job.duedate = DateTime.Now.AddHours(2);

                // Address
                job.street = "74 Union St";
                job.city = "Sydney";
                job.zipcode = "2060";
                job.state = "NSW";
                job.country = "Australia"; // no need to send country
                job.geo = "-33.842056,151.203757";

                // Custom Fields
                // note about custom fields : you need to declare the custom Field in the Jobs Web Application first and define their label and type first
                // and obtain their id,  for example F1, F2,...
                job.setCustomField("F13", "Unit 123"); // UNIT
                job.setCustomField("F3", "on the right"); // METER LOCATION
                job.setCustomField("F15", "9495 2984"); // Customer Phone
                job.setCustomField("F8", "Notes about the customer"); // Note
                job.setCustomField("F16", "Service Order#"); // Service Order
                job.setCustomField("F18", "Contract#"); // Contract #

                // Meter Information
                job.setCustomField("F1", "Gas"); // METER TYPE
                job.setCustomField("F6", "RTETC12345"); // METER NUMBER
                job.setCustomField("F7", "REF:3434"); // MAPREF
                job.setCustomField("F10", "some note"); // METER NOTES
                job.setCustomField("F11", "111"); // PREVIOUS READ

                // Control
                job.setCustomField("F17", "3"); // Number of Dials
                job.setCustomField("F19", "1:Meter Read|2:Location Updated"); //  Completed Options
                job.setCustomField("F20", "1:Locked|2:Customer not here|3:Dog"); // Skip Options
                
                // Add the job to the list
                list.Add(job);
            }
            return list;
        }

        // Use this method to simulate the completion of a job to perform testing
        // This is usually not used in real case scenario unless you want yo update an existing job 
        public void updateJobsAsCompleted() {
            mQuery.beginBatch();
            for (int i = 1; i < JOB_COUNT; i++) {
                // 2. Update the existing job and mark it complete
                Job updatedValues = new Job();
                updatedValues.status = Job.COMPLETED;
                updatedValues.checkout = DateTime.Now;
                updatedValues.checkoutnote = "Aircon is leaking, requires further fixing";
                updatedValues.checkoutgeo = "1.11111,2.22222";

                mQuery.updateId(Job.TABLE, "JOBID" + i, updatedValues.toJson());
            }

            // Also upload one test photo linked to the first JOB
            File photo = new File();
            photo.id = "JOBPHOTO1";
            photo.name = "Sample Job Photo";
            photo.mime = "image/jpeg";
            photo.linkedtable = Job.TABLE;
            photo.linkedid = "JOBID1";
            string photoPath = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(Assembly.GetEntryAssembly().Location), @"JobSamplePhoto.jpg");
            byte[] content = System.IO.File.ReadAllBytes(photoPath);
            mQuery.uploadFile(photo, content);

            mQuery.commitBatch();
        }


    }
}
