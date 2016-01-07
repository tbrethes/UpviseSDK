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
import com.upvise.client.Form;
import com.upvise.client.Job;
import com.upvise.client.Query;
import org.json.JSONObject;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;

class JobSample {

    public void run() {
        try {
            String token = Query.login("demobiz@upvise.com", "demobiz");
            Query query = new Query(token);

            // 1. insert one job
            Job newjob = new Job();
            newjob.id = "ID1";
            newjob.status = Job.OPEN;
            newjob.name = "Maintain Air Conditining";
            newjob.note = "Verify gaz pressure";
            newjob.duedate = new Date().getTime() + 2 * 60 * 60 * 1000; // add 2 hours
            newjob.owner = "John"; // if you want to assign a Job, set the Upvise user Display name here
            newjob.street = "1 infinite Loop";
            newjob.city = "Cupertino";
            newjob.zipcode = "";
            newjob.country = "USA";
            newjob.geo = "12,3.444"; // set the coordinates for the job
            newjob.priority = Job.HIGHPRIORITY; // High priority

            // set some custom fields values
            newjob.setCustomField("F1", "WATER");
            newjob.setCustomField("F2", "12");

            query.insert(Job.TABLE, newjob.toJson());

            // 2. Update the existing job and mark it complete
            Job updatedValues = new Job();
            updatedValues.status = Job.COMPLETED;
            updatedValues.checkout = new Date().getTime();
            updatedValues.checkoutnote = "Aircon is leaking, requirews further fixing";

            query.updateId(Job.TABLE, "ID1", updatedValues.toJson());

            // 3. Select All Completed Jobs
            JSONObject where = new JSONObject();
            where.put("status", Job.COMPLETED);
            JSONObject[] completedJobs = query.select(Job.TABLE, where);
            for (JSONObject obj : completedJobs) {
                Job job = Job.fromJson(obj);

                System.out.println("Checkout note: " + job.checkoutnote);
                System.out.println("Custom Field 1: " + job.getCustomField("F1"));
                System.out.println("Custom Field 2: " + job.getCustomField("F2"));

                // Download all photos for the Job
                File[] files = query.selectFiles(Job.TABLE, job.id);
                for (File file : files) {
                    if (file.mime == "image/jpeg") {
                        byte[] content = query.downloadFile(file.id);
                        String filename = "c:\\temp\\" + file.name + ".jpeg ";
                        Files.write(Paths.get(filename), content);
                    }
                }

                // Get All forms for the Job
                JSONObject formWhere = new JSONObject();
                formWhere.put("linkedid", job.id);
                JSONObject[] forms = query.select(Form.TABLE, formWhere);
                for (JSONObject formObj : forms) {
                    Form form = Form.fromJson(formObj, query);
                    System.out.println("Form : " + formObj.toString());
                }
            }

            // 4. Delete completed Jobs in batch mode
            query.beginBatch();
            for (JSONObject obj : completedJobs) {
                String jobid = obj.getString("id");
                query.deleteId(Job.TABLE, jobid);
            }
            query.commitBatch();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}