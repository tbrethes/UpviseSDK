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