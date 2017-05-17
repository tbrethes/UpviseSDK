using com.upvise.client;
using System;

namespace com.upvise.samples {
    class PurchaseOrderSample {

        public void run() {
            string token = Query.login("demobiz@upvise.com", "demobiz");
            Query query = new Query(token);



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
                where = "status=6 OR status=8"; // 6 : open PO, 8 : confirmed PO
                JSONObject[] poList = query.select("Sales.quotes", where);
                foreach (JSONObject po in poList) {
                    //Form form = Form.fromJson(formObj, query);
                
                    
                    // Iterate on each form field and print out its value
                    foreach(FormField field in form.fields) {
                        Console.Write(" Label: " + field.label);
                        Console.Write(" Value: " + field.value);
                        Console.Write(" Type " + field.type);
                        Console.WriteLine(" ID: " + field.name);

                        // For photo fields, Download all photos for the field
                        if (field.type == "photo") {
                            File[] files = query.selectFiles("unybiz.forms.forms", (string)field.value);
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
}
