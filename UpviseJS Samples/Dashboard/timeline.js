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

Config.appid = "dashboard3";
Config.version = "1";
Config.title = "Dashboard3";

function leftpane() { List.show("leftpane");}

function main() {
    
}
   Chart.init();
        Chart.addColumn("string");
        Chart.addColumn("string");
        Chart.addColumn("date");
        Chart.addColumn("date");

        var startdate = new Date(2016, 4, 1);
        var stopdate = new Date(2016, 6, 1);
        Chart.addRow("Equipment# ", "Requested time frame", startdate, stopdate);
        Chart.addRowClick("", Color.GREEN);

        for (var i = 0; i < 10; i++) {
            var month = Math.floor(1 + 10 * Math.random());

            var date1 = new Date(2016, month, 5);
            var date2 = new Date(2016, month+1, 5);
            var color = (date2 < startdate || date1 > stopdate) ? Color.BLUE : Color.RED;
            Chart.addRow("Equipment " + i, "Project " + i, date1, date2);
            Chart.addRowClick("App.alert('Hello')", color);
        }
        Chart.show("timeline");
        List.show();