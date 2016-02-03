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

Config.appid = "chartsample";
Config.version = "9";
Config.title = "Chart Sample";

function main(tab) {
    List.addItem("Bar Chart", "viewBarChart()", "img:arrow");
    List.addItem("Bar Chart with 2 series", "viewBarChart2()", "img:arrow");
    List.addItem("Stack Bar Chart", "viewStackBarChart()", "img:arrow");
  	List.addItem("Horizontal Bar Chart", "viewBarChart(true)", "img:arrow");
    List.addItem("Horizontal Stack Bar Chart", "viewStackBarChart(true)", "img:arrow");
    List.addItem("Pie Chart", "viewPieChart()", "img:arrow");
    List.show();
}

function viewBarChart(horizontal) {
    Chart.init();
    Chart.addColumn("string", "Date");
    Chart.addColumn("number", "Amuount");
    
    for (var i = 0; i < 15; i++) {
        var date = Date.addDays(Date.today(), i);
        var amount = Math.random()*10000;
        Chart.addRow(Format.date(date), amount);
    }
  	Chart.show(horizontal ? "horizontalbar" : "bar");
  	if (WEB()) List.show();
}

function viewBarChart2() {
    Chart.init();
    Chart.addColumn("string", "Date");
    Chart.addColumn("number", "Amount");
    Chart.addColumn("number", "Confirmed");
    
    for (var i = 0; i < 15; i++) {
        var date = Date.addDays(Date.today(), i);
        var amount = Math.random()*10000;
        var amount2 = Math.random()*5000;
        Chart.addRow(Format.date(date), amount, amount2);
    }
    Chart.show("bar");
  	if (WEB()) List.show();
}

function viewStackBarChart(horizontal) {
    Chart.init();
    Chart.addColumn("string", "Date");
    Chart.addColumn("number", "Open");
    Chart.addColumn("number", "Confirmed");
    
    for (var i = 0; i < 15; i++) {
        var date = Date.addDays(Date.today(), i);
        var amount = Math.random()*10000;
        var amount2 = Math.random()*5000;
        Chart.addRow(Format.date(date), amount, amount2);
    }
  	Chart.show(horizontal ? "horizontalstackbar" : "stackbar");
  	if (WEB()) List.show();
}

function viewPieChart() {
    Chart.init();
    Chart.addColumn("string", "Staff");
    Chart.addColumn("number", "Amount");
    
    var STAFF = ["John Ive", "Elon Musk", "Stee Jobs", "Bill Gates"];
    for (var i = 0; i < STAFF.length; i++) {
        var staff = STAFF[i];
        var amount = Math.random()*10000;
        Chart.addRow(staff, amount);
    }
    Chart.show("pie");
  	if (WEB()) List.show();
}

