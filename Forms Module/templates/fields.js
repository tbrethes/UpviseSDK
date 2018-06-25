
////////////////////////////////////////////////// 
////////////////// Template Form Fields

Templates.onDropField = function (sourceFieldId, targetFieldId) {
    //var sourceField = Query.selectId("Forms.fields", sourceFieldId);
    var targetField = Query.selectId("Forms.fields", targetFieldId);

    moveField(sourceFieldId, targetField.rank);
}

function showFieldContextMenu(fieldid) {
    Popup.add("Change Position", "changeFieldRank({fieldid})");
    Popup.add(R.DUPLICATE, "duplicateField({fieldid})");
    Popup.add(R.DELETE, "deleteFieldTemplate({fieldid})");
    Popup.show();
}

function changeFieldRank(fieldid) {
    var field = Query.selectId("Forms.fields", fieldid);
    var rank = App.prompt("Enter new position", "");
    if (rank == null || rank == "" || rank == 0) return;
    rank = parseInt(rank);
    if (isNaN(rank)) return;
    moveField(fieldid, rank);
    App.alert("Postion changed");
}

function duplicateField(fieldid) {
    var field = Query.selectId("Forms.fields", fieldid);

    var values = newfieldTemplateValues(field.formid);


    field2 = Utils.clone(field);
    field2.label += " " + R.COPY;

    field2.rank = values.rank;
    field2.name = values.name;

    var newid = Query.insert("Forms.fields", field2);
    moveField(newid, field.rank + 1);
    App.alert("Field Duplicated");
}


function moveField(fieldid, newRank) {
    newRank = parseInt(newRank) - 1;
    if (isNaN(newRank)) return;

    var curfield = Query.selectId("Forms.fields", fieldid);
    var fields = Query.select("Forms.fields", null, "formid={curfield.formid}", "rank");

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
        field.rank = 1 + i;
        Query.updateId("Forms.fields", field.id, "rank", field.rank);
    }
    History.reload();
}

function newFieldTemplate(templateId, type, options) {
    var values = newfieldTemplateValues(templateId);
    values.type = type;
    if (options != null) values.seloptions = options;
    var id = Query.insert("Forms.fields", values);
    History.replace("editFieldTemplate({id})");
}

function newButtonFieldTemplate(templateId, value) {
    var values = newfieldTemplateValues(templateId);
    values.type = "button";
    values.value = value;
    var id = Query.insert("Forms.fields", values);
    History.replace("editFieldTemplate({id})");
}

Templates.newQuestion = function(templateid) {
    var YESNO = "1:Yes|0:No";
    var YESNONA = "1:Yes|0:No|2:N/A";
    var YESPUNCHNA = "1:Yes|P:Punch|2:N/A";
    Popup.add("Yes - No", "newFieldTemplate({templateid},'toggle',{YESNO})");
    Popup.add("Yes - No - N/A", "newFieldTemplate({templateid},'toggle',{YESNONA})");
    Popup.add("Yes - Punch - N/A", "newFieldTemplate({templateid},'toggle',{YESPUNCHNA})");
    Popup.addHeader();
    Popup.add(R.CUSTOM, "newFieldTemplate({templateid},'toggle')");
    Popup.show();
}

Templates.newTextBox = function(templateid) {
    var options = Templates.getTextBoxOptions();
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        Popup.add(option.label, "newFieldTemplate({templateid},{option.id})");
    }
    Popup.show();
}

Templates.newComboBox = function(templateid) {
    var options = Templates.getComboBoxOptions();
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        Popup.add(option.label, "newFieldTemplate({templateid},{option.id})");
    }
    Popup.show();
}

Templates.newDateBox  = function(templateid) {
    var options = Templates.getDateBoxOptions();
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        Popup.add(option.label, "newFieldTemplate({templateid},{option.id})");
    }
    Popup.show();
}

Templates.newPhotoBox = function(templateid) {
    var options = Templates.getPhotoBoxOptions();
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        Popup.add(option.label, "newFieldTemplate({templateid},{option.id})");
    }
    Popup.show();
}

