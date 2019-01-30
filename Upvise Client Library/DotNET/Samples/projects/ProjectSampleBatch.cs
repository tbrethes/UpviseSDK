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

using System.Collections.Generic;
using com.upvise.client;
using System;
using System.Xml;
using System.IO;
using System.Reflection;
using System.Text;

namespace com.upvise.samples {
    class ProjectSampleBatch {

        // Query object used to conect to Upvise Cloud
        Query mQuery;

        // List of jobs to create or update, loaded from XML
        List<Project> mProjectList;

        // Index of existing projects in Upvise, key is the project.id, value is the Project record as a JSONObject
        Dictionary<string, JSONObject> mUpviseProjectIndex;

        public void run() {
            // Login : replace with your Upvise email and password
            mQuery = Query.login("email", "password");
           

            // Step 0: Insert into Upbise the correct Project Groups and Stages
            // This should be done once at startup, at least
            mQuery.beginBatch();
            insertGroups();
            insertStages();
            mQuery.commitBatch();

            // Step 1: make a select query to Upvise Cloud and get all Upvise projects
            //store them in mUpviseContactIndex
            loadUpviseProjects();
       
            // Step 2: load and parse local XML
            string xmlFilename = Path.Combine(Path.GetDirectoryName(Assembly.GetEntryAssembly().Location), @"ProjectSampleBatch.xml");
            loadProjectsFromXml(xmlFilename);
            
            // Step 3: Batch Insert or Update Project List
            mQuery.beginBatch();

            int createdCount = 0;
            int modifiedCount = 0;
            foreach (Project project in mProjectList) {
                // does the project already exist in Upvise ?
                if (mUpviseProjectIndex.ContainsKey(project.id) == false) {
                    mQuery.insert(Project.TABLE, project.toJson());
                    createdCount++;
                } else {
                    JSONObject upviseProjet = mUpviseProjectIndex[project.id];
                    // get the modified values between the local project and the upviseProject.
                    // Use the diff() method of the JSONObject class to return only non identical values
                    JSONObject modifiedValues = project.toJson().diff(upviseProjet);
                    if (modifiedValues.length() > 0) {
                        // update the project with modified values if any
                        mQuery.updateId(Project.TABLE, project.id, modifiedValues);
                        modifiedCount++;
                    }
                }
            }
          
            mQuery.commitBatch();
            Console.WriteLine("Project created: " + createdCount);
            Console.WriteLine("Project modified: " + modifiedCount);

            // to retrieve data about completed Project instead of a fixed list of project, use
            // JSONObject[] completedProjects = query.select(Project.TABLE, "status=" + Project.COMPLETED);

            var newFormCount = 0;
            // Step 5 : Retrieve the Forms (unless there are in draft mode) for each project
            long lastSyncDate = getLastSyncDate();
            long newSyncDate = 0;
            foreach (Project project in mProjectList) {
                Form[] forms = project.selectForms(mQuery, lastSyncDate);
                // remember the new server date stamp
                if (newSyncDate == 0) newSyncDate = mQuery.lastServerDate;

                // Iterate through all forms,  ignore DRAFT ones
                foreach (Form form in forms) {
                    if (form.status != Form.DRAFT) {
                        // get the form data
                        string xml = form.writeXml();
                        System.IO.File.WriteAllText(@"C:\temp\FORM " + form.templatename + " " + form.name + ".xml", xml, Encoding.UTF8);

                        // download the PDF file for the form (work only if the correct settings in Forms Web has been set in Options)
                        // and also if the form has been archived first (for example if the form is in draft mode, it will return null)
                        byte[] pdfcontent = form.downloadPdfArchive(mQuery);
                        if (pdfcontent != null) {
                            string filename = @"C:\temp\FORM " + form.templatename + " " + form.name + ".pdf";
                            System.IO.File.WriteAllBytes(filename, pdfcontent);

                            newFormCount++;
                        }
                    }
                }
            }
            // Save the new last sync date
            saveLastSyncDate(newSyncDate);

            Console.WriteLine("newly downloaded forms: " + newFormCount);
        }
        
