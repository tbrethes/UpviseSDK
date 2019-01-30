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

        public void login() {
            logStart("Start Login...");
            // Login : replace with your Upvise email and password
            mQuery = Query.login("email", "password");
            logFinish("Login OK");
            
        }

        public void run() {

            login();

            // Insert new Jobs
            logStart("Inserting New Jobs...");
            JobSampleBatchInsert insert = new JobSampleBatchInsert(mQuery);
            insert.run();
            logFinish("Finished Inserting jobs");

            logStart("Simulating job completion");
            insert.updateJobsAsCompleted();
            logFinish("Done");

            // Get Completed Jobs
            logStart("Getting Complete Jobs and Photos...");
            JobSampleBatch2Completed completed = new JobSampleBatch2Completed(mQuery);
            completed.run();
            logFinish("Finished Getting Completed jobs");

            // Run Configuration (once per day at night for example)
            JobSampleHolidays holidays = new JobSampleHolidays(mQuery);
            holidays.run();
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