Templates.newButton = function (templateid) {
    var options = Templates.getButtonOptions();
    for (var i = 0; i < options.length; i++) {
        var option = options[i];
        Popup.add(option.label, "newButtonFieldTemplate({templateid},{option.id})");
    }
    Popup.show();
}

Templates.newLabel = function (templateid) {
    Popup.add(R.LABEL, "newFieldTemplate({templateid},'label')");
    Popup.add("Score", "newFieldTemplate({templateid},'score')");
    Popup.show();
}

function newfieldTemplateValues(templateId) {
    var values = {};
    values.formid = templateId;

    // find the max index and add 1
    var rank = 0;
    var fieldId = 0; // 
    var fields = Query.select("Forms.fields", null, "formid={templateId}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var aRank = parseInt(field.rank);
        if (aRank > rank) rank = aRank;
        var aId = parseInt(field.name.substring(1)); // format of name is F[number]
        if (aId > fieldId) fieldId = aId;

    }
    rank++;
    fieldId++;

    values.rank = rank;
    values.name = "F" + fieldId;
    return values;
}


function getTemplateRankOptions(templateid) {
    var options = [];
    var fields = Query.select("Forms.fields", null, "formid={templateid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        options.push(field.rank + ":" + R.POSITION + " " + field.rank);
    }
    return options.join("|");
}

function onOptionsChange(fieldid, value) {
    if (value.startsWith("javascript:") == -1 && value.indexOf("|") == -1) {
        var parts = value.split("\n");
        if (parts.length > 0) {
            var list = [];
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i].trim();
                if (part != "") list.push(part);
            }
            value = list.join("|");
        }
    }
    Query.updateId("Forms.fields", fieldid, "seloptions", value);
}

function editFieldTemplate(id) {
    var item = Query.selectId("Forms.fields", id);
    if (item == null) { History.back(); return; }
    var onchange = "Query.updateId('Forms.fields',{id},this.id,this.value)";
    var type = item.type;
    var typeOptions = Templates.getSubTypeFieldsOptions(item.type);

    writeEditFieldTooblar(item);

    if (type == "risk") {
        List.addComboBox("label", "Risk", item.label, onchange, Query.options("Qhse.risks"));
    } else {
        var labelStyle = (type == "label") ? "code" : "longtext";
        List.addTextBox("label", R.LABEL, item.label, onchange, labelStyle);
    }

    if (typeOptions != null) {
        List.addComboBox("type", R.TYPE, item.type, onchange + ";History.reload()", typeOptions);
    }

    List.addComboBox("rank", "Position", item.rank, "moveField({item.id},this.value)", getTemplateRankOptions(item.formid));

    if (type == "select" || type == "selectmulti" || type == "toggle") {
        List.addTextBox("seloptions", R.OPTIONS, item.seloptions, "onOptionsChange({id},this.value)", "code");
        List.addHelp(R.FIELD_HELP1);
    }

    var help = ' <br/>See <a target=_blank href="http://developer.upvise.com/guide/forms.htm"><b>Form Scripting Guide</b></a>';

   
    // Default Value field
    if (type == "button") {
        var options = Templates.getOptions(Templates.getButtonOptions());
        List.addComboBox("value", "Action", item.value, onchange + ";History.reload()", options);
        if (item.value == "newform" || item.value == "newsubform") {
            // options field contains the templateid
            var options2 = Query.options("Forms.templates");
            List.addComboBox("seloptions", "Form", item.seloptions, onchange, options2);
        } else if (item.value == "code") {
            List.addTextBox("seloptions", "Javascript Code", item.seloptions, onchange, "code");
        }
    } else if (type == "label") {
        List.addCheckBox("value", "Visible in PDF", item.value, onchange);
    } else if (type == "score") {
        List.addTextBox("value", "Value", item.value, onchange);
        List.addHelp("To specify a custom color, use the format score:color, for example 95:blue");
    } else if (type == "labelscore") {
        List.addCheckBox("value", "Visible in PDF", item.value, onchange);
    } else if (type == "header") {
        List.addCheckBox("value", "Force Page Break in PDF", item.value, onchange);
    } else if (type == "photo") {
        List.addComboBox("seloptions", "Choose Action",  item.seloptions, onchange, ":Default|camera:Start Camera|scan:Scan Document");
    } else if (type == "barcode") {
        List.addComboBox("seloptions", "Choose Action", item.seloptions, onchange, ":Default|barcode:Scan Barcode|ocrcode:Scan Number");
        List.addTextBox("onchange", "On Change", item.onchange, onchange, "code");
        List.addHelp("Enter any valid Javascript code. " + help);
    } else if (type == "drawing" || type == "image") {
        List.addFileBox("value", "Default Image", item.value, onchange);
    } else if (type == "header" || type == "photo" /* || type == "signature" */) {
        // do not show default value
    } else if (type == "signature") {
        List.addTextBox("onchange", "On Change", item.onchange, onchange, "code");
        List.addHelp("Enter any valid Javascript code. " + help);
    } else if (type == "file") {
        List.addComboBox("seloptions", "Choose Folder", item.seloptions, onchange, Query.options("Files.folders"));
    } else if (type == "formula") {
        List.addTextBox("value", "Script", item.value, onchange, "code");
        List.addHelp('Enter any valid JavaScript code. You can reference the other fields in the template by their ID. Example: Math.floor(F1*F2). ' + help);
    } else {
        List.addTextBox("value", R.DEFAULTVALUE, item.value, onchange, "code");
        List.addHelp("Tip : to use a javascript statement, start with a = char. Then use statements like Date.today(), Date.now(), User.getName()." + help);
        List.addTextBox("onchange", "On Change", item.onchange, onchange, "code");
        List.addHelp("Enter any valid Javascript code. " + help);
    }

    if (type != "button" && type != "header" && type != "formula" && type != "label" && type != "score") {
        List.addCheckBox("mandatory", R.MANDATORYFIELD, item.mandatory, onchange);
        List.addHelp("Check this if the field must be filled in order to move to the next state");
    }
    if (Query.count("states", "templateid={item.formid}") > 0) {
        List.addComboBox("status", R.EDITABLE, item.status, onchange, Templates.getStateOptions(item.formid));
        List.addHelp("Defines in which state this field can be edited");
    }
    List.show();
}

