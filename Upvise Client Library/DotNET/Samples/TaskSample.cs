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
using System.Text;

using com.upvise.client;

namespace com.upvise.samples {

    class TaskSample {

        public void run() {
            try {
                // Login
                string token = Query.login("demobiz@upvise.com", "demobiz");
                Console.WriteLine("Login OK");

                // Create an instance of hte query class
                Query query = new Query(token);

                // Select all open tasks from the "Tasks.tasks" table 
                // You can go to your Upvise web account in the Task app and create some tasks first
                JSONObject where = new JSONObject();
                where.put("status", 0);
                JSONObject[] tasks = query.select("Tasks.tasks", where);
                Console.WriteLine("Found " + tasks.Length + " open tasks in this database");
                foreach (JSONObject task in tasks) {
                    Console.WriteLine("Task ID: " + task.getString("id"));
                    Console.WriteLine("Name: " + task.getString("name"));
                    Console.WriteLine("Due Date: " + task.getDate("duedate"));
                    Console.WriteLine("Owner: " + task.getString("owner"));
                    Console.WriteLine("Status:" + task.getInt("status"));
                }

                // Create a bunch of tasks using Batch operation
                Console.WriteLine("Creating 10 new tasks...");
                query.beginBatch();
                for (int i = 0; i < 10; i ++) {
                    JSONObject task = new JSONObject();
                    task.put("id", "TASKID_" + i);
                    task.put("name", "My Task " + i);
                    task.put("owner", "John");
                    task.put("status", 0);
                    task.putDate("duedate", DateTime.Now.AddDays(2));

                    query.insert("Tasks.tasks", task);
                }
                query.commitBatch();
                
                // update All open John's Tasks and mark them complete (status=1)
                where.put("owner", "John");
                where.put("status", 0);
                JSONObject[] myTasks = query.select("Tasks.tasks", where);
                Console.WriteLine("found " + myTasks.Length  + " open tasks for John");
                // Start a new batch operation to group all updates into one HTTPS request for best performance
                query.beginBatch();
                foreach(JSONObject task in myTasks) {
                    string id = task.getString("id");
                    JSONObject values = new JSONObject();
                    values.putDate("duedate", DateTime.Now);
                    values.put("status", 1);
                    query.updateId("Tasks.tasks", id, values);
                }
                query.commitBatch();
                Console.WriteLine("Updated the tasks to Complete");

                // Now Get All John's completed Tasks, export them in a file and delete them
                where.put("owner", "John");
                where.put("status", 1);
                JSONObject[] completedTasks = query.select("Tasks.tasks", where);
                Console.WriteLine("found " + completedTasks.Length + " completed tasks for John");

                StringBuilder buffer = new StringBuilder();
                // Start a new batch operation
                query.beginBatch();
                foreach (JSONObject task in completedTasks) {
                    string id = task.getString("id");
                    // Add the task data in the buffer
                    buffer.AppendLine(task.ToString());
                    query.deleteId("Tasks.tasks", id);

                }
                query.commitBatch();
                Console.WriteLine("Deleted completed tasks for John");
                // Save the file to disk
                System.IO.File.WriteAllText(@"C:\\temp\completedTasks.txt", buffer.ToString());
                
            } catch (Exception e) {
                Console.WriteLine("Error:" + e.Message);
            }
        }
    }
}
