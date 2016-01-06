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
Config.title = "Sample 1";

function main() {
    Toolbar.setTitle("Page 1");
    List.addItemTitle("Navigation Sample");
    for (var i = 0; i < 50; i++) {
        List.addItem("View Item " + i, "showItem({i})");
    }
    List.show();
}

function showItem(i) {
    Toolbar.setTitle("Page " + i);
    List.addItem("Go Back", "History.back");
    List.show();
}
