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

    public class PurchaseOrderSample {

        // Query object used to conect to Upvise Cloud
        Query mQuery;

        private JSONObject getCompany(string companyid) {
            JSONObject[] companies = mQuery.select("Contacts.companies", "id='"  + Query.esc(companyid) + "'");
            return companies.Length > 0 ? companies[0] : null;
        }

        private JSONObject getContact(string contactid) {
            JSONObject[] contacts = mQuery.select("Contacts.contacts", "id='" + Query.esc(contactid) + "'");
            return contacts.Length > 0 ? contacts[0] : null;
        }

        private JSONObject getProject(string projectid) {
            JSONObject[] projectis = mQuery.select("Projects.projects", "id='" + Query.esc(projectid) + "'");
            return projectis.Length > 0 ? projectis[0] : null;
        }

        private JSONObject[] getPOItems(string poid) {
            return mQuery.select("Sales.quoteproducts", "quoteid='" + Query.esc(poid) + "'");
        }

        public void Run() {
            // Login : replace with your Upvise email and password
            string token = Query.login("email", "password");
            mQuery = new Query(token);

            // Load All contacts from Upvise Cloud
            JSONObject[] purchaseOrderList = mQuery.select("Sales.quotes", "status=6 OR status=8"); // 6 : PO, 8 : confirmed PO

            // Add all returned contacts into the dictionary    
            foreach (JSONObject po in purchaseOrderList) {
                string poid = po.getString("id");

                JSONObject project = getProject(po.getString("projectid"));
                JSONObject company = getCompany(po.getString("companyid"));
                JSONObject contact = getContact(po.getString("contactid"));

                Console.WriteLine("#########################");
                Console.WriteLine("PO Number: " + po.getString("name"));
                Console.WriteLine("PO Date: " + po.getDate("date").ToString());
                Console.WriteLine("PO Description: " + po.getString("description"));

                if (project != null) Console.WriteLine("Project: " + project.getString("name"));
                if (company != null) Console.WriteLine("Supplier Company: " + company.getString("name"));
                if (contact != null) Console.WriteLine("Supplier Contact: " + contact.getString("name"));

                JSONObject[] items = getPOItems(poid);
                foreach(JSONObject item in items) {
                    Console.WriteLine("///////// PO Item");
                    Console.WriteLine("PO Item name:" + item.getString("productname"));
                    Console.WriteLine("PO Item description:" + item.getString("description"));
                    Console.WriteLine("PO Item Quantity:" + item.getDecimal("quantity"));
                    Console.WriteLine("PO Item Unit Price" + item.getDecimal("price"));
                    Console.WriteLine("PO Item Activity" + item.getString("activity"));                    
                }
            }
            
        }
        


    }
}
