/*
 * Copyright (C) 2017 Upvise
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

Config.appid = "dashboard4";
Config.version = "3";
Config.title = "Dashboard Table";

function leftpane() {
  List.show("leftpane");
}

// This sample display a long horizontally scrollable table with nicely formated colored date tags
function main() {
    // Set the table header using TableScroll.addHeader(array)
    var header = ["Staff"];
    for (var i = 1; i < 30; i++) header.push("Certificate " + i);
    TableScroll.addHeader(header);

    // Add all lines
    for (var i = 1; i < 10; i++) {
        var line = ["User " + i];
        for (var j = 1; j < 30; j++) {
            var date = Date.addDays(Date.today(), parseInt(Math.random() * 300) );
            var color = (Math.random() > 0.5) ? Color.GREEN : Color.BLUE;
            var str = Format.tag(Format.date(date), color);
            line.push(str);
        }
      	// Add a line using TableScroll.add(array)
    	TableScroll.add(line, "App.alert('Hello')");
    }
    // Display the table
    TableScroll.show();
    // don't forget this line to render the screen
    List.show();
}
