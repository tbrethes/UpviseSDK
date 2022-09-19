
CustomFields.writeTemplateSection = function (formid, title, groupid) {
    var where = "formid={formid}";
    if (groupid) where += " AND groupid={groupid}";
    var fields = Query.select("Notes.fields", "*", where, "rank");
    if (fields.length == 0) return;
    if (title) List.addItemTitle(title);

    var onchange = "GlobalSettings.setString(this.id,this.value)";
    List.addCheckBox("cf.separate." + formid, "Show on a separate screen", GlobalSettings.getString("cf.separate." + formid), onchange);
   
    List.addHeader(["", R.NAME, R.TYPE, R.GROUP, R.ROLE, "", "ID"], ["50px"]);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var rank = (i + 1);
        var groupName = "";
        if (formid == "projects.assets") {
            groupName = Query.names("Projects.assetgroups", field.groupid);
        } else if (formid == "assets") {
            groupName = Query.names("Assets.groups", field.groupid);
        } else if (formid == "tools") {
            groupName = Query.names("Tools.groups", field.groupid);
        } else if (formid == "jobs") {
            groupName = Query.names("Jobs.groups", field.groupid);
        }
        var role = Query.names("System.roles", field.roleid);
        var contextAction = _writeLink(R.UP, 'CustomFields.moveField', field.id, i - 1) + ' ' + _writeLink(R.DOWN, 'CustomFields.moveField', field.id, i + 1);
        var style = { ondrop: "CustomFields.onDropField", id: field.id };
        if (field.type == "header") style.background = "#F1F1F1";
        List.add([rank, field.label, field.type, groupName, role, contextAction, field.name], "CustomFields.editField({field.id})", style);
    }
}

CustomFields.onDropField = function (sourceFieldId, targetFieldId) {
    var targetField = Query.selectId("Notes.fields", targetFieldId);
    CustomFields.moveField(sourceFieldId, targetField.rank - 1);
}

CustomFields.moveField = function (fieldid, newRank) {
    var curfield = Query.selectId("Notes.fields", fieldid);
    var fields = Query.select("Notes.fields", null, "formid={curfield.formid}", "rank");
    // remove the field from the array
    for (var i = 0; i < fields.length; i++) {
        if (fields[i].id == fieldid) {
            var f = fields.splice(i, 1);
            // add it to the new pos
            fields.splice(newRank, 0, f[0]);
            break;
        }
    }

    // recompute all ranks
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        Query.updateId("Notes.fields", field.id, "rank", 1 + i);
    }
    History.reload();
}

CustomFields.newField = function (formid) {
    // find the max index and add 1
    var rank = 0;
    var fieldId = 0; // 
    var fields = Query.select("Notes.fields", null, "formid={formid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var aRank = parseInt(field.rank);
        if (aRank > rank) rank = aRank;
        var aId = parseInt(field.name.substring(1)); // format of name is F[number]
        if (aId > fieldId) fieldId = aId;
    }
    rank++;
    fieldId++;
    var values = { formid: formid, rank: rank, name: "F" + fieldId };
    var id = Query.insert("Notes.fields", values);
    History.redirect("CustomFields.editField({id})");
}

CustomFields.editField = function (id) {
    var item = Query.selectId("Notes.fields", id);
    if (item == null) { return; }
    var onchange = "Query.updateId('Notes.fields',{id},this.id,this.value)";

    Toolbar.setStyle("edit");
    Toolbar.addDeleteButton("CustomFields.deleteField({id})");

    //List.forceNewLine = true;
    List.addItemTitle(R.EDITCUSTOMFIELD + " :" + item.name);

    List.addTextBox("label", R.LABEL, item.label, onchange);
    var options = "text|textarea|select|selectmulti|checkbox|button|buttonbox|date|datetzi|time|datetime|duration|numeric|decimal|currency|email|phone|link|contact|company|user|product|project|location|opp:opportunity|tool:Equipment|barcode|pair|header|label|signature";
    List.addComboBox("type", R.TYPE, item.type, onchange + ";History.reload()", options);
    if (item.type == "select" || item.type == "selectmulti") {
        List.addTextBox("seloptions", R.OPTIONS, item.seloptions, onchange, "code");
        List.addHelp(R.CUSTOMFIELD_NOTE2);
        List.addHelp("NEW: you can use the <b>javascript:</b> prefix to include script here. Use the <b>id</b> predefined variable to reference the current record.");

    } else if (item.type == "button" || item.type == "buttonbox") {
        List.addTextBox("style", "Style", item.style, onchange);
        List.addTextBox("seloptions", "On Tap Script", item.seloptions, onchange, "code");
        //List.addTextBox("value", "On Load", item.value, onchange, "code");

    } else if (item.type == "contact" || item.type == "company") {
        var groupOptions = Query.options("Contacts.groups");
        List.addComboBox("seloptions", R.GROUP, item.seloptions, onchange, groupOptions);
    }

    // For Asset, Project asset & Tools, allow to link a custom field to a groupid for edit filtering
    var groupOptions;
    if (item.formid == "projects.assets") {
        groupOptions = Query.options("Projects.assetgroups");
    } else if (item.formid == "assets") {
        groupOptions = Query.options("Assets.groups");
    } else if (item.formid == "tools") {
        groupOptions = Query.options("Tools.groups");
    }  else if (item.formid == "jobs") {
        groupOptions = Query.options("Jobs.groups");
    }

    if (groupOptions) List.addComboBoxMulti("groupid", R.CATEGORY, item.groupid, onchange, groupOptions);

    List.addComboBoxMulti("roleid", R.ROLE, item.roleid, onchange, Query.options("system.roles"));

    // On Change
    if (item.type != "button" && item.type != "buttonbox") {
        List.addTextBox("onchange", "On Change", item.onchange, onchange, "code");
    }

    List.show();
}

