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
using com.upvise.client;

namespace com.upvise.samples {
    class RestoreSample {

        public void run() {

            // Find all forms for a given projects and restore them
            Query query = Query.login("email", "password");
            
            string where = "linkedtable='Projects.projects' AND linkedid='35b3ef435c3df630'";
            JSONObject[] deletedForms = query.select("forms.forms", where);

            if (deletedForms.Length > 0) {
                query.beginBatch();
                foreach (JSONObject form in deletedForms) {
                    query.restoreId("forms.forms", form.getString("id"));
                }
                query.commitBatch();

            }
            Console.WriteLine("Restored: " + deletedForms.Length + " records");
        }
    }
}