function writeEditFieldTooblar(item) {
    var id = item.id;
    Toolbar.setStyle("edit");
    Toolbar.addTab(R.EDITFIELD, "editFieldTemplate({id})");
    Toolbar.addTab("Localize", "editFieldTemplateLocal({id})");
    Toolbar.addButton(R.DELETE, "deleteFieldTemplate({id},true)", "delete");

    List.forceNewLine = true;
    var template = Query.selectId("Forms.templates", item.formid);
    var prefix = (template.prefix != "") ? " - " + template.prefix : "";
    var templateName = template.name + prefix;
    List.addItemBox("Field: " + item.name + " (" + templateName + ")", Format.options(item.type, Templates.getFieldOptions()));
}

function editFieldTemplateLocal(id) {
    var item = Query.selectId("Forms.fields", id);
    var onchange = "Query.updateId('Forms.fields',{id},this.id,this.value)";
    
    writeEditFieldTooblar(item);
    List.addTextBox("label", "Default", item.label, onchange, "longtext");
    List.addTextBox("labelDE", "German", item.labelDE, onchange, "longtext");
    List.addTextBox("labelFR", "French", item.labelFR, onchange, "longtext");
    List.addTextBox("labelES", "Spanish", item.labelES, onchange, "longtext");
    List.addTextBox("labelZH", "Chinese", item.labelZH, onchange, "longtext");
    List.show();
}

Templates.onDefaultValueChange = function (fieldid, value) {
    value = value.trim();
    if (value.startsWith("=") || value.startsWith("javascript:")) {
        // keep the formatting
    } else {
        str = Format.toHtml(str);
    }
    Query.updateId("Forms.fields", fieldid, "value", value);
}

