Config.appid = "countersample";
Config.version = "7";
Config.title = "Counter Sample";

Config.tables["contracts"] = "id;counterid;name;note,date DATE";

function main(){
	List.addItemTitle("Autocounter Sample");
  	List.addButton("Create Counter", "createCounter()");
  	Toolbar.addButton("New", "newContract()", "new");
  	var items = Query.select("contracts", "*", "", "date DESC");
  	for (var i = 0; i < items.length; i++) {
  		var item = items[i];
        List.addItemSubtitle(item.name, "" + item.note, "editContract({item.id})");
    }
    List.show();
}

function createCounter() {
  if (WEB()) App.createCounter("myapp.contract", 200);
}

function newContract() {
  var values = {counterid:'myapp.contract:4', name:'CONTRACT [NEW]', date:Date.now(), note:''};
  var id = Query.insert("contracts", values);
  History.redirect("editContract({id})");
}

function editContract(id) {
  var item = Query.selectId('contracts', id);
  var onchange = "Query.updateId('contracts',{id},this.id,this.value)";
  List.addItemTitle(item.name);
  List.addItem(Format.datetime(item.date), "", "img:date");
  List.addTextBox('note', "Note", item.note, onchange);
  List.show();
}