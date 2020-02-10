Config.appid = "sample.notif";
Config.version = "2";
Config.title = "Custom iOs Notification";

function main() {
  List.addItemTitle("Ios Scheduled Notification");
  
  List.addButton("Test iOs Notif", "testNotif()"); 
  List.show();
}

function testNotif() {
  var delaySeconds = 0;
  var onclick = "Contacts.main()";
  App.setNotif("myid", "Title goes here", "Subtitle goes here", onclick, delaySeconds);
  App.alert("Done");
}
