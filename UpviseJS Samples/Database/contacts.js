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
Config.title = "Sample Contacts";

function main() {
    var contacts = Query.select("Contacts.contacts", "id;name;jobtitle", null, "name");
    contacts.forEach(function (contact) {
        List.addItemSubtitle(contact.name, contact.jobtitle, "viewContact({contact.id})");
    });
    List.show();
}

function viewContact(id) {
    var contact = Query.selectId("Contacts.contacts", id);
    List.addItemTitle(contact.name, contact.jobtitle);
    List.addItemLabel("Mobile", Format.phone(contact.mobile), "App.call({contact.mobile})");
    List.show();
}