
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

Forms.createForm = function (name, linkedtable, linkedid) {
    var templates = Query.select("Forms.templates", "id", "name={name}");
    if (templates.length == 0) { App.alert("No Template not found!"); return 1; }
    var templateid = templates[0].id;
    var formid = Forms.newFormInternal(templateid, linkedtable, linkedid);
    History.add("Forms.viewForm({formid})");
    History.replace("Forms.editForm({formid})");
    return 2;
}

Forms.emailCsv = function (emails, id) {
    var form = Query.selectId("Forms.forms", id)

    var filename = Query.names("templates", form.templateid) + " " + form.name;
    if (Format.forprint != null) Format.forprint();

    var csv = new CsvFile();
    //csv.writeLine(["Label", "Value"]);
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

Forms.setValue = function (id, value) {
    if (_formid == null || _formid == "" || id == null || id == "") return;
    _valueObj[id] = value;
    var values = JSON.stringify(_valueObj);
    Query.updateId("Forms.forms", _formid, "value", values);
}

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