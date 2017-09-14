/*
 * Copyright (C) 2017 Upvise
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
    class ArchiveClient {
        
        public void Run() {

            string token = Query.login("email", "password");
            Query query = new Query(token);
            
            ArchiveJobs(query);
            ArchiveForms(query);

            // Archive an entire project:
            // This will archive linked notes, tasks, milestones, forms, jobs and linked files/photos
            // Quotes & Invoices for the project are NOT ARCHUVED
            string projectid = ""; // some id
            Project.archive(projectid, query);
           
        }

        public static void ArchiveForms(Query query) {
            // Find All submitted forms older than 60 days.
            // You may implement a more complex stratewgyr for Form archiving based on specific form templateid also
            long cutOffDate = Query.toEpoch(DateTime.Today.AddDays(-60));
            JSONObject[] jobs = query.select("jobs.jobs", "status=" + Form.SUBMITTED + " AND date<" + cutOffDate);

            // Archive each job
            foreach (JSONObject job in jobs) {
                string formid = job.getString("id");

                // NOTE: Job.Archive() will archive related records for the job, like notes, tasks, forms and linked files and photos but NOT Quotes or Invoices
                Form.archive(formid, query);
            }
        }

        public static void ArchiveJobs(Query query) {
            // Find All completed jobs older than 60 days.
            long cutOffDate = Query.toEpoch(DateTime.Today.AddDays(-60));
            JSONObject[] jobs = query.select("jobs.jobs", "status=" + Job.COMPLETED + " AND duedate<" + cutOffDate);

            // Archive each job
            foreach (JSONObject job in jobs) {
                string jobid = job.getString("id");

                // NOTE: Job.Archive() will archive related records for the job, like notes, tasks, forms and linked files and photos but NOT Quotes or Invoices
                Job.archive(jobid, query);
            }
        }



    }
}
