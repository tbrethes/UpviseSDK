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
    class JobSampleBatch2Completed {

        // Query object used to conect to Upvise Cloud
        Query mQuery;
        
        private const string ROOT_FOLDER = @"C:\temp\COMPLETED_JOBS\";

        public JobSampleBatch2Completed(Query query) {
            mQuery = query;
        }
        
         public void run() {
            // Get the List of Completed Jobs
            // This will perform one select HTTPS query
            List<Job> completedJobList = getCompletedJobs();

            saveJobsToDisk(completedJobList);

            // get the list of job photos
            // This will perform one SELECT HTTPS query to get the list of all files
            // Then one HTTPS query per file is required for the downoad of the image
            File[] photos = downloadPhotos(completedJobList);
            
            // Delete the List of completed Jobs
            // This will perform one HTTPS batch query to delete all download jobs and photos
            deleteCompletedJobs(completedJobList, photos);
            
        }
        
        private void saveJobsToDisk(List<Job> jobs) {
            if (System.IO.Directory.Exists(ROOT_FOLDER) == false) {
                System.IO.Directory.CreateDirectory(ROOT_FOLDER);
            }
            foreach(Job job in jobs) {
                string jobid = job.id;
                string path = System.IO.Path.Combine(ROOT_FOLDER, jobid + ".xml");
                // the ToString() method of the JSON Object will serialize the job to JSON string
                System.IO.File.WriteAllText(path, job.toJson().toXML());
            }
        }
        

        private List<Job> getCompletedJobs() {
            List<Job> list = new List<Job>();

            string where = "status=" + Job.COMPLETED;
            JSONObject[] completedJobs = mQuery.select(Job.TABLE, where);
            foreach (JSONObject obj in completedJobs) {
                Job job = Job.fromJson(obj);
                list.Add(job);
            }
            return list;
        }

        private void deleteCompletedJobs(List<Job> jobs, File[] photos) {
            mQuery.beginBatch();
            foreach (Job job in jobs) {
               mQuery.deleteId(Job.TABLE, job.id);
            }

            foreach (File file in photos) {
                mQuery.deleteId(File.TABLE, file.id);
            }
            // This will perform only only HTTPS inset query
            mQuery.commitBatch();
        }
        
        private File[] downloadPhotos(List<Job> completedJobs) {
            List<File> list = new List<File>();

            // create a Hashmap of job ids
            Dictionary<string, Job> jobIndex = new Dictionary<string, Job>();
            foreach(Job job in completedJobs) {
                jobIndex[job.id] = job;
            }

            // get the entire list of files for jobs, even not completed one
            // Note : it is much more efficient to make ONE big query, instead then filtering out the photos we want
            // locally (for the completed job)
            // than to make 50 file queries, one for each complete Jobs, if we have 50 completed jobs.
            File[] files = mQuery.selectFiles(Job.TABLE, null);
            foreach(File file in files) {
                string jobid = file.linkedid;
                // If this file is a photo and is linked to a complete job, download it to disk
                if (jobIndex.ContainsKey(jobid) == true && file.mime == "image/jpeg") {
                        byte[] content = mQuery.downloadFile(file.id);
                        string filename = ROOT_FOLDER + jobid +  " - " + file.name + ".jpeg";
                        System.IO.File.WriteAllBytes(filename, content);
                }
            }
            return files;
        }
    }
}
