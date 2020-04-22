/////////////////// Import / Export Templates
Templates.CSV_HEADER = ["templatename", "templateprefix", "fieldrank", "fieldname", "fieldlabel", "fieldlabelDE", "fieldlabelFR", "fieldlabelES", "fieldlabelZH", "fieldlabelMY","fieldtype", "fieldoptions", "fieldvalue", "mandatory", "onchange", "hidden", "group", "linkedtable", "onsubmit", "dashboardjs", "pdfoptions"];

Templates.exportTemplate = function(templateId) {
    Templates.exportTemplates([templateId]);
}

Templates.exportTemplates = function (templateIds) {
    var csv = new CsvFile();
    csv.writeLine(Templates.CSV_HEADER);

    var filename = "";
    for (var i = 0; i < templateIds.length; i++) {
        var template = Query.selectId("Forms.templates", templateIds[i]);
        filename = R.TEMPLATE + " " + template.name;
        var fields = Query.select("Forms.fields", null, "formid={template.id}", "rank");
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            var line = [template.name, template.prefix, field.rank, field.name, field.label, field.labelDE, field.labelFR, field.labelES, field.labelZH, field.labelMY, field.type, field.seloptions, field.value, field.mandatory, field.onchange, field.hidden];
            if (j == 0) {
                var group = Query.names("Forms.groups", template.groupid);
                line.push(group, template.linkedtable, template.onsubmit, template.dashboardjs, template.pdfoptions);
            } else line.push("", "", "", "", "");
            csv.writeLine(line);
        }
    }
    var title = "";
    if (templateIds.length > 1) filename = R.TEMPLATES;

    var excel = new ExcelFile();
    excel.addSheet(R.TEMPLATES, csv.getContent());
    excel.download(filename);
}

/////////////////////// Import

Templates.importTemplates = function() {
    Toolbar.setTitle(R.IMPORTTEMPLATES);
    Import.writeFileButton(null, Templates.onImportTemplates);
    Import.writeSampleLink(Templates.CSV_HEADER, "Form Templates Sample.xlsx");
    List.show("pane");
}

Templates.onImportTemplates = function (lines) {
    // Header First
    Import._parseHeader(lines[0]);
    var templatesMap = [];

    // Import each line 
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i];
        if (line != null) {
            Import.line = lines[i];

            var templateName = Import.getLineValue("templatename");
            var prefix = Import.getLineValue("templateprefix");

            var rank = Import.getLineValue("fieldrank");
            var name = Import.getLineValue("fieldname");
            var label = Import.getLineValue("fieldlabel");
            var labelDE = Import.getLineValue("fieldlabelDE");
            var labelFR = Import.getLineValue("fieldlabelFR");
            var labelES = Import.getLineValue("fieldlabelES");

            var type = Import.getLineValue("fieldtype");
            var fieldoptions = Import.getLineValue("fieldoptions");
            var fieldvalue = Import.getLineValue("fieldvalue");
            var mandatory = Import.getLineValue("mandatory");
            var onchange = Import.getLineValue("onchange");
            var hidden = Import.getLineValue("hidden");

            var group = Import.getLineValue("group");
            var linkedtable = Import.getLineValue("linkedtable");
            var onsubmit = Import.getLineValue("onsubmit");
            var dashboardjs = Import.getLineValue("dashboardjs");
            var pdfoptions = Import.getLineValue("pdfoptions");

            var templateId = templatesMap[templateName];
            if (templateId == null) {
                var values = { name: templateName, prefix: prefix, linkedtable: linkedtable, onsubmit: onsubmit, dashboardjs: dashboardjs, pdfoptions: pdfoptions };
                values.groupid = Import.lookupIdByMultiName(Query.select("Forms.groups"), "Forms.groups", group);
                templateId = Query.insert("Forms.templates", values);
                templatesMap[templateName] = templateId;
            }

            var values2 = { formid: templateId, rank: rank, name: name, label: label, type: type, seloptions: fieldoptions, value: fieldvalue, mandatory: mandatory, onchange: onchange, hidden: hidden };
            values2.labelDE = labelDE;
            values2.labelFR = labelFR;
            values2.labelES = labelES;
            Query.insert("Forms.fields", values2);
        }
    }

    App.alert(R.IMPORT_MSG + "!");
    History.reload();
}