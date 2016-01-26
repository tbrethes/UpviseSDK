Config.appid = "sample13";
Config.version = "11";
Config.title = "Dynamic Edit Screen";

Config.tables["requests"] = "id;modelid;groupid;startdate DATE;enddate DATE;owner";

function main(){
	List.addItemTitle("Dynamic Edit Screen");
  	List.addButton("New Request", "newRequest()");

  	var modelOptions = getModelOptions();
    var requests = Query.select("requests", "id;modelid;startdate", null, "startdate");
  	if (requests.length > 0) List.addHeader("Requests");
  	requests.forEach(function(request) {
      var title = Format.options(request.modelid,  modelOptions);
      var subtitle = Format.date(request.startdate);
      List.addItemSubtitle(title, subtitle, "editRequest({request.id})");
  	});
    List.show();
}

function newRequest() {
  var id = Query.insert("requests", {startdate:Date.today(), enddate:Date.today()});
  History.redirect("editRequest({id})");
}
  
function editRequest(id) {
    var request = Query.selectId("requests", id);
  	if (request == null) {History.back();return;}
  	
  	var onchange = "Query.updateId('requests',{id},this.id,this.value)";
  	Toolbar.setStyle("edit");
  	List.addComboBox("modelid", "Model", request.modelid, "onChangeModel({id},this.value)", getModelOptions());
  	List.addComboBox("groupid", "Group", request.groupid, onchange, getGroupOptions(request.modelid));
    
    List.addTextBox("startdate", "Start Date", request.startdate, "onChangeStartDate({id},this.value)", "date");
  	List.addTextBox("enddate", "End Date", request.enddate, onchange, "date");
    List.show();
}

function onChangeModel(id, modelid) {
  Query.updateId('requests', id, "modelid", modelid);
  // Based on the value of the modelid, compute the list of options for the groupid field
  // and use List.setValue() to set the options
  var groupOptions = getGroupOptions(modelid);
  List.setValue("groupid", "", groupOptions);
}
                
function onChangeStartDate(id, startdate) {
  Query.updateId('requests', id, "startdate", startdate);
  Query.updateId('requests', id, "enddate", startdate);
  // Use List.setValue() to force the enddate to match the new startdate
  List.setValue("enddate", startdate);
}

function getModelOptions() {
  return "1:Trucks|2:Compressors|3:Cranes";
}

function getGroupOptions(modelid) {
  if (modelid == "1") return "1:Light Truck|2:Heavy Truck|3:Car";
  else if (modelid == "2") return "1:Air compressor|2:Small Compressor|3:Huge Compessor";
  else if (modelid == "3") return "1:Light Crane|2:Big Crane|3:Huge Crane";
  else return "";
}