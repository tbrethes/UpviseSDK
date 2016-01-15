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
using System.Collections.Generic;
using System.Reflection;
using com.upvise.client;

namespace com.upvise.samples {
    class JobSampleBatch2 {

        // Query object used to conect to Upvise Cloud
        Query mQuery;
        
        DateTime mLogStartDate;

        private const string PHOTO_FOLDER = @"C:\temp\photos";
        private const int JOB_COUNT = 50;

        public void run() {

            // Step 1: login
            logStart("Start Login...");
            string token = Query.login("demobiz@upvise.com", "demobiz");
            logFinish("Login OK");

            mQuery = new Query(token);

            // Step 2: create  a list of job to insert
            List<Job> newJobs = getNewJobList();

            // Step 3: insert the new jobs in Batch mode
            insertNewJobs(newJobs);

            // Step 4 : Simulate job completion
            // note : this is used for testing, in a real lie system, jobs would be completed only on the mobile
            updateJobsAsCompleted();

            // 5. Get the List of Completed Jobs
            List<Job> completedJobList = getCompletedJobs();

            /*
            foreach(Job job in completedJobList) {
                Console.WriteLine("////////////////");
                Console.WriteLine("Completed JobID: " + job.id);

                Console.WriteLine("Checkout Time: " + job.checkout);
                Console.WriteLine("Checkout Geo Coordinates: " + job.checkoutgeo);
                Console.WriteLine("Checkout Note: " + job.checkoutnote);

                Console.WriteLine("Meter Number: " + job.getCustomField("F6"));
                Console.WriteLine("Meter Location: " + job.getCustomField("F3"));
                Console.WriteLine("Customer Info: " + job.getCustomField("F8"));

                Console.WriteLine("Current Read: " + job.getCustomField("F12"));
                Console.WriteLine("Completed Action: " + job.getCustomField("F5"));
                Console.WriteLine("Skip Action: " + job.getCustomField("F14"));
                for (int i = 0; i < 20; i++) {
                    string value = (string) job.getCustomField("F" + (i + 50));
                    if (value == null || value == "") break;
                    else Console.WriteLine("Electricity Reading: " + value);
                }
            }
            */
            // 6. Delete the List of completed Jobs
            deleteCompletedJobs(completedJobList);

            // get the list of job photos
            File[] photos = downloadPhotos(completedJobList);
            
            // delete Job Photos
            deletePhotos(photos);

            // TESTING : this should be done only every month or year.
            JobSampleHolidays holidays = new JobSampleHolidays(mQuery);
            holidays.run();
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

        private void insertNewJobs(List<Job> list) {
            // Step 4: Batch Insert Jobs ad Contact
            logStart("Inserting New Job...");
            mQuery.beginBatch();
            foreach (Job job in list) {
                mQuery.insert(Job.TABLE, job.toJson());
            }
            // This will perform only only HTTPS insert query
            mQuery.commitBatch();
            logFinish("Finished Inserting " + list.Count + " jobs");
        }

        private void updateJobsAsCompleted() {
            logStart("Starting updating Jobs");
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
            mQuery.uploadFile(photo,  content);

            mQuery.commitBatch();
            logFinish("Finished updating Jobs");
        }
        
        private List<Job> getCompletedJobs() {
            logStart("Getting Completed Jobs");
            List<Job> list = new List<Job>();

            JSONObject where = new JSONObject();
            where.put("status", Job.COMPLETED);
            JSONObject[] completedJobs = mQuery.select(Job.TABLE, where);
            foreach (JSONObject obj in completedJobs) {
                Job job = Job.fromJson(obj);
                list.Add(job);
            }
            logFinish("Finished getting " + list.Count + " completed Jobs");
            return list;
        }

        private void deleteCompletedJobs(List<Job> list) {
            logStart("Starting deleting jobs....");
            mQuery.beginBatch();
            foreach (Job job in list) {
                mQuery.deleteId(Job.TABLE, job.id);
            }
            // This will perform only only HTTPS inset query
            mQuery.commitBatch();
            logFinish("Finished deleting " + list.Count + " jobs");
        }
        
        private File[] downloadPhotos(List<Job> completedJobs) {
            List<File> list = new List<File>();

            // create a Hashmap of job ids
            Dictionary<string, Job> jobIndex = new Dictionary<string, Job>();
            foreach(Job job in completedJobs) {
                jobIndex[job.id] = job;
            }

            // get the entire list of files for jobs, even not completed one
            File[] files = mQuery.selectFiles(Job.TABLE, null);
            foreach(File file in files) {
                string jobid = file.linkedid;
                // If this file is a photo and is linked to a complete job, download it to disk
                if (jobIndex.ContainsKey(jobid) == true && file.mime == "image/jpeg") {
                        byte[] content = mQuery.downloadFile(file.id);
                        string filename = PHOTO_FOLDER + jobid +  " - " + file.name + ".jpeg";
                        System.IO.File.WriteAllBytes(filename, content);
                }
            }
            return files;
        }

        private void deletePhotos(File[] files) {
            logStart("Starting deleting photos....");
            mQuery.beginBatch();
            foreach (File file in files) {
                mQuery.deleteId(File.TABLE, file.id);
            }
            // This will perform only only HTTPS inset query
            mQuery.commitBatch();
            logFinish("Finished deleting " + files.Length + " photos");
        }

        ///// logging utiliies

        private void logStart(string message) {
            mLogStartDate = DateTime.Now;
            Console.WriteLine(message);
        }

        private void logFinish(string message) {
            long processingTime = Convert.ToInt64((DateTime.Now - mLogStartDate).TotalMilliseconds);
            float seconds = ((float) processingTime) / 1000;
            seconds  = (float) Math.Round( seconds, 2);
            Console.WriteLine(message + "(" + seconds + "s)");
        }
        
    }
}
