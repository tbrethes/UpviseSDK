

Templates.writeEditIntegration = function (template) {
    var url = "v2/export?a=form&auth=" + encodeURIComponent(User.token) + "&templateid=" + encodeURIComponent(template.id); 
    List.addTextBox("url", "URL", document.URL + url, "", "longtext");
}

Templates.writeExportIds = function (template) {
    var fields = Query.select("Forms.fields", "*", "formid={template.id}", "exportid");
    List.addHeader(["Export ID", "Label", ""]);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        List.add([field.exportid, field.label, ""]);
    }
}

Templates.enableIntegration = function (templateid, yes) {
    var value = "";
    if (yes == true) {
        var obj = {};
        obj.url = "export?a=form&auth=" + encodeURIComponent(User.token) + "&templateid=" + encodeURIComponent(templateid);
        value = JSON.stringify(obj);

        Templates.generateExportIds(templateid);
    } else {
        value = "";
        Templates.resetExportIds(templateid);
    }
    Query.updateId("Forms.templates", templateid, "export", value);
    History.reload();
}

/////////////////////////

Templates.generateExportIds = function (templateid) {
    var fields = Query.select("Forms.fields", "*", "formid={templateid} AND exportid=''");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var exportid = Templates.computeExportId(field.rank, field.label);
        Query.updateId("Forms.fields", field.id, "exportid", exportid);
    }
}

Templates.resetExportIds = function (templateid) {
    var fields = Query.select("Forms.fields", "*", "formid={templateid}");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        Query.updateId("Forms.fields", field.id, "exportid", "");
    }
}

Templates.computeExportId = function (rank, label) {
    var exportid = "F" + padNumber(rank, 3);
    exportid += "-" + cleanString(label);
    return exportid;
}

function padNumber(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function cleanString(label) {
    var buffer = "";
    label = label.trim();
    var words = label.split(" ");
    for (var i = 0; i < words.length; i++) {
        word = words[i];
        // keep only a to z , 0 to 9
        word = word.replace(/[^a-zA-Z0-9]/g, '');
        // first letter uppercase
        word = word.charAt(0).toUpperCase() + word.slice(1);
        buffer += word;
        if (buffer.length > 30) break;
    }
    return buffer;
}