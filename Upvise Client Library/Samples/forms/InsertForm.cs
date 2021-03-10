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

using System;
using UpviseClient;

namespace UpviseSample {
    class InsertForm {

        public void run() {
            
            var form = new JSONObject();
            // Set a unique Upvise Internal form ID.to make sure it is globally unique within a Database
            // it ensures that if run multiple times, the code will update / reset the form, not create a new form
            form.put("id", "frm123"); 
            form.put("templateid", "XXX"); // set the form templateidd
            
            form.put("name", "FRM1");  // form name
            form.putDate("date", DateTime.Now); // set the form date 
            form.put("status", 0); // status 0 = draft, 1: submitted,
            form.put("owner", "John"); // optional field to set the owner of the form

            form.put("linkedid", "XXX"); // the id of the form linked record
            form.put("linkedtable", "assets.assets"); // the kind of the linked record, an asset in this example
            
            // Set some default values
            var value = new JSONObject();
            value.put("F1", "Some Default value"); // set the default value for the F1 field of the form template
            // TODO add more default field values here FXXX

            // OPTIONAL
            // if you do not want the user to be able to delete or duplicate the form, set these 2 values
            value.put("NODELETE", "1");
            value.put("NODUPLI", "1");
            
            // Add the default value to the form
            form.put("value", value.ToString());

            // login
            var query = Query.login("email", "password", "serverurl");
            query.beginBatch();
            // insert the new form
            query.insert("Forms.forms", form);
            query.commitBatch();
            
        }
    }

}

