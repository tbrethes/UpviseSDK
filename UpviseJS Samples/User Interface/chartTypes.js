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
Config.version = "11";
Config.title = "Chart Sample";

function main(tab) {
    List.addItemTitle("Charts")
    List.addItem("Vertical Bar", "viewBarChart()", "img:chart;icon:arrow");
    List.addItem("Vertical Bar with 2 series", "viewBarChart2()", "img:chart;icon:arrow");
    List.addItem("Vertical Stacked Bar", "viewStackBarChart()", "img:chart;icon:arrow");
  	List.addItem("Horizontal Bar", "viewBarChart(true)", "img:chart;icon:arrow");
    List.addItem("Horizontal Stacked Bar", "viewStackBarChart(true)", "img:chart;icon:arrow");
    List.addItem("Pie Chart", "viewPieChart()", "img:chart;icon:arrow");
    List.addItem("Donut Chart", "viewPieChart(true)", "img:chart;icon:arrow");
    List.addItem("Line Chart", "viewLineChart()", "img:chart;icon:arrow");
    List.show();
}

function viewBarChart(horizontal) {
    Chart.init();
    Chart.setColors(Color.GREEN);
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
    Chart.setColors(Color.ORANGE + ";" + Color.BROWN);
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
    Chart.setColors(Color.ORANGE + ";" + Color.BROWN);
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

function viewPieChart(isDonut) {
    Chart.init();
    Chart.addColumn("string", "Staff");
    Chart.addColumn("number", "Amount");
    
    var STAFF = ["John Ive", "Elon Musk", "Stee Jobs", "Bill Gates"];
    for (var i = 0; i < STAFF.length; i++) {
        var staff = STAFF[i];
        var amount = Math.random()*10000;
        Chart.addRow(staff, amount);
    }
  	Chart.show(isDonut ? "donut" : "pie");
  	if (WEB()) List.show();
}


function viewLineChart() {
    Chart.init();
    Chart.setColors(Color.ORANGE + ";" + Color.BROWN);
    Chart.addColumn("string", "Date");
    Chart.addColumn("number", "Open");
    Chart.addColumn("number", "Confirmed");
    
    for (var i = 0; i < 15; i++) {
        var date = Date.addDays(Date.today(), i);
        var amount = Math.random()*10000;
        var amount2 = Math.random()*5000;
        Chart.addRow(Format.date(date), amount, amount2);
    }
  	Chart.show("line");
  	if (WEB()) List.show();
}

