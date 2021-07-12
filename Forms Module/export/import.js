

Query.mapId = function(table, column, where) {
    if (!column) return null;

    var map = [];
    var items = Query.select(table, "id;" + column, where);
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        map[item[column]] = item.id;
    }
    return map;
}

Forms.importForms = function (templateid) {
    var template = Query.selectId("Forms.templates", templateid);
    Forms.importTemplateId = templateid;
    var header = Forms.getFormImportHeader(templateid);

    Toolbar.setTitle("Import Forms : " + template.name);
    Import.writeFileButton(R.SELECTFILE, Forms.onImportForms);
    Import.writeSampleLink(header, "Upvise Form Import - " + template.name + ".xlsx");
    List.show("pane");
}

Forms.getFormImportHeader = function (templateid) {
    var header = ["Id", "Name", "Date", "Status", "Address", "Owner", "LinkedID", "LinkedRecord"];
    let fields = Forms.getFormImportFields(templateid);
    for (let field of fields) {
        header.push(field.label);
    }
    return header
}

Forms.getFormImportFields = function(templateid) {
    let fields = [];
    let allFields = Query.select("Forms.fields", "label", "formid={templateid}", "rank");
    for (let field of allFields) {
        if (field.type != "header" && field.type != "button" && field.type != "formula" && field.type != "label" && field.type != "photo") {
            fields.push(field);
        }
    }
    return fields;
}

Forms.onImportForms = function (lines) {
    Forms.errors = [];
    var template = Query.selectId("Forms.templates", Forms.importTemplateId);
    if (!template) return;


    var fields = Forms.getFormImportFields(template.id);

    var contactMap  = Query.mapId("Contacts.contacts", "name");
    var companyMap  = Query.mapId("Contacts.companies", "name");
    
    var forms = [];
    // Parse the first line header
    Import._parseHeader(lines[0]);
    // Import each line 
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        if (line != null) {
            Import.line = lines[i];
            var obj = {};
            obj.templateid = template.id;
            obj.id = Import.getLineValue("id");
            obj.name = Import.getLineValue("name");
            obj.date = Date.parseDate(Import.getLineValue("date"));
            obj.status = Import.getLineValue("status");
            obj.address = Import.getLineValue("address");
            //obj.geo = Import.getLineValue("geo");
            obj.owner = Import.getLineValue("owner");
            obj.linkedid = Import.getLineValue("linkedid");
            obj.linkedtable = Import.getLineValue("linkedrecord");

            obj.value = {};
            for (let field of fields) {
                let value = Import.getLineValue(field.label);
                if (field.type == "date") value = Date.parseDate(value);
                else if (field.type == "datetzi") value = Date.parseDate(value, "utc");
                else if (field.type == "datetime") value = Date.parseDateTime(value);
                else if (field.type == "contact") value = contactMap[value] ? contactMap[value] : value;
                else if (field.type == "company") value = companyMap[value] ? companyMap[value] : value;

                // TODO : add lookup for other field type
                obj.value[field.name] = value; 
            }
            obj.value = JSON.stringify(obj.value);
            forms.push(obj);
        }
    }
    
    if (App.confirm("Import " + forms.length  + " forms?") == false) return;

    for (let obj of forms) {
        if (Query.selectId("Forms.forms", obj.id)) {
            Query.deleteId("Forms.forms", obj.id);
        }
        Query.insert("Forms.forms", obj);
    }
    History.reload();
}
/*
Forms.addImportError = function (line, msg) {
    Forms.errors.push({line:line+1, msg:msg})
}

Forms.showImportErrors = function () {
    var buf = [];
    for (var i = 0; i < Forms.errors.length; i++) {
        var obj = Forms.errors[i];
        buf.push("Line " + obj.line + ": " + obj.msg);
    }
    alert(buf.join("\n"));
}
*/
