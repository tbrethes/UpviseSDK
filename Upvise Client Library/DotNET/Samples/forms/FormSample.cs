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
    class FormSample {

        public void run() {
            Query query = Query.login("email", "password");

            // 1. Get the Template Id for a given Template Name
            string where = "name='My Template'";
            Template template = null;
            JSONObject[] templates = query.select(Template.TABLE, where);
            if (templates.Length == 0) {
                // no template, creating a new one
            } else {
                template = Template.fromJson(templates[0]);
            }

            // 2. Selecting all submitted Forms for this template
            where = "templateid='" + template.id + "' AND status=" + Form.SUBMITTED;
            JSONObject[] forms = query.select(Form.TABLE, where);
            foreach (JSONObject formObj in forms) {
                Form form = Form.fromJson(formObj, query);
                
                // Iterate on each form field and print out its value
                foreach(FormField field in form.fields) {
                    Console.Write(" Label: " + field.label);
                    Console.Write(" Value: " + field.value);
                    Console.Write(" Type " + field.type);
                    Console.WriteLine(" ID: " + field.name);

                    // For photo fields, Download all photos for the field
                    if (field.type == "photo") {
                        File[] files = query.selectFiles("unybiz.forms.forms", (string) field.value);
                        foreach(File file in files) {
                            byte[] content = query.downloadFile(file.id);
                            // TODO Save it to disk
                        }
                    }
                }
            }
        }
    }

}

