Config.appid = "Bluetooth";
Config.version = "6";
Config.title = "Beacons Sample";

function main(){
	List.addItemTitle("Bluetooth Beacons");
  	List.addButton("Scan Now", "scan()");
  	List.addButton("Reload", "History.reload()");
  	var list = getBeacons();
   	for (var i = 0; i < list.length; i++) {
    	var device = list[i];
      List.addItemSubtitle(device.name, "RSSI:" + device.rssi +  "dB / " + device.address);
    }
    List.show();
}

function scan() {
  	App.scanBeacons();
}

function getBeacons() {
  var list;
  try {
  	list =  JSON.parse(Settings.get("beacons.list"));
  } catch(e) {
  }
  if (list == null) list = [];
  return list;
}