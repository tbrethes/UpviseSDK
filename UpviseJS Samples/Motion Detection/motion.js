Config.appid = "motion";
Config.version = "14";
Config.title = "Motion Detect";


function Motion() {}

function main() {
  var title;
  var seconds = parseInt(Settings.get("motion.period"));
  Toolbar.setTitle("Motion.period: " + seconds);
  if (seconds > 0) {
    var seconds = getStillSince();
    var color = seconds > 30 ? Color.ORANGE : Color.GREEN;
    List.addItemTitle("Still for: " + seconds + "s" , "Motion Detection ON", "", "color:white;background-color:" + color);
    List.addButton("Stop", "stop()", "color:gray");
  } else {
    List.addItemTitle("Motion Detection OFF", "", "", "color:white;background-color:" + Color.GRAY);
    List.addButton("Start", "start()", "color:gray");
  } 
  List.show();
}

function start() {
	Settings.set("motion.period", "5");
	Motion.onTimer();
}

function stop() {
	Settings.set("motion.period", "0");
   History.reload();
}

Motion.onTimer = function() {
  History.reload();
  var seconds = Settings.get("motion.period");
  if (seconds > 0)   App.setTimeout("Motion.onTimer()", 2); // refresh every 2 seconds
}
  
function getStillSince() {
  if (Settings.get("motion") == "still") {
        var lastStillDate = parseInt(Settings.get("motion.date"));
    	var seconds = Math.round((Date.now() - lastStillDate) / 1000);
    	return seconds > 0 ? seconds : 0; 
  } else {
    return 0;
  }
}