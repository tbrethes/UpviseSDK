using System.Collections.Generic;
using com.upvise.client;
using System;

namespace com.upvise.samples {
    class JobSample {

        public void run() {
            string token = Query.login("demobiz@upvise.com", "demobiz");
            Query query = new Query(token);

            // 1. insert one job
            Job newjob = new Job();
            newjob.id = "ID1";
            newjob.status = Job.OPEN;
            newjob.name = "Maintain Air Conditining";
            newjob.note = "Verify gaz pressure";
            newjob.duedate = DateTime.Now.AddHours(2);
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
            updatedValues.checkout = DateTime.Now;
            updatedValues.checkoutnote = "Aircon is leaking, requirews further fixing";

            query.updateId(Job.TABLE, "ID1", updatedValues.toJson());

            // 3. Select All Completed Jobs
            JSONObject where = new JSONObject();
            where.put("status", Job.COMPLETED);
            JSONObject[] completedJobs = query.select(Job.TABLE, where);
            foreach (JSONObject obj in completedJobs) {
                Job job = Job.fromJson(obj);

                Console.Write("Checkout note: " + job.checkoutnote);
                Console.Write("Custom Field 1: " + job.getCustomField("F1"));
                Console.Write("Custom Field 2: " + job.getCustomField("F2"));
                
                // Download all photos for the Job
                File[] files = query.selectFiles(Job.TABLE, job.id);
                foreach (File file in files) {
                    if (file.mime == "image/jpeg") {
                        byte[] content = query.downloadFile(file.id);
                        string filename = @"c:\temp\" + file.name + ".jpeg";
                        System.IO.File.WriteAllBytes(filename, content);
                    }
                }

                // Get All forms for the Job
                JSONObject formWhere = new JSONObject();
                formWhere.put("linkedid", job.id);
                JSONObject[] forms = query.select(Form.TABLE, formWhere);
                foreach (JSONObject formObj in forms) {
                    Form form = Form.fromJson(formObj, query);
                    Console.WriteLine("Form : " + formObj.serialize());
                }
            }

            // 4. Delete completed Jobs in batch mode
            query.beginBatch();
            foreach (JSONObject obj in completedJobs) {
                string jobid = obj.getString("id");
                query.deleteId(Job.TABLE, jobid);
            }
            query.commitBatch();
        }
    }
}
