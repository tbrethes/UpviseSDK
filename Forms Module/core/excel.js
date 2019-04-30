
//zip is optional
Forms.writeToCsv = function (csv, forms, template, zip) {
    if (template == null || forms.length == 0) return;

    // Get linked items first
    var hasLinkedItems = false;
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        if (Forms.getLinkedRecord != undefined) {
            var linkeditem = Forms.getLinkedRecord(form, true); // Peformance Issue: Query.options is called xx times with options=1000+ items e.g. Assets when exporting xx forms, and options is never even used...
            if (linkeditem != null) {
                form.linkeditem = linkeditem;
                if (hasLinkedItems == false) hasLinkedItems = true;
            }
        }
    }

    var fileMap = Forms.getFilesLinkedIdMap("Forms.forms");

    var header = ["Id", "Template", "Date", "Status", "Location", "Geo", "Owner"];
    if (hasLinkedItems) header.push("LinkedID", "LinkedRecord", "LinkedName");

    var fieldsinit = Query.select("Forms.fields", "label", "formid={template.id}", "rank");
    for (var i = 0; i < fieldsinit.length; i++) {
        var field = fieldsinit[i];
        header.push(field.label);
    }


    var state = Forms.GET_STATE();

    csv.writeLine(header);

    Format.forprint();

    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        var values = new Array();
        values.push(form.name, template.name, ExcelFile.format(form.date, "datetime"), form.status, form.address, form.geo, form.owner);

        if (hasLinkedItems) {
            if (form.linkeditem != null) {
                values.push(form.linkeditem.id, form.linkeditem.label, form.linkeditem.value);
            } else {
                values.push("", "", "");
            }
        }

        // we need this because getFields uses scripting
        _valueObj = Forms._getValues(form); // we need this because Risk.view access it
        _formid = form.id;
        var includeHidden = true; // for export, we need to include the hidden fields
        var fields = Forms.getFields(form, fieldsinit, includeHidden);

        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            var displayValue = null;
            if (field.type == "photo") {
                var filenames = [];
                var files = fileMap.get(form.id + ":" + field.id);
                if (files != null) {
                    for (var k = 0; k < files.length; k++) {
                        if (zip != null) zip.addFile(files[k].id);
                        filenames.push(files[k].name);
                    }
                }
                displayValue = filenames.join(";");
            } else if (field.type == "signature") {
                displayValue = (field.value != "") ? R.YES : "";
            } else {
                displayValue = ExcelFile.format(field.value, field.type, field.options);
            }
            values.push(displayValue);
        }
        csv.writeLine(values);
    }

    Forms.RESTORE_STATE(state);
}

Forms.getFilesLinkedIdMap = function (table) {
    var where = (table != null) ? "linkedtable=" + esc(table) : "";
    var files = Query.select("System.files", "*", where, "date");
    var map = new HashMap();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var list = map.get(file.linkedrecid);
        if (list == null) {
            list = [];
            map.set(file.linkedrecid, list);
        }
        list.push(file);
    }
    return map;
}

//////////

