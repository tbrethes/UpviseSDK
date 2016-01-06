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

Config.appid = "MyAppId";
Config.version = "8";
Config.title = "NFC Code Sample";

function MyAppId() {}

function leftpane() {}

function main() {
    List.addItemTitle("NFC Code Sample");
  	var info = [];
  	info.push("1. Make sure NFC is Enabled in Android Settings");
  	info.push("2. Select a Contact below");
  	info.push("3. Tap on Write NFC Tag");
  	info.push("4. Exit the app");
    info.push("5. Put your phone on top of the NFC Tag");
  	List.addItemLabel("How to use", info.join("\n"));
  	List.addHeader("Contacts");
    List.bindItems("Contacts.contacts", "name", null, "MyAppId.viewContact(this.id)");
    List.show();
}

MyAppId.viewContact = function(id) {
    var contact = Query.selectId("Contacts.contacts", id);
    if (contact == null) {History.back(); return;}
    Toolbar.setTitle("Contact");
    List.addItemTitle(contact.name, contact.jobtitle);
    var func = "MyAppId.viewContact({id})";
    List.addButton("Write NFC Tag", "App.writeNfc({func})");
    List.show();
}