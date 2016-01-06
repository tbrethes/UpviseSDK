/*
 * Copyright (C) 2016 Upvise
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

Config.appid = "floorplan";
Config.version = "98";
Config.title = "FloorPlan";

Config.tables["defects"] = "id;geo;date DATE;label;color;kind;img";

function leftpane() {}

//////////////////

function main() {
    Toolbar.addButton("New Defect", "newDefect()", "new");
  	Toolbar.addButton("List", "viewList()", "list");  
  	Toolbar.addButton("Delete", "deleteAllDefects()", "delete");
  	  
	var defects = Query.select("defects", "*", "", "date DESC");
    for (var i = 0; i < defects.length; i++) {
      var defect = defects[i];
      var style = defect.kind + ":" + defect.color + ";img:" + defect.img;
      style += ";onmove:Query.updateId('defects',{defect.id},'geo',this.value)";
      Map.addItem("Defect " + defect.label, defect.geo, "viewDefect({defect.id})", style);
    }
    var fileid = getFloorPlanId();
    Map.setFloorPlan(fileid);
    Map.show();
}

function getFloorPlanId() {
    var files = Query.select("System.files", "id", "name='bigplan.png'"); // type4.jpg
    var fileid = files[0].id;
    return fileid;
}

function viewList() {
    Toolbar.addButton("Delete", "deleteAllDefects()", "delete");
    var defects = Query.select("defects", "*", "", "date DESC");
  	for (var i = 0; i < defects.length; i++) {
    	var defect = defects[i];
    	List.addItemSubtitle("Defect " + defect.label, Format.datetime(defect.date), "viewDefect({defect.id})", "priority:" + defect.color);
  	}
  	List.show();
}

function newDefect() {
  	Map.newItem("onmove:onNewDefect(this.value);color:" + Color.BLUE);
}

function onNewDefect(geo) {
  	var label = Query.count("defects") + 1;
  	var id = Query.insert("defects", {geo: geo, label:label, date: Date.now(), color: Color.BLUE, kind: "background-color"});
  	History.redirect("editDefect({id})");
}

function viewDefect(id) {
	var defect = Query.selectId("defects", id);
  	Toolbar.addButton("Edit", "editDefect({id})", "edit");
  	Toolbar.addButton("Map", "viewDefectPlan({id})", "map");
    
  	List.addItemTitle("Defect " + defect.label, Format.datetime(defect.date), "", "border-color:" + defect.color);
    List.addItemLabel("Kind", defect.kind);
    List.addItemLabel("Image", defect.image);
  	List.addItemLabel("Color", defect.color);
    List.show();
}

function editDefect(id) {
	var defect = Query.selectId("defects", id);
    var onchange = "Query.updateId('defects',{id},this.id,this.value)";
    var colors = [];
    colors.push(Color.BLUE + ":Blue");
    colors.push(Color.RED + ":Red");
    colors.push(Color.GREEN + ":Green");
    colors.push(Color.ORANGE + ":Orange");

    //List.addItemTitle("Defect", Format.datetime(defect.date));
  	Toolbar.setStyle("edit");
  	Toolbar.addButton("Delete", "deleteDefect({id})", "delete");
    List.addTextBox("label", "Label", defect.label, onchange);
    List.addComboBox("color", "Color", defect.color, onchange, colors.join("|"));
    List.addComboBox("kind", "Kind", defect.kind, onchange, "background-color|border-color");
    List.addComboBox("img", "Image", defect.img, onchange, "camera|new|delete|email|sms|info|settings|star");
    List.show();
}

function viewDefectPlan(id) {
 	var defects = Query.select("defects", "*", "", "date DESC");
  	for (var i = 0; i < defects.length; i++) {
    	var defect = defects[i];
      	var style = "";
      	if (defect.id == id) {
	    	var style = defect.kind + ":" + defect.color + ";img:" + defect.img;
          	style += ";onmove:Query.updateId('defects',{id},'geo',this.value)";
          	Map.addItem(defect.label, defect.geo, "viewDefect({defect.id})", style);
        } else {
          	Map.addItem("", defect.geo, "", "background-color:" + Color.GRAY);
        }
  	}
  	var fileid = getFloorPlanId();
  	Map.setFloorPlan(fileid);
  	Map.show();
}

function deleteAllDefects() {
    var defects = Query.select("defects", "id");
    for (var i = 0; i < defects.length; i++) {
        var defect = defects[i]
        Query.deleteId("defects", defect.id);
    }
    History.reload();
}