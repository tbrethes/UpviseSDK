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
Config.version = "1";
Config.title = "Dynamic Combo Box";

function main() {
    History.redirect("selectScreen()");
}

function selectScreen(country, cityoptions) {
    List.addComboBox("country", "Choose Country", country, "onChangeCountry(this.value)", "us:USA|fr:France|jp:Japan");
    if (cityoptions != null) List.addComboBox("city", "Choose City", "", "", cityoptions);
    List.addButton("Go", "go()");
    List.show();
}

function onChangeCountry(country) {
    var cityoptions;
    if (country == "us") cityoptions = "San Fransisco|New York|Los Angeles";
    else if (country == "fr") cityoptions = "Paris|Marseille|Bordeaux";
    else if (country == "fr") cityoptions = "Tokyo|Kyoto|Osaka";
    History.reload("selectScreen({country},{cityoptions})");
}

function go() {
    var country = List.getValue("country");
    var city = List.getValue("city");
    List.addItemLabel("Country", country);
    List.addItemLabel("City", city);
    List.show();
}