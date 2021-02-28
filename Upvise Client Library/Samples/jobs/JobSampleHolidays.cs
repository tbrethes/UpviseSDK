using System;
using System.Text;
using System.Collections.Generic;

using UpviseClient;

namespace UpviseSample {
    class JobSampleHolidays {

        private Query mQuery;

        Dictionary<string, DateTime[]> mData;

        public JobSampleHolidays(Query query) {
            mQuery = query;
        }

        public void run() {
            loadHolidays();
            insertHolidays();
        }

        /// <summary>
        /// Returns a list dictionary object, The Key is the state in upperase and the value is an array if DateTime object for the holidays.
        /// </summary>
        /// <returns></returns>
        public void loadHolidays() {
            mData = new Dictionary<string, DateTime[]>();

            DateTime[] NWSHolidays = new DateTime[10];
            NWSHolidays[0] = new DateTime(2016, 1, 12, 12, 0, 0); // set time to noon to avoid issue with time zone 
            NWSHolidays[1] = new DateTime(2016, 3, 4, 12, 0, 0);
            mData["NSW"] = NWSHolidays;

            // TODO : do it for all other states
        }
        
        private void insertHolidays() {
            mQuery.beginBatch();

            // Iterate on each state, which is a key in the Dictionary data object
            foreach (string state in mData.Keys) {
                // get the array of dates for the state
                DateTime[] dates = mData[state];

                // Create a multi value variable containing all holiday dates
                MultiValue value = new MultiValue();
                foreach (DateTime date in dates) {
                    value.add(date);
                }
                // Insert one record on the Account Settings table, which has a key = state and a value  = date1|date2|..... in epoch formar
                JSONObject record = new JSONObject();
                record.put("id", "HOLIDAY_" + state);
                record.put("value", value.ToString());

                mQuery.insert("System.settings", record);
            }
            mQuery.commitBatch();
        }
    }
}
