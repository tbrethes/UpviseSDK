/*
 * Copyright (C) 2016-2021 Upvise
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
using UpviseClient;
using System;
using System.Xml;
using System.Net;
using System.Web;
using System.IO;
using System.Reflection;

namespace UpviseSample {
    class JobSampleBatch {

        // Query object used to conect to Upvise Cloud
        Query mQuery;

        // List of jobs to create
        List<Job> mJobList;

        // List of contact to create
        List<Contact> mContactList;

        // Index of existing contacts in Upvise, key is the contact name, value contact ID
        Dictionary<string, string> mUpviseContactIndex;
        
        public void run() {
            // Login : replace with your Upvise email and password
            mQuery = Query.login("email", "password");
         
            // Step 1: make a query to Upvise Cloud and get all contacts
            //store them as a (name, id) dictionary in mUpviseContactIndex
            selectUpviseContacts();

            // Step 2: load and parse local XML
            // add the jobs and the contact to create into mJobList and mContactList
            string xmlFilename = Path.Combine(Path.GetDirectoryName(Assembly.GetEntryAssembly().Location), @"JobSampleBatch.xml");
            loadJobsFromXml(xmlFilename /*@"c:\temp\JobSampleBatch.xml"*/);

            // Step 3: Reverse geocode jobs
            reverseGeocodeJobs();

            // Step 4: Batch Insert Jobs ad Contact
            mQuery.beginBatch();

            foreach (Job job in mJobList) {
                mQuery.insert(Job.TABLE, job.toJson());
            }

            foreach (Contact contact in mContactList) {
                mQuery.insert(Contact.TABLE, contact.toJson());
            }

            mQuery.commitBatch();
            Console.WriteLine("Jobs inserted: " + mJobList.Count);
            Console.WriteLine("Contacts inserted: " + mContactList.Count);
        }

        private void selectUpviseContacts() {
            // Create a dictionary based on contact name key for fast lookup
            mUpviseContactIndex = new Dictionary<string, string>();

            // Load All contacts from Upvise Cloud
            JSONObject[] contacts = mQuery.select(Contact.TABLE, "");
            
            // Add all returned contacts into the dictionary    
            foreach (JSONObject contact in contacts) {
                string contactName = contact.getString("name");
                string contactId = contact.getString("id");
                mUpviseContactIndex[contactName] = contactId;
            }
        }
        
        private void loadJobsFromXml(string filename) {
            // Create a list of jobs and contacts to create
            mJobList = new List<Job>();
            mContactList = new List<Contact>();

            // Load the local XML job file and parse all jobs
            Console.WriteLine("Loading and parsing Jobs from " + filename);
            XmlDocument doc = new XmlDocument();
            doc.Load(filename);

            XmlNodeList nodeList = doc.SelectNodes("/root/job");
            foreach (XmlNode node in nodeList) {
                Job job = new Job();
                job.status = Job.OPEN; // means this is a new job
                job.owner = ""; // leave it blank for unassigned

                // Base Fields
                job.id = node.SelectSingleNode("id").InnerText; // this must be a unique Job ID
                job.name = node.SelectSingleNode("name").InnerText; // job name or title
                job.note = node.SelectSingleNode("note").InnerText; // additional job description
                job.priority = (node.SelectSingleNode("priority").InnerText == "high") ? Job.HIGHPRIORITY : 0;
                
                string strdate = node.SelectSingleNode("date").InnerText;
                job.duedate = DateTime.Parse(strdate); // job scheduled date
                
                job.duration = Convert.ToInt32(node.SelectSingleNode("duration").InnerText); // estimated duration in minutes

                // get the contact name and mobile
                Contact contact = new Contact();
                contact.name = node.SelectSingleNode("client/name").InnerText;
                contact.mobile = node.SelectSingleNode("client/mobile").InnerText;
                // if the contact is not yet in Upvise, add it to the list of contacts to create
                if (mUpviseContactIndex.ContainsKey(contact.name) == false) {
                    contact.id = Query.guid(contact.name);
                    job.contactid = contact.id;    
                    mContactList.Add(contact);
                } else {
                     // get the contact record ID from the index       
                    job.contactid = mUpviseContactIndex[contact.name];
                    
                }

                // Address
                job.street = node.SelectSingleNode("address/street").InnerText;
                job.city = node.SelectSingleNode("address/city").InnerText;
                job.zipcode = node.SelectSingleNode("address/zipcode").InnerText;
                job.state = node.SelectSingleNode("address/state").InnerText;
                //job.country = node.SelectSingleNode("address/country").InnerText;
                job.geo = node.SelectSingleNode("address/geo").InnerText;

                // Add some custom fields
                // note about custom fields : you need to declare the custom Field in the Jobs Web Application first and define their label and type first
                job.setCustomField("F1", node.SelectSingleNode("field1").InnerText);
                job.setCustomField("F2", node.SelectSingleNode("field2").InnerText);

                // Add the job to the list
                mJobList.Add(job);
            }

            Console.WriteLine("found " + mJobList.Count + " jobs to create");
            Console.WriteLine("found " + mContactList.Count + " contacts to create");
        }

        public void reverseGeocodeJobs() {
            foreach (Job job in mJobList) {
                // Resolve the geo location for the Job if the XML does not contain geo
                if (job.geo == null || job.geo.Length == 0) {
                    job.geo = geocodeGoogle(job);
                    // wait to avoid making qeries to fast
                    System.Threading.Thread.Sleep(200);
                }
            }
        }

        private string geocodeGoogle(Job job) {
            String buffer = job.street + " " + job.city + " " + job.zipcode + " " + job.state + " " + job.country;

            String url = "http://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=" + HttpUtility.UrlEncode(buffer);

            WebClient client = new WebClient();
            var content = client.DownloadString(url);

            String lat = extract(content, "<lat>", "</lat");
            String lng = extract(content, "<lng>", "</lng>");
            if (lat != null && lng != null) {
                return truncate(Convert.ToDouble(lat)) + "," + truncate(Convert.ToDouble(lng));
            } else {
                return "";
            }
        }

        private static string truncate(double value) {
            double aTruncated = Math.Truncate(value * 100000) / 100000;
            return aTruncated.ToString();
        }

        private string extract(string buffer, string start, string stop) {
            int index1 = buffer.IndexOf(start);
            if (index1 == -1) return null;
            index1 += start.Length;
            int index2 = buffer.IndexOf(stop, index1);
            if (index2 == -1) return null;
            return buffer.Substring(index1, index2 - index1);
        }


    }
}
