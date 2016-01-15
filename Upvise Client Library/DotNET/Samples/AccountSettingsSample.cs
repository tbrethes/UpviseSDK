using com.upvise.client;
using System;

namespace com.upvise.samples {
    class AccountSettingsSample {

        public void run() {
            try {
                // Login
                string token = Query.login("demobiz@upvise.com", "demobiz");
                Query query = new Query(token);

                // Query the System.settings table 
                JSONObject where = new JSONObject();
                JSONObject[] items = query.select("System.settings", where);
                foreach (JSONObject item in items) {
                    //if ()
                }
            } catch(Exception e) {
                Console.WriteLine("Error: " + e.Message);
            }
        }
    }
}
