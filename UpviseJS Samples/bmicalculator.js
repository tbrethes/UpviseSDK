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

Config.appid = "sample";
Config.version = "3";
Config.title = "Body Mass Index";

function main() {
    Toolbar.setTitle("Body Mass Index");
    List.addTextBox("weight", "Enter your weight (kg)", "70", null, "numeric");
    List.addTextBox("height", "Enter your height (cm)", "180", null, "numeric");
    List.addButton("Compute", "onButton()");
    List.show();
}

function onButton() {
    // get Values and validate them
    var weight = List.getValue("weight");
    var height = List.getValue("height");
    if (weight == null) { App.alert("Please enter your height"); return };
    if (height == null) { App.alert("Please enter your weight"); return };

    weight = parseInt(weight);
    height = parseInt(height);
    // Redirect to the result page
    History.redirect("viewResult({weight},{height})");
}

function viewResult(weight, height) {
    var bmi = weight * 10000 / Math.pow(height, 2);
    bmi = Math.round1(bmi); // Math.round1 is an UpviseJS addition tot he Javascript Math Object

    List.addItemTitle("Body Mass Index", bmi);
    List.addButton("Back", "History.back()");
    List.show();
}