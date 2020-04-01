Config.appid = "Bluetooth";
Config.version = "47";
Config.title = "Bluetooth Beacon Sample";

function Bluetooth() {}
 
Bluetooth.onTimer = function() {
    if (isScanEnabled()) {
        App.broadcast("https://up.com/" + User.getName());
        App.scanBeacons("Bluetooth.onScanComplete()");
  		// relaunch the timer 
    	App.setTimeout("Bluetooth.onTimer()", 20);
    } else {
      // stop broadcast
      App.broadcast("");
    }        
}

Bluetooth.onScanComplete = function() {
 	var current =  History.get().toLowerCase();
  	App.sound("beep");
  	//App.alert(current);
  
    // refresh the current page to display the updated scanned devices  
    if (current == "bluetooth.viewlist()") {
        History.reload();
  	}
}
  
function main() {
  	Bluetooth.onTimer();
  	History.redirect("viewList()");
}

function viewList() {
    // Start a timer to rescan every 30 seconds
    var status = isScanEnabled() ? "Scanning Active" :  "Stopped";
    List.addItemTitle("Bluetooth Beacons", status + "\nLogged User: " + User.getName() + "\nversion: " + Config.version);
  	if (isScanEnabled()) {
  		List.addButton("Stop Scanning", "scan(0)");
    } else {
      List.addButton("Start Scanning", "scan(1)");
    }
  	var devices = [];
  	try {
    	devices = JSON.parse(Settings.get("bluetooth.devices"));
    } catch(e) {}
   	for (var i = 0; i < devices.length; i++) {
    	var device = devices[i];
      	List.addItemSubtitle(device.name, "RSSI:" + device.rssi + "m \nAddress: " + device.address);
    }
  	if (devices.length == 0) List.addItem("No Device found!");
  	List.show();
}

function isScanEnabled() {
  	return Settings.get("bt.scan") == "1";
}

function scan(yes) {
  	if (yes) {
    	Settings.set("bt.scan", "1");
	} else {
       Settings.set("bt.scan", "0");
    }    
  	Bluetooth.onTimer();
    History.reload();
}

