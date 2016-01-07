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

import com.upvise.client.Query;
import org.json.JSONObject;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;

class TaskSample {

    public void run() {
        try {
            // Login
            String token = Query.login("demobiz@upvise.com", "demobiz");
            System.out.println("Login OK");

            // Create an instance of hte query class
            Query query = new Query(token);

            // Select all open tasks from the "Tasks.tasks" table
            // You can go to your Upvise web account in the Task app and create some tasks first
            JSONObject where = new JSONObject();
            where.put("status", 0);
            JSONObject[] tasks = query.select("Tasks.tasks", where);
            System.out.println("Found " + tasks.length + " open tasks in this database");
            for (JSONObject task : tasks) {
                System.out.println("Task ID: " + task.getString("id"));
                System.out.println("Name: " + task.getString("name"));
                System.out.println("Due Date: " + new Date(task.getLong("duedate")).toString());
                System.out.println("Owner: " + task.getString("owner"));
                System.out.println("Status:" + task.getInt("status"));
            }

            // Create a bunch of tasks using Batch operation
            System.out.println("Creating 10 new tasks...");
            query.beginBatch();
            for (int i = 0; i < 10; i ++) {
                JSONObject task = new JSONObject();
                task.put("id", "TASKID_" + i);
                task.put("name", "My Task " + i);
                task.put("owner", "John");
                task.put("status", 0);
                task.put("duedate", new Date().getTime());

                query.insert("Tasks.tasks", task);
            }
            query.commitBatch();

            // update All open John's Tasks and mark them complete (status=1)
            where.put("owner", "John");
            where.put("status", 0);
            JSONObject[] myTasks = query.select("Tasks.tasks", where);
            System.out.println("found " + myTasks.length  + " open tasks for John");
            // Start a new batch operation to group all updates into one HTTPS request for best performance
            query.beginBatch();
            for(JSONObject task : myTasks) {
                String id = task.getString("id");
                JSONObject values = new JSONObject();
                values.put("duedate", new Date().getTime());
                values.put("status", 1);
                query.updateId("Tasks.tasks", id, values);
            }
            query.commitBatch();
            System.out.println("Updated the tasks to Complete");

            // Now Get All John's completed Tasks, export them in a file and delete them
            where.put("owner", "John");
            where.put("status", 1);
            JSONObject[] completedTasks = query.select("Tasks.tasks", where);
            System.out.println("found " + completedTasks.length + " completed tasks for John");

            StringBuilder buffer = new StringBuilder();
            // Start a new batch operation
            query.beginBatch();
            for (JSONObject task : completedTasks) {
                String id = task.getString("id");
                // Add the task data in the buffer.
                buffer.append(task.toString() + "\n");
                query.deleteId("Tasks.tasks", id);

            }
            query.commitBatch();
            System.out.println("Deleted completed tasks for John");
            // Save the file to disk
            Files.write( Paths.get("C:\\temp\\completedTasks.txt"), buffer.toString().getBytes());

        } catch (Exception e) {
            System.out.println("Error:" + e.getMessage());
        }
    }
}
