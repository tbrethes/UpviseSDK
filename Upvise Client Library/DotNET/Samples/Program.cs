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
    class Program {
        static void Main(string[] args) {

            // TaskSample sample = new TaskSample();
            // ContactSample sample = new ContactSample();
            // ContactSampleBatch sample = new ContactSample();
            // FileSample sample = new FileSample();
            // JobSample sample = new JobSample();
            // JobSampleBatch sample = new JobSampleBatch();
            // JobSampleBatch2 sample = new JobSampleBatch2();
            //CompanySample sample = new CompanySample();

            //BackupClient sample = new BackupClient();
            //UserSample sample = new UserSample();

            //sample.Run();

            testJob();


        }

        private static void testJob() {
            // Login : replace with your Upvise email and password
            string token = Query.login("res@verticalmatters.com.au", "UjW^z75@");
            Query query = new Query(token);

            // 1. insert one job
            Job newjob = new Job();
            newjob.id = "ID1";
            newjob.status = Job.OPEN;
            newjob.name = "TEST JOB " + DateTime.UtcNow.ToString("HH:mm:ss");
            newjob.note = "this a a test note";
            newjob.duedate = DateTime.Now.AddHours(2);
            newjob.owner = "VMAdmin"; // if you want to assign a Job, set the Upvise user Display name here
            newjob.street = "1 infinite Loop";
            newjob.city = "Cupertino";
            newjob.zipcode = "";
            newjob.country = "USA";
            newjob.geo = "12,3.444"; // set the coordinates for the job
            newjob.priority = Job.HIGHPRIORITY; // High priority
            
            query.insert(Job.TABLE, newjob.toJson());
        }
        
    }

}
