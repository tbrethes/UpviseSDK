


/////////////////////////////////////////////////////

Forms.exportOneExcel = function (formid) {
    var form = Query.selectId("Forms.forms", formid);
    var template = Query.selectId("Forms.templates", form.templateid);

    var excelid = Forms.getTemplateExcelId(template);
    // verify the excel template file exists
    var excelFile = Query.selectId("System.files", excelid);
    if (excelFile) {
        Forms.exportCustomExcel(form, template, excelid);
        return;
    }
    var excel = new ExcelFile();
    var csv = new CsvFile();
    Forms.writeToCsv(csv, [form], template);
    excel.addSheet(template.name, csv.getContent());
    
    // get the sub forms
    var subforms = Forms.selectSubForms(form);
    var templateMap = FormUtils.groupByTemplate(subforms);
    for (var i = 0; i < templateMap.keys.length; i++) {
        var key = templateMap.keys[i];
        var obj = templateMap.get(key);
        var csv = new CsvFile();
        Forms.writeToCsv(csv, obj.forms, obj.template);
        excel.addSheet(obj.template.name, csv.getContent());
    }

    var title = Forms.getTitle(form);
    excel.download(title);
}

// templateid is optional, if not present it will export all checked forms

Forms.exportMultiple = function (templateid) {
    // if some items are checked, select only these
    var forms = null;
    var ids = Table.getChecked();
    if (ids.length > 0) {
        forms = Query.selectIds("Forms.forms", ids);
    } else {
        var where = "";
        if (templateid != null) where = "templateid={templateid}";
        where = Where.addOwner(where);
        where = Where.addDateRange(where);
        forms = Query.select("forms", "*", where, "date DESC");
    }

    var filename = R.ALLFORMS;
    if (templateid != null) filename = Query.names("templates", templateid);

    Forms.exportExcel(forms, filename);
}

Forms.exportExcel = function (forms, filename) {
    if (forms.length == 0) {
        App.alert("No form");
        return;
    }
    App.alert("Exporting...");

    var templateMap = FormUtils.groupByTemplate(forms);
    var excel = new ExcelFile();
    for (var i = 0; i < templateMap.keys.length; i++) {
        var templateid = templateMap.keys[i];
        var obj = templateMap.get(templateid);
        var csv = new CsvFile();
        Forms.writeToCsv(csv, obj.forms, obj.template);
        excel.addSheet(obj.template.name, csv.getContent());
    }
    App.alert("Downloading...");
    excel.download(filename);
    App.alert("Done");    
}

// 
Forms.exportPhotos = function (formid) {
    var form = Query.selectId("Forms.forms", formid);
    var template = Query.selectId("Forms.templates", form.templateid);

    var zip = new ZipFile();
    var csv = new CsvFile();
    Forms.writeToCsv(csv, [form], template, zip);
    zip.add("data.csv", csv.buffer.join(''));

    var filename = Forms.getTitle(form, true);
    zip.download(filename);
}


///////////////// Custom Excel Template Binding

Forms.getTemplateExcelId = function (template) {
    var options = template.pdfoptions ? JSON.parse(template.pdfoptions) : {};
    return options.excelid;
}

Forms.exportCustomExcel = function (form, template, excelid) {
    var excel = new ExcelMerge();
    excel.setTemplate(excelid);

    // bind master form values
    Forms.bindExcelValues(excel, form, "");

    // Now add all subforms also
    var subformFields = Query.select("Forms.fields", "name", "type='button' AND value='newsubform' AND formid={template.id}");
    for (var i = 0; i < subformFields.length; i++) {
        var field = subformFields[i];
        var linkedid = form.id + ":" + field.name;
        var subforms = Query.select("Forms.forms", "*", "linkedtable='Forms.forms' AND linkedid={linkedid}", "date");
        for (var j = 0; j < subforms.length; j++) {
            var subform = subforms[j];
            var prefix = field.name + "[" + (j+1) + "]";
            Forms.bindExcelValues(excel, subform, prefix);
        }
    }
    var filename = Forms.getTitle(form, true);
    excel.download(filename);
}

Forms.bindExcelValues = function (excel, form, keyPrefix) {
    Format.forprint();
    if (keyPrefix) keyPrefix += ".";
    else keyPrefix = "";

    // bind form date and owner
    excel.addValue(keyPrefix + "date", ExcelFile.format(form.date, "datetime"));
    excel.addValue(keyPrefix + "owner", form.owner);

    var fields = Forms.getFields(form);
    for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var value = ExcelFile.format(field.value, field.type, field.options);
        var key = keyPrefix + field.id;
        if (value) excel.addValue(key, value); // no need to bind empty values
    }
}