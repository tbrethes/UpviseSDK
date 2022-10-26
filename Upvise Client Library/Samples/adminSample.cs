using System;

using UpviseClient;

class AdminSample {

    // Call this for each client database you manage 
    public static void UpdateDashboard(string email, string password, string formTemplateId, string jsCode) {
        
        try {
            // 1. obtain a client connection to a given Upviser Database.
            // Give admin email/password
            var query = Query.login(email, password);

            var templateId = "XYZ";
            var dashboardJs = System.IO.File.ReadAllText(@"C:\temp\dash.js");
            
            var values = new JSONObject();
            values.put("dashboardjs", dashboardJs);

            // 2. Update the dashboard code for this form templateid
            query.beginBatch();
            query.updateId("Forms.templates", templateId, values);
            
            // 3. Update the custom apps 
            var values2 = new JSONObject();
            values2.put("value", dashboardJs);
            query.updateId("System.globalSettings", "tools.customjs", values2);
            
            query.commitBatch();

        } catch (Exception e) {
            Console.WriteLine(e.Message);
        }
    }

}


