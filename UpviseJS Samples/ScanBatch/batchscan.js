Config.appid = "batchscansample";
Config.version = "5";
Config.title = "Batch Scan";

Config.appTitle = "en:Batch Scan";
Config.appIcon = "product";
Config.appRank = "10";

var CODES = [];

function main() {
    CODES = [];
	List.addItemTitle("Batch Scan Sample");
 	List.addButton("Batch Scan", "App.scanCode('onScan(this.value)')");  
    List.show();
}

function onScan(code) {
  if (code) CODES.push(code);
  var yes = App.confirm("Scanned Code: " + code + ". Scan Again?");
  if (yes) {
	App.scanCode('onScan(this.value)');
  } else {
    History.redirect("viewScanCodes()");
  } 
}

function viewScanCodes() {
  for (var i = 0; i < CODES.length; i++) {
    List.addItem(CODES[i]);
  }
  List.show();
}
