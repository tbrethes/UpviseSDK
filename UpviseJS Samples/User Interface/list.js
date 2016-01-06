Config.appid = "sample";
Config.version = "3";
Config.title = "Test List";

function main() {
    Toolbar.setTitle("Test List");

    List.addHeader("List.addItem()");
    List.addItem("Item");

    List.addHeader("List.addItemSubtitle()");
    List.addItemSubtitle("Item", "subtitle");

    List.addHeader("List.addItemTitle()");
    List.addItemTitle("Item Title", "with subtitle");

    List.addHeader("List.addItemLabel()");
    List.addItemLabel("Label", "Value");

    List.addHeader("List.addImage(url)");
    List.addImage("http://www.upvise.com/download/img/android.jpg");

    List.addHeader("List.addButton()");
    List.addButton('Click Me', "App.alert('You clicked me!')");

    List.addHeader("List.addTextBox");
    List.addTextBox("id1", "Text", "", null);
    List.addTextBox("id2", "Long text", '', null, "textarea");
    List.addTextBox("id3", 'Email', '', null, "email");
    List.addTextBox("id4", 'Number', '', null, "numeric");
    List.addTextBox("id5", 'Price', '', null, "decimal");
    List.addTextBox("id6", "Date", Date.now(), null, "date");
    List.addTextBox("id7", 'Date Snooze', new Date().getTime(), null, "datesnooze");
    List.addTextBox("id8", "Time", new Date().getTime(), null, "time");
    List.addTextBox("id9", "Duration (mn)", 4, null, "duration");


    List.addHeader("Combo Box");
    List.addComboBox("id10", 'priority', '1', null, '1:Low|2:Normal|3:High');
    List.addHeader("ComboBox Multi");
    options = [];
    for (var i = 0; i < 100; i++) options.push('' + i + ': Item ' + i);
    List.addComboBox("id11", 'contact', '', null, options.join('|'));
    List.addComboBoxMulti("id12", 'multi contacts', '', null, options.join('|'));

    List.addHeader("CheckBox");
    List.addCheckBox("id13", 'Task Completed', true);

    List.addHeader("Toggle Box");
    List.addToggleBox("id14", "Are you OK?", "", null, "1:yes|0:No|-1:Maybe");
    List.addToggleBox('id15', "Wheels - tyres, nuts", "", null, "1|2|3|4|0:N/A");

    List.show();
}