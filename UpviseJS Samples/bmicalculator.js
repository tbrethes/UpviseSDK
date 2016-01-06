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