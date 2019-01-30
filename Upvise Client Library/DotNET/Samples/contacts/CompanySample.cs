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

namespace com.upvise.samples {
    class CompanySample {

        // Query object used to conect to Upvise Cloud
        Query mQuery;

        // List of companies to create or update, loaded from XML
        List<Company> mCompanyList;

        // Index of existing companies in Upvise, key is the project.id, value is the Project record as a JSONObject
        Dictionary<string, JSONObject> mUpviseCompanyIndex;

        public void run() {
            mQuery = Query.login("email", "password");
            
            // Step 1: make a select query to Upvise Cloud and get all Upvise projects
            //store them in mUpviseContactIndex
            loadUpviseCompanies();
            
            // Step 2: load and parse local XML
            string xmlFilename = Path.Combine(Path.GetDirectoryName(Assembly.GetEntryAssembly().Location), @"CompanySample.xml");
            loadCompaniesFromXml(xmlFilename);
            
            // Step 3: Batch Insert or Update Project List
            mQuery.beginBatch();

            int createdCount = 0;
            int modifiedCount = 0;
            foreach (Company company in mCompanyList) {
                // does the company already exist in Upvise ?
                if (mUpviseCompanyIndex.ContainsKey(company.id) == false) {
                    mQuery.insert(Company.TABLE, company.toJson());
                    createdCount++;
                } else {
                    JSONObject upviseCompany = mUpviseCompanyIndex[company.id];
                    // get the modified values between the local project and the upviseProject.
                    // Use the diff() method of the JSONObject class to return only non identical values
                    JSONObject modifiedValues = company.toJson().diff(upviseCompany);
                    if (modifiedValues.length() > 0) {
                        // update the project with modified values if any
                        mQuery.updateId(Company.TABLE, company.id, modifiedValues);
                        modifiedCount++;
                    }
                }
            }
          
            mQuery.commitBatch();
            Console.WriteLine("Companies created: " + createdCount);
            Console.WriteLine("Companies modified: " + modifiedCount);
        }
        
        private void loadUpviseCompanies() {
            // Create a dictionary based on company.id  key for fast lookup
            mUpviseCompanyIndex = new Dictionary<string, JSONObject>();

            // Load All contacts from Upvise Cloud
            JSONObject[] companies = mQuery.select(Company.TABLE, "");

            // Add all returned companies into the dictionary    
            foreach (JSONObject company in companies) {
                string companyid = company.getString("id");
                mUpviseCompanyIndex[companyid] = company;
            }
        }

        private void loadCompaniesFromXml(string xmlFilename) {
            // Create a list project
            mCompanyList = new List<Company>();
          
            // Load the local XML project file and parse all projects
            Console.WriteLine("Loading and parsing Company from " + xmlFilename);
            XmlDocument doc = new XmlDocument();
            doc.Load(xmlFilename);

            XmlNodeList nodeList = doc.SelectNodes("/root/company");
            foreach (XmlNode node in nodeList) {
                Company company = new Company();

                // Base Fields
                company.id = node.SelectSingleNode("id").InnerText; // this must be a unique Company ID
                company.name = node.SelectSingleNode("name").InnerText; 
                company.phone = node.SelectSingleNode("phone").InnerText;
                company.email = node.SelectSingleNode("email").InnerText;
                company.fax = node.SelectSingleNode("fax").InnerText;
                company.taxnumber = node.SelectSingleNode("taxnumber").InnerText;
                company.website = node.SelectSingleNode("website").InnerText;
                company.note = node.SelectSingleNode("note").InnerText;

                // groupid
                company.groupid = node.SelectSingleNode("groupid").InnerText;
                company.regionid = node.SelectSingleNode("regionid").InnerText;

                // Address
                company.street = node.SelectSingleNode("address/street").InnerText;
                company.city = node.SelectSingleNode("address/city").InnerText;
                company.zipcode = node.SelectSingleNode("address/zipcode").InnerText;
                company.state = node.SelectSingleNode("address/state").InnerText;
                company.geo = node.SelectSingleNode("address/geo").InnerText;

                // Add some custom fields
                // note about custom fields : you need to declare the custom Field ID and Label in the Contacts Web Application first
                company.setCustomField("F1", node.SelectSingleNode("field1").InnerText);
                company.setCustomField("F2", node.SelectSingleNode("field2").InnerText);

                // Add the job to the list
                mCompanyList.Add(company);
            }

            Console.WriteLine("loaded Companies:  " + mCompanyList.Count + " ");
        }
        

    }
}
