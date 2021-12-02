
CustomFields.isSeparate = function(table) {
    return GlobalSettings.getString("cf.separate." + table);
}

CustomFields.view2 = function (table, recordId, canEdit, sectionId) {
    var item = Query.selectId(table, recordId);
    
    CustomFields.values = CustomFields.loadValues(item.custom);
    CustomFields.buttons = {}; // to keep the onclick for button fields
    CustomFields.curHeader = null;

    var fields = [];
    var map  = CustomFields.getFieldsMap(table, recordId);
    var sectionLabel = null;
    if (sectionId && map.keys.length > 1) {
        var obj = map.get(sectionId); 
        fields = obj.fields;
        sectionLabel = obj.label;
    } else {
        fields  = map.all;
    }

    var title = item.name;
    if (table == "tools") title += " #" + item.serialnumber;
    List.addItemBox(R.CUSTOMFIELDS, title, null, "img:info");
    _html.push("<br>");

    if (canEdit) Toolbar.addButton(R.EDIT, "CustomFields.edit2({table},{recordId},{sectionId})", "edit");
    Toolbar.setStyle("search"); // this enable inplace filtering of this screen on web
    fields = Filter.search(fields, "label;value");
    
    var func = "CustomFields.view2({table},{recordId},{canEdit},'%SECTIONID%')"; 
    CustomFields.writeSections(map, func, sectionId);
   
    if (sectionLabel) List.addHeader(sectionLabel);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.values[field.name];
        var options = CustomFields.evalOptions(recordId, field.name, field.seloptions);
        CustomFields.addViewItem(field.name, field.type, field.label, value, options, recordId);
    }
    List.show();
}

CustomFields.edit2 = function (table, recordId, sectionId) {
    var item = Query.selectId(table, recordId);

    CustomFields.values = CustomFields.loadValues(item.custom);   
    CustomFields.companyOptions = null;
    CustomFields.contactOptions = null;

    var fields = [];
    var map  = CustomFields.getFieldsMap(table, recordId, true, item.groupid);
    var sectionLabel = null;
    if (sectionId) {
        var obj = map.get(sectionId); 
        fields = obj.fields;
        sectionLabel = obj.label;
    } else {
        fields  = map.all;
    }

    var title = item.name;
    if (table == "tools") title += " #" + item.serialnumber;
    List.addItemBox(R.CUSTOMFIELDS, title, null, "img:edit");
    _html.push("<br>");

    Toolbar.setStyle("edit");
    
    var func = "CustomFields.edit2({table},{recordId},'%SECTIONID%')"; 
    CustomFields.writeSections(map, func, sectionId);
    
    if (sectionLabel) List.addHeader(sectionLabel);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.values[field.name];
        if (value == null) value = '';
        var options = CustomFields.evalOptions(recordId, field.name, field.seloptions);
        var onchange = "CustomFields._update({table},{recordId},this.id,this.value)";
        if (field.onchange) onchange += ";CustomFields._onchange({field.id},{recordId})";
        CustomFields.writeEditItem(field.name, field.type, field.label, value, onchange, options, null);
    }
    List.show();
}

CustomFields.writeSections = function(map, func, sectionId) {
    if (map.keys.length <= 1) return;

    var onclick = func.replace("%SECTIONID%", "");
    var style = (!sectionId) ? "backcolor:blue" : "";
    Grid.add(R.ALL, "History.reload({onclick})", style);
    for (var i = 0; i < map.keys.length; i++) {
        var key = map.keys[i];
        var obj = map.get(key);
        var onclick = func.replace("%SECTIONID%", key);
        var style = "count:" + obj.fields.length;
        if (key == sectionId) style += ";backcolor:blue";
        if (obj.fields.length > 0) Grid.add(obj.label, "History.reload({onclick})", style);
    }
}

CustomFields.getFieldsMap = function(table, recordId, isEdit, groupid) {
    var fieldsTable = table;
    var where = "formid={fieldsTable}";
    var fields = Query.select("Notes.fields", "name;label;type;seloptions;groupid;roleid", where, "rank");
    fields = CustomFields.filterRole(fields);  
    if (groupid) fields = CustomFields.filterGroup(fields, groupid);
    
    var map = new HashMap();
    var obj = null;
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type == "header") {
            obj = { label: field.label, fields: [] };
            map.set(field.id, obj);
        }  else {
            if (obj == null) {
                obj = {label: R.GENERAL, fields:[]};
                map.set("_gen", obj);
            }
            
            if (isEdit == true) {
                obj.fields.push(field);
            } else {
                // in view mode, add the field only if the value is not empty
                var value = CustomFields.values[field.name];
                if (!(value == null || value === "")) {
                    obj.fields.push(field);
                }
            }
        }
    }
    map.all = fields;
    // remove sections with no fields
    if (isEdit == false) {
        for (var i = 0; i < map.keys.length-1; i++) {
            var key = map.keys[i];
            var obj = map.get(key);
            if (obj.fields.length == 0) {
                map.keys.splice(i, 1);
                i--;
            }
        }
    }
    return map;
}
