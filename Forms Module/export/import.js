
Forms.BLANKFORM_CSV_HEADER = ["Id", "Template", "Date", "Status", "Location", "Geo", "Owner","LinkedID", "LinkedRecord", "LinkedName"];

Forms.importForms = function () {
    Toolbar.setTitle("Import Forms");
    Import.writeFileButton(R.SELECTFILE, Forms.onImportForms);
    Import.writeSampleLink(Forms.BLANKFORM_CSV_HEADER, "Upvise Form Import Sample.xlsx");
    List.show("pane");
}

Forms.onImportForms = function (lines) {
    Forms.errors = [];

    var templateMap = new HashMap();
    var templates = Query.select("Templates", "id;name");
    for (var i = 0; i < templates.length; i++) {
        var template = templates[i];
        templateMap.set(template.name, template.id);
    }

    var formMap = new HashMap();
    var forms = Query.select("Forms.forms", "id");
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        formMap.set(form.id, form);
    }

    var linkedMap = Forms._getLinkedInfoMap();

    var formList = [];
    // ignore first line for header i=0
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
       
        var formid = line[0].trim();
        if (formid == "") Forms.addImportError(i, "form ID is empty");

        var templateName = line[1].trim();
        var templateid = templateMap.get(templateName);
        if (templateid == null) Forms.addImportError(i, "template not found: " + templateName);

        if (Forms.errors.length == 0 && formMap.get(formid) == null) {
            //"Date", "Status", "Location", "Geo", "Owner", "LinkedID", "LinkedRecord", "LinkedName"            
            var formObj = { name: formid, templateid: templateid };
            formObj.date = Date.parseDateTime(line[2]);
            formObj.status = line[3];
            formObj.address = line[4];
            formObj.geo = line[5];
            formObj.owner = line[6];
            formObj.linkedid = line[7];
            formObj.linkedtable = linkedMap.get(line[8]);

            // TODO Import fields
            // Note: It is complicated to re-import data according to the field type 
            // e.g. for object types (Contact, Project,..) we need to get the record id in the correct table
            // For Formula, we must do nothing
            // We must get Field ID from CSV Label, but what if the Labels are not unique?
            // Also for the type Photo, exported files are not available
            //
            //..
            formList.push(formObj);
        }
    }

    if (Forms.errors.length > 0) {
        Forms.showImportErrors();
        return;
    } else {
        if (App.confirm("Import " + formList.length + " Forms?") == false) return;
        for (var i = 0; i < formList.length; i++) {
            var values = formList[i];
            Query.insert("Forms.forms", values);
            App.alert("Importing Form " + (i + 1));
        }
        History.reload();
    }
}

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

