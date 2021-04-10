using System;
using UpviseClient;

namespace UpviseSample {

    class NotifSample {

        public static void Run() {
            try {
                var query = Query.login("[email]", "[password]");
                
                // Start the batch
                query.beginBatch(); 

                // 1. Create a new project
                var PROJ_ID = "PROJ-0001";
                JSONObject project = new JSONObject();
                project.put("id", PROJ_ID);
                project.put("name", "Test Project");

                DateTime startdate = DateTime.Today.AddDays(-10);
                project.put("startdate", startdate);
                
                DateTime enddate = DateTime.Today.AddDays(90);
                project.put("enddate", enddate);
                
                query.insert(Project.TABLE, project);
                
                // 2. Send a push notification with a link to the new project to a user

                // Email of an Upvise user in the same database (but not the email used in Query.login()). 
                var userEmail = "test@gmail.com"; 
                query.sendNotif(userEmail, "New Project", "Notif body goes here", "Projects.viewProject('" + PROJ_ID+ "')");
                
                // Commit all insert / update
                query.commitBatch();

                // 3. Select the newly created project
                var items = query.select(Project.TABLE, "id='" + PROJ_ID + "'");
                foreach (var item in items) {
                    Console.WriteLine(item.ToString());
                }      
            } catch (Exception e) {
                Console.WriteLine("Error: " + e.Message);
            }            
        }
    }
}
