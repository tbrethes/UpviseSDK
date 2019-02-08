
Forms.exportJson = function (id) {
    var form = Query.selectId("Forms.forms", id);
    var json = Forms.writeToJson(form);
    _html.push("<pre>", json, "</pre>");
    List.show();
}

Forms.writeToJson = function (form) {

    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) return;

    var linkeditem = Forms.getLinkedRecord(form, true);
    var fileMap = Forms.getFilesLinkedIdMap("Forms.forms");

    var INFO = {};
    INFO["id"] = form.id
    INFO["name"] = form.name;
    INFO["template"] = template.name;
    INFO["date"] = form.date;
    INFO["status"] = form.status;
    INFO["location"] = form.location;
    INFO["geo"] = form.geo;
    INFO["owner"] = form.owner;

    var LINK = {};
    LINK["linkedid"] = linkeditem.id;
    LINK["Linkedrecord"] = linkeditem.label;
    LINK["linkedname"] = linkeditem.value;

    var state = Forms.GET_STATE();

    // we need this because getFields uses scripting
    _valueObj = Forms._getValues(form); // we need this because Risk.view access it
    _formid = form.id;
    var fields = Forms.getFields(form);

    var DATA = {};
    var HELP = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = null;
        if (field.type == "photo") {
            value = []; // for photos, value is an array of file id
            var files = fileMap.get(form.id + ":" + field.id);
            if (files != null) {
                for (var j = 0; j < files.length; j++) {
                    value.push(files[j].id);
                }
            }
        } else if (field.type == "signature") {
            value = field.value; // base64
        } else {
            value = CustomFields.formatValue(field.value, field.type, field.options);
        }
        DATA[field.id] = value;
        HELP[field.id] = field.label;
    }

    Forms.RESTORE_STATE(state);

    var OBJ = {};
    OBJ.INFO = INFO;
    OBJ.LINK = LINK;
    OBJ.DATA = DATA;
    OBJ.HELP = HELP;

    return JSON.stringify(OBJ, null, 2);
}
