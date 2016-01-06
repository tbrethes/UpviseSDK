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

Config.appid = "mydashboard";
Config.version = "1";
Config.title = "Dashboard";
Config.uses = "Projects;Forms;Tools;Contacts;Time;Qhse";
Config.debug = true;

function leftpane() {
    List.addItem("Dashboard App");
    List.show("leftpane");
}

function main() {
    if (WEB() == false) {
        List.addItemTitle("Welcome", User.getName());

        List.addButton("Alert", "test()", "color:red");
        List.addItem("My Team", "Contacts.viewMyTeam()", "img:group;icon:arrow");
        List.addItem("Timesheets", "Time.main()", "img:clock;icon:arrow");
        List.addItem("Nearby Projects", "Projects.showNearby()", "img:project;icon:arrow");
        List.addItem("Forms", "Forms.main()", "img:form;icon:arrow");
        List.addItem("Equipment", "Tools.main()", "img:job;icon:arrow");
        List.addItem("Quest", "Qhse.main()", "img:support;icon:arrow");
        List.show();
    } else {
        List.addItemTitle("Welcome", User.getName());
        Layout.firstColumn();
        Grid.add("Timesheets", "AppLoader.openApp('time')", "img:clock");
        Grid.add("Contacts", "AppLoader.openApp('contacts')", "img:contact");
        Grid.add("Projects", "AppLoader.openApp('projects')", "img:project");
        Grid.add("Equipment", "AppLoader.openApp('tools')", "img:job");
        Grid.add("Forms", "AppLoader.openApp('forms')", "img:form");
        Grid.add("Knowledge Base", "AppLoader.openApp('qhse')", "img:app");

        Layout.secondColumn();
        var IMGURL = "https://www.upvise.com/jobs/img/mobilejob2.png";
        List.addImage(IMGURL);
        
        Layout.stop();
        Grid.show();
    }
}