//////////////////////// FORM DATA ACCESS
var _valueObj;
var _valueTable;
var _changeObj;
var _formid;

Forms._EDITFORM = "Forms.editForm";
Forms._VIEWFORM = "Forms.viewForm";
Forms._VIEWFILE = null;

Forms.GET_STATE = function() {
    return { valueObj: _valueObj, formid: _formid };
}

Forms.RESTORE_STATE = function (state) {
    _valueObj = state.valueObj;
    _formid = state.formid;
}

function _updateValue(formid, fieldname, fieldvalue) {

    _valueObj[fieldname] = fieldvalue;

    var onchange = _changeObj[fieldname];
    if (onchange) {
        var form = Query.selectId("Forms.forms", formid);
        var fields = Query.select("Forms.fields", "*", "formid={form.templateid} AND name={fieldname}");
        var fieldlabel = fields.length > 0 ? fields[0].label : null;
        var ok = Forms._evalFormula(onchange, { value: fieldvalue, label: fieldlabel }, form, "ONCHANGE_" + fieldname); // value keyword is available in onchange
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
    _formid = form.id;
    _changeObj = {};
    var onchange = "_updateValue({form.id},this.id,this.value)";

    var stateCount = Query.count("Forms.states", "templateid={form.templateid}");
    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (stateCount == 0 || field.status == -1 || field.status == form.status) {
            if (field.onchange != "") _changeObj[field.id] = field.onchange;
            if (field.mandatory == 1) field.label += " (*)";

            if (field.type == "button") {
                if (field.value == "scan") {
                    var onscan = "Forms.onScan({form.id},{field.id},this.value)";
                    List.addButton(field.label, "App.scanCode({onscan})");
                } else if (form.linkedtable == "Forms.forms") {
                    // display button in edit mode only for subform 
                    CustomFields.addButton(field.id, field.label, field.value, field.options, form.id);
                }
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
        var form = Query.selectId("Forms.forms", formid);
        var ok =  Forms._evalFormula(js, {}, form, "ONSCAN_" + fieldid);
    }
}

Forms.writeViewFields = function (form) {
    _valueObj = Forms._getValues(form); // we need this because Risk.view access it
    _formid = form.id;
    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type == "button") {
            if (field.status == -1 || form.status == field.status) { // removed field,status == 0
                CustomFields.addButton(field.id, field.label, field.value, field.options, form.id);
            }
        } else if (form.status >= field.status || form.status == -1) {
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
    var fields = Query.select("Forms.fields", "*", where, "rank");
    var formValues = Forms._getFullValues(form, fields);
    var lang = "en";
    if (Settings.getLanguage) lang = Settings.getLanguage();

    var list = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var field2 = {};
        field2.id = field.name;
        field2.label = Forms.getFieldLabel(field, lang);
        field2.type = field.type;
        field2.status = field.status;
        field2.value = Forms._getValue(formValues, field, form);
        field2.options = Forms._eval(field.seloptions, form, "OPTIONS_" + field.name);
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

Forms.getFieldLabel = function (field, lang) {
    lang = lang.toUpperCase();
    if (lang == "DE" && field.labelDE) return field.labelDE;
    else if (lang == "FR" && field.labelFR) return field.labelFR;
    else if (lang == "ES" && field.labelES) return field.labelES;
    else return field.label;
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

Forms._getLink = function (form) {
    if (form && form.linkedtable && form.linkedid) {
        var linkedid = form.linkedid;
        // subforms have a linkedid which is formid:fieldid
        if (form.linkedtable == "Forms.forms") linkedid = linkedid.split(":")[0];
        return Query.selectId(form.linkedtable, linkedid);
    } else {
        return null;
    }
}

Forms._getValue = function (valuesObj, field, form) {
    if (field.type == "header" || field.type == "label" || field.type == "button") {
        return field.value;
    } else if (field.type == "image") {
        var value = valuesObj[field.name];
        return value ? value : field.value;
    } else if (field.type == "photo") {
        return form.id + ":" + field.name;
    } else if (field.type == "formula") {
        return Forms._evalFormula(field.value, valuesObj, form, "FORMULA_" + field.name);
    } else {
        var value = valuesObj[field.name];
        if (value == null) value = "";
        return value;
    }
}

Forms._eval = function (value, form, sourceURL) {
    if (value == null || value == "") {
        return "";
    } else if (value.indexOf("javascript:") == 0) {
        value = value.substr("javascript:".length);
    } else if (value.indexOf("=") == 0) {
        value = value.substr(1);
    } else {
        return value;
    }
    // value is javascript, eval
    return Forms._evalFormula(value, {}, form, sourceURL);
}

Forms._evalFormula = function (js, valuesObj, form, sourceURL) {
    js = js.trim();
    if (js.substring(0, 1) == "=") js = js.substring(1);
    else if (js.indexOf("javascript:") == 0) js = js.substr("javascript:".length);

    if (sourceURL) sourceURL = sourceURL.replace(/ /g, '_').toUpperCase();
    else sourceURL = "FORMULA";
   
    var buffer = [];
    for (var member in valuesObj) {
        buffer.push('var ' + member + '=' + esc(valuesObj[member]) + ";");
    }
    buffer.push(js);
    if (WEB()) buffer.push("//# sourceURL=http://FORM/" + sourceURL + ".js");
    buffer = buffer.join('\n');
    try {
        // link var is available in eval buffer, as well as form object
        var link = Forms._getLink(form);
        var result = eval(buffer);
        return result;
    } catch (e) {
        if (WEB()) {
            var msg = "%cForm Eval Formula Error:\n" + e.message + "\nForm: " + form.name + "\nSource: " + sourceURL; 
            if (console != null) console.log(msg, "color:red");
        } else {
            App.confirm("Error: " + e.message + "\n" + buffer);
        }
        return "Error: " + e.message;
    }
}


/////////////////////

Forms.canEdit = function (form) {
    // Admin and manager can always edit
    if (User.isManager()) return true;
    // user(s) who own the form can edit it in Draft mode = 0
    if (form.status == 0) {
        return MultiValue.contains(form.owner, User.getName()); 
    } else {
        // is current user part of the current workflow state
        var state = Forms.getState(form);
        if (state && state.onclick) return true
        else return false;
    }
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
            if (item.staff == staff && item.signature) {
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

////////////////
// WEB ONLY
Forms.writeSubformsTable = function (forms, editable) {

    // remember the current form state (coming from +valueObj ....)
    var state = Forms.GET_STATE();

    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        
        // we need this because getFields uses scripting with options
        _valueObj = Forms._getValues(form); // we need this because Risk.view access it
        _formid = form.id;

        var fields = Forms.getFields(forms[i]);
        var header = [];
        var values = [];
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            if (field.type != "signature" && field.type != "photo" && field.type != "image" && field.type != "button" && field.type != "label" && field.type != "header") {
                var value = CustomFields.formatValue(field.value, field.type, field.options);
                if (field.type == "longtext") value = Format.text(value);
                header.push(field.label);
                values.push(value);
            }
        }
        if (i == 0) {
            List.addHeader(header);
            if (WEB()) NextPrevious.addSection();
        }
        var func = editable ? Forms._EDITFORM : Forms._VIEWFORM;
        var style = form.color ? "priority:" + form.color : "";
        List.add(values, func + "({forms[i].id})", style);
    }

    // restore the current form state (we changed it with valueObj = xxx)
    Forms.RESTORE_STATE(state);
}

