Config.appid = "notifsample";
Config.version = "1";
Config.title = "Notif Sample";

function main() {
  	List.addItemTitle("Notification Sample");
    List.addItem("Send Notification Now", "sendNow()");
  	List.addItem("Send Notification Later", "sendLater()");
  	List.addItem("Delay Notification", "updateDate()");
  	List.addItem("Delete Notif", "deleteNotif()");
    List.show();
}

function sendNow() {
  	var myEmail = Settings.get("email");
  	var message = {id:"12345", title:"My Title", body:"This is the message content", onclick: "Contacts.main()", type:"contact"};
  	Notif.sendNow(message, myEmail);
  	List.addItemTitle("Notification sent just now");
  	List.addButton("Back", "History.back()");	
  	List.show();
}

function sendLater() {
	var myEmail = Settings.get("email");
  	var message = {id:"12345", title:"My Title", body:"This is the message content", onclick: "Contacts.main()", type:"contact"};
  	var date = Date.now() + 2*Date.MINUTE;
  	Notif.sendAtDate(message, myEmail, date);
  	List.addItemTitle("Notification will be send at " + Date.formatTime(date));
  	List.addButton("Back", "History.back()");	
  	List.show();
}

function updateDate() {
  	var newdate = Date.now() + 5*Date.MINUTE;
  	Notif.updateId("12345", "date", newdate);
  	List.addItemTitle("Notification time is now" + Date.formatTime(newdate));
  	List.addButton("Back", "History.back()");	
  	List.show();
}

function deleteNotif() {
  	Notif.deleteId("12345");
  	List.addItemTitle("Notification Deleted!");
  	List.addButton("Back", "History.back()");	
  	List.show();
}