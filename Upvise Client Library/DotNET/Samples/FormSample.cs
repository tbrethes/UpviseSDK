using System.Collections.Generic;
using com.upvise.client;
using System;

namespace com.upvise.samples {
    class FormSample {

        public void run() {
            string token = Query.login("demobiz@upvise.com", "demobiz");
            Query query = new Query(token);

            // 1. Get the Template Id for a given Template Name
            JSONObject where = new JSONObject();
            where.put("name", "My Template");
            Template template = null;
            JSONObject[] templates = query.select(Template.TABLE, where);
            if (templates.Length == 0) {
                // no template, creating a new one
            } else {
                template = Template.fromJson(templates[0]);
            }

            // 2. Selecting all submitted Forms for this template
            JSONObject where2 = new JSONObject();
            where2.put("templateid", template.id);
            where2.put("status", Form.SUBMITTED);
            JSONObject[] forms = query.select(Form.TABLE, where2);
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