function _getOptions(labels, types) {
    var buf = new Array();
    for (var i = 0; i < labels.length; i++) {
        if (types[i] != "-") buf.push(types[i] + ":" + labels[i]);
    }
    return buf.join("|");
}

function deleteFieldTemplate(id, goback) {
    var field = Query.selectId("Forms.fields", id);
    var rank = parseInt(field.rank);

    // update the rank = rank - 1 on all the fields after the field we want to delete
    var fields = Query.select("Forms.fields", null, "formid={field.formid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var curRank = parseInt(field.rank);
        if (curRank > rank) {
            Query.updateId("Forms.fields", field.id, "rank", curRank - 1);
        }
    }
    Query.deleteId("Forms.fields", id);
    if (goback) History.back();
    else History.reload();

    App.alert("Field Deleted");
}

/////////////////////////////////////////

Templates.getTextBoxOptions = function () {
    var options = [];
    options.push({ id: "text", label: R.TEXTBOX });
    options.push({ id: "textarea", label: R.LONGTEXT });
    options.push({ id: "phone", label: R.PHONENUMBER });
    options.push({ id: "email", label: R.EMAIL });
    options.push({ id: "numeric", label: R.NUMERIC });
    options.push({ id: "decimal", label: R.DECIMAL });
    options.push({ id: "link", label: R.WEBLINK });
    options.push({ id: "currency", label: R.CURRENCY });
    options.push({ id: "barcode", label: "Scan code" });
    return options;
}

Templates.getComboBoxOptions = function () {
    var options = [];
    options.push({ id: "select", label: R.COMBOBOX });
    options.push({ id: "selectmulti", label: R.MULTISELECT });
    options.push({ id: "contact", label: R.CONTACT });
    options.push({ id: "company", label: R.COMPANY });
    options.push({ id: "user", label: R.USER });
    options.push({ id: "project", label: R.PROJECT });
    options.push({ id: "product", label: R.PRODUCT });
    options.push({ id: "opp", label: R.OPP });
    options.push({ id: "asset", label: R.ASSET });
    options.push({ id: "tool", label: R.EQUIPMENT });
    options.push({ id: "form", label: R.FORM });
    options.push({ id: "file", label: R.FILE });
    return options;
}

Templates.getDateBoxOptions = function () {
    var options = [];
    options.push({ id: "date", label: R.DATE });
    options.push({ id: "time", label: R.TIME });
    options.push({ id: "datetime", label: R.DATETIME });
    options.push({ id: "duration", label: R.DURATION });
    return options;
}

Templates.getPhotoBoxOptions = function () {
    var options = [];
    options.push({ id: "photo", label: R.PHOTO });
    options.push({ id: "drawing", label: "Drawing" });
    options.push({ id: "image", label: "Image" });
    return options;
}

Templates.getButtonOptions = function () {
    var options = [];
    options.push({ id: "newtask", label: R.NEWTASK });
    options.push({ id: "newnote", label: R.NEWNOTE });
    options.push({ id: "newevent", label: R.NEWEVENT });
    options.push({ id: "newform", label: R.NEWFORM });
    options.push({ id: "newsubform", label: "New Sub-form" })
    options.push({ id: "code", label: "Custom Code" })
    return options;
}

Templates.getSubTypeFieldsOptions = function (type) {
    var list = Templates.getSubTypeFields(type);
    if (list == null) return null;
    return Templates.getOptions(list);
}

Templates.getOptions = function (list) {
    var options = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        options.push(item.id + ":" + item.label);
    }
    return options.join("|");
}

Templates.getSubTypeFields = function (id) {
    var TEXT = Templates.getTextBoxOptions();
    var COMBO = Templates.getComboBoxOptions();
    var DATE = Templates.getDateBoxOptions();
    var PHOTO = Templates.getPhotoBoxOptions();
    
    var items = [TEXT, COMBO, DATE, PHOTO];
    for (var i = 0; i < items.length; i++) {
        var list = items[i];
        for (var j = 0; j < list.length; j++) {
            var item = list[j];
            if (item.id == id) return list;
        }
    }
    return null;
}