CustomFields.deleteField = function (id) {
    var field = Query.selectId("Notes.fields", id);
    var rank = parseInt(field.rank);

    // update the rank = rank - 1 on all the fields after the field we want to delete
    var fields = Query.select("Notes.fields", null, "formid={field.formid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var curId = fields[i].id;
        var curRank = parseInt(fields[i].rank);
        if (curRank > rank) {
            Query.updateId("Notes.fields", curId, "rank", curRank - 1);
        }
    }

    Query.deleteId("Notes.fields", id);
    History.back();
}

///////////////////////

CustomFields.CSV_HEADER = ['id', 'table', 'name', 'label', 'type', 'options', 'value', 'rank'];

CustomFields.export = function (table) {
    var where = table ? "formid=" + esc(table) : "";
    var fields = Query.select("Notes.fields", "*", where, "rank");
    var csv = new CsvFile();
    csv.writeLine(CustomFields.CSV_HEADER);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var line = new Array();
        line.push(field.id, field.formid, field.name, field.label, field.type, field.seloptions, field.value, field.rank);
        csv.writeLine(line);
    }
    var filename = R.CUSTOMFIELDS;
    if (table) filename += " " + table;
    csv.download(filename);
}

CustomFields.import = function () {
    Toolbar.setTitle("Import Fields");
    Import.writeFileButton(R.SELECTCSVFILE, CustomFields.onImportCsv);
    Import.writeSampleLink(CustomFields.CSV_HEADER, "Custom Fields Sample.csv");
    List.show("pane");
}

CustomFields.onImportCsv = function (csv) {
    Import.importCsv(csv, CustomFields.mapField, "Notes.fields");
}

CustomFields.mapField = function (param, name, value) {
    if (name == 'table') param.add("formid", value);
    else if (name == 'options') param.add("seloptions", value);
    else if (CustomFields.CSV_HEADER.includes(name)) {
        param.add(name, value);
    }
}

//////////////  Exporting and Importing : Used on Web only

/////////////////// Manage Field Templates for a fiven formid

CustomFields.getOptions = function (formid) {
    var options = new Array();
    var fields = Query.select("Notes.fields", null, "formid={formid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        options.push(field.id + ":" + field.label);
    }
    return options.join("|");
}

CustomFields.getLabels = function (table) {
    var labels = [];
    var fields = Query.select("Notes.fields", null, "formid={table}", "rank");
    for (var i = 0; i < fields.length; i++) {
        labels.push(fields[i].label);
    }
    return labels;
}

CustomFields.getValues = function (table, custom, id) {
    var values = [];
    var list = CustomFields.get(table, custom, id);
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var value = item.value;
        values.push(value);
    }
    return values;
}

CustomFields.getValuesExcel = function (table, custom, id) {
    var values = [];
    var objValues = CustomFields.loadValues(custom);
    var fields = Query.select("Notes.fields", "id;name;label;type;seloptions", "formid={table}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var options = CustomFields.evalOptions(id, field.name, field.seloptions);
        var value = ExcelFile.format(objValues[field.name], field.type, options);
        values.push(value);
    }
    return values;
}

CustomFields.getFieldFromLabel = function (table, label) {
    var label = label.trim().toLowerCase();
    var fields = Query.select("Notes.fields", null, "formid={table}");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.label.trim().toLowerCase() == label) {
            return field;
        }
    }
    return null;
}

// name is FXX format
CustomFields.getFieldFromName = function (table, name) {
    var fields = Query.select("Notes.fields", null, "formid={table}");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.name == name) {
            return field;
        }
    }
    return null;
}

CustomFields.getFields = function (table) {
    var fields = Query.select("Notes.fields", null, "formid={table}");
    return fields;
}


////////////////////////////////////////////////
CustomFields.CACHE = [];

CustomFields.getValuesOptimized = function (table, custom) {
    var fields = CustomFields.CACHE[table];
    if (fields == null) {
        fields = Query.select("Notes.fields", "id;name;label;type;seloptions", "formid={table}", "rank");
        CustomFields.CACHE[table]  = fields;
    }
    var values = [];
    var objValues = CustomFields.loadValues(custom);
        
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.formatValue(objValues[field.name], field.type, field.seloptions);
        values.push(value);
    }
    return values;
}

////////////////

CustomFields.writeCustomJs = function () {
    var key = Config.appid + "customjs";
    var onchange = "AccountSettings.set(this.id,this.value)";
    List.addHeader("Code to be executed after the app loads")
    List.addTextBox(key, "", AccountSettings.get(key), onchange, "code");
    var help = "You can overwrite some Upvise application code here and add new functions"
     List.addHelp(help);
}