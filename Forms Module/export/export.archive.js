
/////////////////

Forms.exportWithArchive = function (templateid, kind) {
    var template = Query.selectId("Forms.templates", templateid);
    var filename = template.name + " INCLUDING ARCHIVE";
    
    // 1. Download Production Data
    Toast.show("Exporting Forms", false);
    var flag = 0; // production data
    var where = "templateid={templateid}";
    Query._selectTableAsync("forms.forms", "*", where, flag, function (forms) {
    
        // 2. Also Download Archive Data
        Toast.show("Exporting Archive", false);
        var flag = 2; // archive data
        Query._selectTableAsync("forms.forms", "*", where, flag, function (archivedForms) {
            forms = forms.concat(archivedForms);

            // 3. Generate and save CSV locally
            Toast.show("Generating CSV File", false);

            window.setTimeout(function () {
                //Toast.show("Saving CSV File...", false);
                var csv = Forms.writeToCsvSimple(forms, template);
                csv.saveLocal(filename);
                Toast.hide();
            }, 1);

        });

    });
}

//////////////////////

// This is an optimized, simplier implementation od Fors.writeToCsv() located in core/excel.js with no formating value for Excel server side processing
// and with no display of filenames for photos 
Forms.writeToCsvSimple = function (forms, template) {
    var csv = new CsvFile();
    if (template == null || forms.length == 0) return csv;

    var header = ["Id", "Template", "Date", "Status", "Location", "Geo", "Owner"];
    header.push("LinkedID", "LinkedRecord", "LinkedName");

    var templateFields = Query.select("Forms.fields", "label", "formid={template.id}", "rank");
    for (var i = 0; i < templateFields.length; i++) {
        var field = templateFields[i];
        header.push(field.label);
    }
    header.push("History");

    csv.writeLine(header);

    var state = Forms.GET_STATE();

    // compute it once.
    var linkedType = Format.options(template.linkedtable, Forms.getLinkedOptions());
    
    Format.forprint();

    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        var values = new Array();
        values.push(form.name, template.name, CustomFields.formatValue(form.date, "datetime"), form.status, form.address, form.geo, form.owner);

        // get the linked record :
        var linked = (form.linkedtable && form.linkedid) ? Query.selectId(form.linkedtable, form.linkedid) : null;
        if (linked) {
            values.push(linked.id, linkedType, linked.name);
        } else {
            values.push(form.linkedid, linkedType, "");
        }
        
        // we need this because getFields uses scripting
        _valueObj = Forms._getValues(form); // we need this because Risk.view access it
        _formid = form.id;
        var includeHidden = true;
        var fields = Forms.getFields(form, templateFields, includeHidden); // pass templateField to optimize speed

        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            var displayValue = null;
            if (field.type == "photo") {
                // do not output anything here
            } else if (field.type == "signature") {
                displayValue = (field.value != "") ? R.YES : "";
            } else {
                displayValue = CustomFields.formatValue(field.value, field.type, field.options);
            }
            values.push(displayValue);
        }
        // add history JSON raw value as the last field
        values.push(form.history);

        csv.writeLine(values);
    }

    Forms.RESTORE_STATE(state);

    return csv;
}

////////////


Forms.exportTest = function (templateid) {
    //var template = Query.selectId("Forms.templates", templateid);
    //var filename = template.name + " INCLUDING ARCHIVE";

    var url = "export?templateid=" + templateid + "&auth=" + User.token;
    App.web(url);
}