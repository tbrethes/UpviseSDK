//////////////////////// FORM DATA ACCESS
var _valueObj;
var _valueTable;
var _changeObj;
var _formid;

Forms._EDITFORM = "Forms.editForm";
Forms._VIEWFORM = "Forms.viewForm";

function _updateValue(formid, fieldname, fieldvalue) {

    _valueObj[fieldname] = fieldvalue;

    var onchange = _changeObj[fieldname];
    if (onchange) {
        var form = Query.selectId("Forms.forms", _formid);
        var ok = Forms._evalFormula(onchange, null, form);
        if (ok === false) return; 
    }

    var values = JSON.stringify(_valueObj);
    var table = (_valueTable != null) ? _valueTable : "Forms.forms";
    Query.updateId(table, formid, 'value', values);

    if (onchange) {
        History.reload();
    }
}

Forms.writeEditFields = function (form) {
    // form.value contains a json string of array values indexed by field names
    _valueObj = Forms._getValues(form);
    _changeObj = {};
    _formid = form.id;
    var onchange = "_updateValue({form.id},this.id,this.value)";

    var stateCount = Query.count("Forms.states", "templateid={form.templateid}");
    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (stateCount == 0 || field.status == -1 || field.status == form.status) {
            if (field.onchange != "") _changeObj[field.id] = field.onchange;
            if (field.mandatory == 1) field.label += " (*)";

            if (field.type == "button" && field.value == "scan") {
                var onscan = "Forms.onScan({form.id},{field.id},this.value)";
                List.addButton(field.label, "App.scanCode({onscan})");
            } else {
                CustomFields.writeEditItem(field.id, field.type, field.label, field.value, onchange, field.options, form.id);
            }
        }
    }
}

Forms.onScan = function (formid, fieldid, value) {
    var onchange = _changeObj[fieldid];
    if (onchange != null && onchange != "") {
        var js = "function f1() { var value=" + esc(value) + "; var formid=" + esc(formid) + ";" + onchange + "};f1();";
        var ok = Forms._evalFormula(js);
    }
}

Forms.writeViewFields = function (form) {
    _valueObj = Forms._getValues(form); // we need this because Risk.view access it
    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type == "button") {
            if (field.status == 0 || field.status == -1 || form.status == field.status) {
                CustomFields.addButton(field.label, field.value, field.options, form.id);
            }
        } else if (form.status >= field.status) {
            CustomFields.addViewItem(field.id, field.type, field.label, field.value, field.options, form.id);
        }
    }
}

///////////////////////

// return an object for the Form values
Forms._getValues = function (form) {
    if (form.value != null && form.value != "") {
        try {
            return JSON.parse(form.value);
        } catch (err) { }
    }
    return new Object();
}

Forms.getFields = function (form, type) {
    var where = "formid={form.templateid}";
    if (type != null) where += " AND type={type}";
    var fields = Query.select("Forms.fields", "name;label;value;type;seloptions;status;mandatory;onchange", where, "rank");
    var formValues = Forms._getFullValues(form, fields);

    var list = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var field2 = {};
        field2.id = field.name;
        field2.label = field.label;
        field2.type = field.type;
        field2.status = field.status;
        field2.value = Forms._getValue(formValues, field, form);
        field2.options = Forms._eval(field.seloptions, form);
        field2.mandatory = field.mandatory;
        field2.onchange = field.onchange;

        if (field2.type == "risk") {
            var risk = Query.selectId("Qhse.risks", field.label);
            if (risk != null) {
                field2.label = risk.name;
                field2.options = risk.measures;
            }
        }
        list.push(field2);
    }
    return list;
}

/////////////////////////////////// Private

Forms._getFullValues = function (form, fields) {
    var values = Forms._getValues(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = values[field.name];
        if (field.type == 'date' || field.type == 'time' || field.type == 'datetime' || field.type == 'duration') {
            value = (value != null) ? parseInt(value) : 0;
        } else if (field.type == 'numeric') {
            value = (value != null && value != "") ? parseInt(value) : "";
        } else if (field.type == 'decimal') {
            value = (value != null && value != "") ? parseFloat(value) : "";
        } else if (value == null) {
            value = "";
        }
        values[field.name] = value;
    }
    return values;
}

