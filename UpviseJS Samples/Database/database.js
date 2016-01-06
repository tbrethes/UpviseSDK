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
Config.title = "Sample 3";
Config.tables["leads"] = "id;name;email;phone;source;date DATE";

function main() {
    Toolbar.setTitle("Leads");
    Toolbar.addButton("New", "newLead()", "new");
    var leads = Query.select("leads", "id;name", null, "date DESC");
    for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        List.addItem(lead.name, "viewLead({lead.id})");
    }
    List.show();
}

function viewLead(id) {
    var lead = Query.selectId("leads", id);
    if (lead == null) { History.back(); return; }
    Toolbar.setTitle("Lead Info");
    Toolbar.addButton("Edit", "editLead({id})", "edit");
    List.addItemTitle(lead.name);
    List.addItemLabel("Phone", Format.phone(lead.phone), "App.call({lead.phone})");
    List.addItemLabel("Email", lead.email, "App.mailto({lead.email})");
    List.addItemLabel("Source", lead.source);
    List.addItemLabel("Date", Format.date(lead.date));
    List.show();
}

function editLead(leadid) {
    var lead = Query.selectId("leads", leadid);
    Toolbar.setTitle("Edit Lead");
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteLead({leadid})", "delete");

    var onchange = "Query.updateId('leads',{leadid},this.id,this.value)";
    List.addTextBox("name", "Lead Name", lead.name, onchange, "text");
    List.addTextBox("phone", "Phone number", lead.phone, onchange, "text");
    List.addTextBox("email", "Email", lead.email, onchange, "text");
    List.addComboBox("source", "Source", lead.source, onchange, "Direct|Web Marketing|Search Engine|Other");
    List.addTextBox("date", "Date", lead.date, onchange, "date");
    List.show();
}

function newLead() {
    var values = { date: Date.now() };
    var id = Query.insert("leads", values);
    History.redirect("editLead({id})");
}

function deleteLead(id) {
    Query.deleteId("leads", id);
    History.back();
}