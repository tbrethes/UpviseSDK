
/////  Javascript Form scripting: on submit javascript custom code

Forms.newQuote = function (formid) {
    var form = Query.selectId("Forms.forms", formid);
    var asset, site;
    var companyid = "";
    var description = "";
    if (form.linkedtable == "Assets.assets") {
        var asset = Query.selectId("Assets.assets", form.linkedid);
        if (asset != null) {
            var site = Query.selectId("Assets.locations", asset.locationid);
            companyid = (site != null) ? site.companyid : asset.companyid;
        }
    } else if (form.linkedtable == "Assets.locations") {
        var site = Query.selectId("Assets.locations", form.linkedid);
        companyid = (site != null) ? site.companyid : "";
    }

    description = Forms.getDescription(form.id);
    var onclick = "Sales.newQuote('companyid',{companyid},{description})";
    History.redirect(onclick);
    return 2; // success do not navigate
}

Forms.getDescription = function (id) {
    var desc = [];
    var form = Query.selectId("Forms.forms", id)
    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.value != "" && field.type != "signature" && field.type != "photo" && field.type != "button") desc.push(field.label + ": " + field.value);
    }
    return desc.join("<br/>");
}

Forms.getTemplateId = function (name) {
    var templates = Query.select("Forms.templates", "id", "name={name}");
    if (templates.length == 0) templates = Query.select("Forms.templates", "id", "prefix={name}");
    return (templates.length > 0) ? templates[0].id : null;
}

Forms.createForm = function (name, linkedtable, linkedid, values) {
    var templateid = Forms.getTemplateId(name);
    if (templateid == null) { App.alert("No Template not found!"); return 1; }

    var formid = Forms.newFormInternal(templateid, linkedtable, linkedid, values);

    History.add(Forms._VIEWFORM + "({formid})");
    History.replace(Forms._EDITFORM + "({formid})");
    return 2;
}

Forms.emailCsv = function (emails, id) {
    var form = Query.selectId("Forms.forms", id);

    var filename = Query.names("Forms.templates", form.templateid) + " " + form.name;
    if (Format.forprint != null) Format.forprint();

    var csv = new CsvFile();
    csv.writeLine(["Form ID", filename]);
    csv.writeLine(["Submitted by", form.owner]);
    csv.writeLine(["Submitted Date", Format.datetime(form.date)]);

    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type != "signature" && field.type != "photo" && field.type != "button") {
            var value = CustomFields.formatValue(field.value, field.type, field.options);
            if (field.type == "longtext") value = Format.text(value);
            else if (field.type == "label" || field.type == "header") value = "";
            csv.writeLine([field.label, value]);
        }
    }

    var content = csv.getContent();
    var filename = filename + ".csv";
    Notif.sendCsv(emails, content, filename);
}

Forms.emailPdf = function (formid, email, subject, body) {
    Forms.exportPdf(formid, "serveremail", email, subject, body);
}

// set the value for the current form only
Forms.setValue = function (id, value) {
    if (_formid == null || _formid == "" || id == null || id == "") return;
    _valueObj[id] = value;
    var values = JSON.stringify(_valueObj);
    Query.updateId("Forms.forms", _formid, "value", values);
}

// second parameter formid is optional, if null, it means current form
Forms.getValue = function (fieldid, formid) {
    if (!fieldid) return null; // error
    var value;
    if (formid == null) {
        // the current form
        if (_formid == null || _formid == "") return null; // error
        value = _valueObj[fieldid];
    } else {
        // a specific form
        var form = Query.selectId("Forms.forms", formid);
        if (form == null) return "";
        var values = JSON.parse(form.value);
        value = values[fieldid];
    }
    if (value == null) value = "";
    return value;
}

Forms.getIntValue = function (fieldid, formid) {
    return parseInt(Forms.getValue(fieldid, formid));
}

Forms.getFloatValue = function (fieldid, formid) {
    return parseFloat(Forms.getValue(fieldid, formid));
}

/////////////////////////////////////////////////

Forms.extractValue = function(buffer, label) {
    if (buffer == null) return "";
    var index = buffer.indexOf(label);
    if (index == -1) return "";
    index += label.length;
    var value = "";
    while (index < buffer.length) {
        var c = buffer.charAt(index);
        if (c == " " || c == "\n") {
            if (value.length > 0) break;
        } else {
            value += c;
        }
        index++;
    }
    return value;
}

Forms.setCustomField = function (table, id, name, value) {
    if (table == null || table == "" || id == "" || id == null) return;
    var obj = Query.selectId(table, id);
    if (obj == null || obj.custom == null) return;
    var custom = (obj.custom != "") ? JSON.parse(obj.custom) : {};
    custom[name] = value;
    Query.updateId(table, id, "custom", JSON.stringify(custom));
}

Forms.getCustomField = function (table, id, name) {
    if (table == null || table == "" || id == "" || id == null) return "";
    var obj = Query.selectId(table, id);
    if (obj == null || obj.custom == null) return;
    var custom = (obj.custom != "") ? JSON.parse(obj.custom) : {};
    var value = custom[name];
    return (value != null) ? value : "";
}

///////////////

Forms.getAllFields = function (form) {
    var where = "formid={form.templateid}";
    var fields = Query.select("Forms.fields", "name;label;value;type;seloptions;status;mandatory", where, "rank");
    var formValues = Forms._getFullValues(form, fields);

    var list = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var field2 = {};
        field2.id = field.name;
        field2.label = field.label;
        field2.type = field.type;
        field2.options = field.seloptions;
        field2.mandatory = field.mandatory;
     
        var value = formValues[field.name];
        if (value == null) value = "";
        
        field2.value = value;

        list.push(field2);
    }
    return list;
}


Forms.selectDataset = function (name, orderby) {
    var sets = Query.select("Forms.datasets", "id", "name={name}");
    if (sets.length == 0) return [];
    var datasetid = sets[0].id;
    if (orderby == null) orderby = "name";
    return Query.select("Forms.dataitems", "code;name", "datasetid={datasetid}", orderby);
}

Forms.datasetOptions = function (name, orderby) {
    var items = Forms.selectDataset(name, orderby);
    var options = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var str = item.code ? item.code + ":" + item.name : item.name;
        options.push(str);
    }
    return options.join("|");
}

Forms.getForm = function (templateName, formName) {
    var templateid = Forms.getTemplateId(templateName);
    if (templateid == null) return null;
    var forms = Query.select("Forms.forms", "*", "templateid={templateid} AND name={formName}");
    if (forms.length == 0) return null;
    var form = forms[0];
    var values = JSON.parse(form.value);
    return values;
}

// return a list of subform ids for this field
Forms.getFormIds = function (fieldname, formid) {
    if (formid == null) formid = _formid;
    var linkedid = _formid + ":" + fieldname;
    var list = [];
    var subforms = Query.select("Forms.forms", "id", "linkedtable='Forms.forms' AND linkedid={linkedid}", "date DESC");
    for (var i = 0; i < subforms.length; i++) {
        list.push(subforms[i].id);
    }
    return list;
}