        private void insertGroups() {
            // Ensure that the Project Group are defined corrected in Upvise
            string[] GROUP_IDS = { "R1", "R2", "R3" };
            string[] GROUP_NAMES = { "Region 1", "Region 2", "Region 3" };
            for (var i = 0; i < GROUP_IDS.Length; i++) {
                JSONObject group = new JSONObject();
                group.put("id", GROUP_IDS[i]);
                group.put("name", GROUP_NAMES[i]);
                mQuery.insert(ProjectGroup.TABLE, group);
            }
        }

         private void insertStages() {
            // Ensure that the Project Stages are defined correctly in Upvise
            string[] STAGE_IDS = { "S1", "S2", "S3", "S4"};
            string[] STAGE_NAMES = { "Stage 1", "Stage 2", "Stage 3", "Stage 4" };
            for (var i = 0; i < STAGE_IDS.Length; i++) {
                JSONObject stage = new JSONObject();
                stage.put("id", STAGE_IDS[i]);
                stage.put("name", STAGE_NAMES[i]);
                stage.put("rank", i+1);
                mQuery.insert(ProjectStage.TABLE, stage);
            }
        }


        private void loadUpviseProjects() {
            // Create a dictionary based on project.id  key for fast lookup
            mUpviseProjectIndex = new Dictionary<string, JSONObject>();

            // Load All contacts from Upvise Cloud
            JSONObject[] projects = mQuery.select(Project.TABLE, "");

            // Add all returned contacts into the dictionary    
            foreach (JSONObject project in projects) {
                string projectid = project.getString("id");
                mUpviseProjectIndex[projectid] = project;
            }
        }

        private void loadProjectsFromXml(string xmlFilename) {
            // Create a list project
            mProjectList = new List<Project>();
          
            // Load the local XML project file and parse all projects
            Console.WriteLine("Loading and parsing Projects from " + xmlFilename);
            XmlDocument doc = new XmlDocument();
            doc.Load(xmlFilename);

            XmlNodeList nodeList = doc.SelectNodes("/root/project");
            foreach (XmlNode node in nodeList) {
                Project project = new Project();
                project.status = Job.OPEN; // means this is a new job
                project.owner = ""; // leave it blank for unassigned // TODO

                // Base Fields
                project.id = node.SelectSingleNode("id").InnerText; // this must be a unique Job ID
                project.name = node.SelectSingleNode("name").InnerText; // job name or title
                project.code = node.SelectSingleNode("code").InnerText; // job name or title
                project.note = node.SelectSingleNode("note").InnerText; // additional job description
                project.status = (node.SelectSingleNode("status").InnerText == "OPEN") ? Project.OPEN : Project.CLOSED;
                
                project.startdate = DateTime.Parse(node.SelectSingleNode("startdate").InnerText);
                project.enddate = DateTime.Parse(node.SelectSingleNode("enddate").InnerText);
                project.budget = Convert.ToInt32(node.SelectSingleNode("budget").InnerText);

                // groupid, stageid,
                project.groupid = node.SelectSingleNode("groupid").InnerText;
                project.stageid = node.SelectSingleNode("stageid").InnerText;
                
                // Address
                project.street = node.SelectSingleNode("address/street").InnerText;
                project.city = node.SelectSingleNode("address/city").InnerText;
                project.zipcode = node.SelectSingleNode("address/zipcode").InnerText;
                project.state = node.SelectSingleNode("address/state").InnerText;
                project.geo = node.SelectSingleNode("address/geo").InnerText;

                // Add some custom fields
                // note about custom fields : you need to declare the custom Field in the Jobs Web Application first and define their label and type first
                project.setCustomField("F1", node.SelectSingleNode("field1").InnerText);
                project.setCustomField("F2", node.SelectSingleNode("field2").InnerText);

                // Add the job to the list
                mProjectList.Add(project);
            }

            Console.WriteLine("loaded Projects:  " + mProjectList.Count + " ");
        }



        private static void saveLastSyncDate(long date) {
            System.IO.File.WriteAllText(getConfigFilename(), date.ToString());
        }

        // returned the last suceful sync date, stored locally on the filesystem.
        private static long getLastSyncDate() {
            try {
                string buffer = System.IO.File.ReadAllText(getConfigFilename());
                return long.Parse(buffer);
            } catch {
                return 0;
            }
        }

        private static string getConfigFilename() {
            return Path.Combine(Path.GetDirectoryName(Assembly.GetEntryAssembly().Location), @"config.txt");
                
        }


    }
}
