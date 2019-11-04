Config.appid = "PullSample";
Config.version = "63";
Config.title = "Pull Sample App";

function PullSample() {}

function main() {
  // Initialise the callback
  PullSample.onTimer();
  
  var since = Settings.get("lastpulldate")
  if (since) since = parseInt(since);

  var count = Query.count("Notes.notes");
  List.addItemTitle(count + "  Notes");
  List.addItemLabel("Last  Pull Date:", Format.datetime(since));
  List.addItemLabel("App Version", Config.version);
  List.show();
}  

PullSample.onTimer = function() {
  	//App.tts("syncing");
  // we need to force a sync at the application level because the sync occurs by default every 5mn only on device.
 	App.sync("PullSample.onSync()");
}

PullSample.onSync = function() {
	var since = Settings.get("lastpulldate");
  	if (!since) {
    	since = Date.now();
    } else {
      // parseInt is important
      since = parseInt(since);
    }
    // update the last date : convert to String is essential here
  	Settings.set("lastpulldate", String(Date.now()));

  	var count = Query.count("Notes.notes", "creationdate>{since}")
    if (count > 0) {
      App.notify("myid", "New notes (" + count + ")", "My subtitle", "PullSample.showNew({since})", "");
    }
  	App.tts(count + " new notes");
  	
  	// TODO : change this value to avoid pulling outisde working hours for example
  	var seconds = 20;
  	// call the callback again
  	App.setTimeout("PullSample.onTimer()", seconds);
}

PullSample.showNew = function(since) {
 	var notes = Query.select("Notes.notes", "*", "creationdate>{since}")
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      List.addItem(Format.text(note.description));
    }
    List.show();
}