Forms._eval = function (value, form) {
    if (value == null || value == "") {
        return "";
    } else if (value.indexOf("javascript:") == 0) {
        value = value.substr("javascript:".length);
    } else if (value.indexOf("=") == 0) {
        value = value.substr(1);
    } else {
        return value;
    }

    // link variable can be used in when doing eval of the option javascript code....
    var link = (form.linkedtable != null && form.linkedid != null) ? Query.selectId(form.linkedtable, form.linkedid) : null;
    if (link != null) {
        // also add the custom fields to the lik object
        var custom = CustomFields.loadValues(link.custom);
        for (var key in custom) {
            link[key] = custom[key];
        }
    }
    //  The Eval value string CAN reference the "link" keyword for custom code
    try {
        var result = eval(value);
        return result;
    } catch (e) {
        return "Error: " + e.message;
    }
}

Forms._getValue = function (valuesObj, field, form) {
    if (field.type == "header" || field.type == "label" || field.type == "image" || field.type == "button") {
        return field.value;
    } else if (field.type == "photo") {
        return form.id + ":" + field.name;
    } else if (field.type == "formula") {
        return Forms._evalFormula(field.value, valuesObj, form);
    } else {
        var value = valuesObj[field.name];
        if (value == null) value = "";
        return value;
    }
}

Forms._evalFormula = function (js, valuesObj, form) {
    js = js.trim();
    if (js.substring(0, 1) == "=") js = js.substring(1);

    var buffer = [];
    for (var member in valuesObj) {
        buffer.push('var ' + member + '=' + esc(valuesObj[member]));
    }
    buffer.push(js);
    try {
        // link var is available in eval buffer;
        var link = (form != null && form.linkedtable) ? Query.selectId(form.linkedtable, form.linkedid) : null;
        var result = eval(buffer.join(';') + "\n//# sourceURL=FORM_FORMULA.js");
        return result;
    } catch (e) {
        if (WEB()) {
            var msg = "Form Eval Formula Error:\n" + e.message + "\nForm: " + form.name;
            if (window.console != null) window.console.log(msg);
        }
        return "Error: " + e.message;
    }
}


/////////////////////

Forms.canEdit = function (form) {
    // Admin and manager can always edit
    if (User.isManager()) return true;
    // user who created the form can edit it in Draft mode = 0
    if (form.owner == User.getName() && form.status == 0) return true;
    return false;
}

Forms.hasRight = function (action, form) {
    if (User.isAdmin()) return true;
    if (action == "editlink") return form.linkedid == "";
    return false;
}


Forms.canCreate = function () {
    if (User.isAdmin()) return true;
    else return AccountSettings.get("forms.disablenew") != "1";
}

Forms.canEditTemplates = function () {
    if (AccountSettings.get("forms.templateadmin") == "1") return User.isAdmin();
    else return User.isManager();
}

Forms.punchCount = function(id) {
    return Query.count("Forms.punchitems", "formid={id}");
}

/////////////////////

Forms.getCreator = function (form) {
    return (form.owner != "") ? form.owner.split("|")[0] : "";
}

// used on web only...
Forms.getLastSignature = function (staff) {
    var forms = Query.select("Forms.forms", "history", null, "date DESC");
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        var history = Forms.getHistory(form);
        for (var j = 0; j < history.length; j++) {
            var item = history[j];
            if (item.staff == staff && item.signature != null) {
                return item.signature;
            }
        }
    }
    return null;
}

///////////// History

Forms.getHistory = function (form) {
    try {
        return JSON.parse(form.history);
    } catch (e) {
        return [];
    }
}

Forms.addHistory = function (form, name, note, signature) {
    var history = null;
    try {
        history = JSON.parse(form.history);
    } catch (e) {
    }
    if (history == null) history = [];

    history.push({ name: name, note: note, staff: User.getName(), date: Date.now(), signature: signature });
    Query.updateId("Forms.forms", form.id, "history", JSON.stringify(history));
}


