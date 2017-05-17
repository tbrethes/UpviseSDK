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
Config.version = "4";
Config.title = "Camera";
Config.tables["leads"] = "id;name";
Config.uses = "Files"; // need this to make a call for the Standard File app to view the photo.

function main() {
    Toolbar.setTitle("Leads");
    Toolbar.addButton("New", "newLead()", "new");
    List.addItemTitle("Camera Demo");
    var leads = Query.select("leads", "id;name", null, "name");
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        List.addItem(lead.name, "viewLead({lead.id})");
    }
    List.show();
}

function viewLead(id) {
    var lead = Query.selectId("leads", id);
    Toolbar.setTitle("Lead Info");
    List.addItemTitle(lead.name);

    var files = Query.select("system.files", "id;name;date", "linkedtable='sample.leads' AND linkedrecid={id}", "date");
    List.addButton("New Photo", "App.takePicture('sample.leads',{id})");
    List.addHeader("Photos (" + files.length + ")");
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (WEB()) {
            List.addThumbnail(file.name,file.id, "Files.viewFile({file.id})");
        } else {
            var img = Settings.getFileUrl(file.id);
            List.addItem(Format.datetime(file.date), "Files.viewFile({file.id})", "scale:crop;img:" + img);
        }
    }
    List.show();
}

function newLead() {
    var name = App.prompt("Lead Name", "");
    if (name == null) return;
    var id = Query.insert("leads", {name:name});
    History.redirect("viewLead({id})"); 
}