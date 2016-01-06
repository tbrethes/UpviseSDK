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
Config.version = "2";
Config.title = "PDF Sample";
Config.tables["leads"] = "id;name";

function main() {
    Toolbar.setTitle("Leads");
    Toolbar.addButton("New", "newLead()", "new");
    List.addItemTitle("PDF Export Demo", "click on a lead them export PDF");
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

    var files = Query.select("system.files", "id;name", "linkedtable='sample.leads' AND linkedrecid={id}", "_date");
    List.addHeader("Photos (" + files.length + ")");
    List.addButton("EXPORT PDF", "exportPopup({id})");
    List.addButton("New Photo", "App.takePicture('sample.leads',{id})");
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        List.addItem(file.name, "Files.viewFile({file.id})");
    }
    List.show();
}

function exportPopup(leadid) {
    List.addItem("Download", "exportPdf({leadid},'download')");
    List.addItem("Email", "exportPdf({leadid},'download')");
    List.show("popup");
}

function exportPdf(leadid, action) {
    var lead = Query.selectId("leads", leadid);
    Pdf.clear();
    Pdf.tableStyle += "border:0;";
    Pdf.cellStyle += "border:0;";
    
    // Title
    Pdf.setHeader();
    Pdf.setTitle("Lead");
    Pdf.addLabel("Name", lead.name);
    Pdf.addLabel("Date", leadFormat.date(Date.now()));
    
    Pdf.addHeader("Lead Activity");
    Pdf.addLabel("Status", "Activity");
        
    Pdf.addLineHeader("Caption1", "Caption2", "Caption3", "Caption4");
    for (var i = 0; i < 10; i++) {
        Pdf.addLine("Item " + i, "Subtitle goes here", 'value1', 'value2', 'value3');
    }
    
    // Files
    var files = Files.select("sample.leads", id);
    if (files.length > 0) Pdf.addHeader("Photos");
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.mime.substr(0, 5) == "image") Pdf.addImage(file.id, 200);
    }

    Pdf.download("Lead " + lead.name + ".pdf");
}

function newLead() {
    var name = App.prompt("Lead Name", "");
    if (name == null) return;
    var id = Query.insert("leads", {name:name});
    History.redirect("viewLead({id})"); 
}