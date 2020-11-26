//////////////////////// FORM DATA ACCESS
// TBR. 10/2/2020 : added null default values to reset them when changing app or switching account
var _valueObj = null;
var _changeObj = null;
var _formid = null;

Forms._EDITFORM = "Forms.editForm";
Forms._VIEWFORM = "Forms.viewForm";
Forms._VIEWFILE = null;
  
Forms.onChangeReload = true;

Forms.GET_STATE = function() {
    return { valueObj: _valueObj, formid: _formid };
}

Forms.RESTORE_STATE = function (state) {
    _valueObj = state.valueObj;
    _formid = state.formid;
}

function _updateValue(formid, fieldname, fieldvalue) {
    // 1. get the form
    var table = "Forms.Forms";
    if (Config.appid == "maintenance") table = "Maintenance.forms";
   
    // 2. Update the value : BEFORE calling the onchange
    var values = Forms._getValuesFromId(formid);
    values[fieldname] = fieldvalue;
    Query.updateId(table, formid, 'value', JSON.stringify(values));

    // 3. Execute onchange if any
    var onchange = _changeObj ? _changeObj[fieldname] : null;
    if (onchange) {
        Forms.onChangeReload = true;
        var form = Query.selectId(table, formid);
        var fields = Query.select("Forms.fields", "*", "formid={form.templateid} AND name={fieldname}");
        var fieldlabel = fields.length > 0 ? fields[0].label : null;
        var fieldid = fields.length > 0 ? fields[0].id : null;
        Forms.field = fields[0]; // TBR added 29/22.2029
        var ok = Forms._evalFormula(onchange, { value: fieldvalue, label: fieldlabel, fieldid: fieldid }, form, "ONCHANGE_" + fieldname); // value keyword is available in onchange
        if (ok === false) return;
    
        // 4. Reload if onchange
        if (onchange && Forms.onChangeReload == true) {
            History.reload();
        }
    }
}

Forms.writeEditSections = function (form) {
    var fields = Forms.getFields(form);
    var map = Forms.groupByHeader(fields);
    for (var i = 0; i < map.keys.length; i++) {
        var key = map.keys[i];
        var obj = map.get(key);
        if (obj.fields.length > 0) {
            var onclick = Forms._EDITFORM + "({form.id},null,null,{key})";
            var status = Forms.getHeaderStatus(obj.fields);
            var style = "img:folder;icon:arrow;priority:" + status.color;
            List.addItemSubtitle(obj.label, status.label, onclick, style);
        }
    }
}

Forms.writeEditFields = function (form, sectionId) {
    var stateCount = Query.count("Forms.states", "templateid={form.templateid}");

    // TBR / 9/22.20 : added
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template && template.onedit) Forms.injectCode(template.onedit, form, "ONEDIT_" + template.name);

    // form.value contains a json string of array values indexed by field names
    _changeObj = {};
    var onchange = "_updateValue({form.id},this.id,this.value)";

    _valueObj = Forms._getValues(form);
    _formid = form.id;
    var fields = Forms.getFields(form);
    if (sectionId != null) {
        var map = Forms.groupByHeader(fields);
        var obj = map.get(sectionId);
        List.addHeader(obj.label);
        fields = obj.fields;
    }

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (stateCount == 0 || field.status == -1 || field.status == form.status) {
            if (field.onchange != "") _changeObj[field.id] = field.onchange;
            if (field.mandatory == 1) field.label += " (*)";

            if (field.type == "button") {
                if (field.value == "scan") {
                    var onscan = "Forms.onScan({form.id},{field.id},this.value)";
                    List.addButton(field.label, "App.scanCode({onscan})");
                } else {
                    // 10/13/2020 : we now always display buttons in edit mode
                    CustomFields.addButton(field.id, field.label, field.value, field.options, form.id, field.guid);
                }
            } else {
                var onchange2 = (field.type == "photo") ? field.onchange : onchange;
                CustomFields.writeEditItem(field.id, field.type, field.label, field.value, onchange2, field.options, form.id); 
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
             if (field.status == -1 || form.status == field.status) {
                 CustomFields.addButton(field.id, field.label, field.value, field.options, form.id, field.guid);
             }
        } else if (form.status >= field.status || form.status == -1) {
            CustomFields.addViewItem(field.id, field.type, field.label, field.value, field.options, form.id);
        }
    }
}

///////////////////////

Forms._getValuesFromId = function (formid) {
    var table = "Forms.Forms";
    if (Config.appid == "maintenance") table = "Maintenance.forms";

    var form = Query.selectId(table, formid)
    return Forms._getValues(form);
}

// return an object for the Form values
Forms._getValues = function (form) {
    if (form && form.value) {
        try {
            return JSON.parse(form.value);
        } catch (err) { }
    }
    // error
    return {};
}

// templateFields is an optional param to optimize code if  passed
Forms.getFields = function (form, templateFields, includeHidden) {
    if (templateFields == null) {
        templateFields = Query.select("Forms.fields", "*", "formid={form.templateid}", "rank");
    }
    var formValues = Forms._getFullValues(form, templateFields);
    var lang = "en";
    if (Settings.getLanguage) lang = Settings.getLanguage();
    var hiddenFields = form.hidden ? JSON.parse(form.hidden) : [];

    var list = [];
    for (var i = 0; i < templateFields.length; i++) {
        var field = templateFields[i];
        var field2 = {};
        field2.guid = field.id; // added 10/13/2020 when adding subform link
        field2.id = field.name; // WARNING!!!
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
        // do not add the hidden fields unless asked
        if (hiddenFields.indexOf(field.name) == -1 || includeHidden === true || (field.value === "newsubform" && includeHidden === "newsubform")) {
            list.push(field2);
        }
    }
    return list;
}

// like Forms.getFields but group the fields by section header.
Forms.groupByHeader = function (fields) {
    var map = new HashMap();
    var obj = {label: R.GENERAL, fields:[]};
    map.set("", obj);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type == "header") {
            obj = { label: field.label, fields: [] };
            map.set(field.id, obj);
        }  else {
            obj.fields.push(field);
        }
    }
    return map;
}

Forms.getHeaderStatus = function (fields) {
    var hasMandatory = false;
    var isComplete = true;
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.mandatory == 1) {
            hasMandatory = true;
            if (field.type == "photo") {
                var count = Query.count("System.files", "linkedtable='Forms.forms' AND linkedrecid={field.value}");
                if (count == 0) {
                    isComplete = false;
                    break;
                }
            } else if (field.value === "") {
                isComplete = false;
                break;
            }
        }
    }

    if (hasMandatory) {
        if (isComplete) {
            return { label: R.COMPLETED, color: Color.GREEN };
        } else {
            return { label: R.INCOMPLETE, color: Color.ORANGE };
        }
    } else {
        return { label: "", color: "" };
    }
    //return hasMandatory ? { label: R.COMPLETED, color: Color.GREEN } : ;
}

Forms.getFieldLabel = function (field, lang) {
    lang = lang.toUpperCase();
    if (lang == "DE" && field.labelDE) return field.labelDE;
    else if (lang == "FR" && field.labelFR) return field.labelFR;
    else if (lang == "ES" && field.labelES) return field.labelES;
    else if (lang == "ZH" && field.labelZH) return field.labelZH;
    else if (lang == "ZHT" && field.labelZH) return field.labelZH;
    else if (lang == "MY" && field.labelMY) return field.labelMY;
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
            // Keep the raw string Value as well
            values["str" + field.name] = (value!=null) ? value : "";
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
    } else if (field.type == "decimal") {
        // get the raw string value not the float to keep trailing 00
        return valuesObj["str" + field.name];
    } else {
        var value = valuesObj[field.name];
        if (value == null) value = "";
        return value;
    }
}

// value is either a literal string or javaacript code if starts with = or javascript
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
    // value contain javascript, evaluate
    return Forms._evalFormula(value, {}, form, sourceURL);
}

Forms._evalFormula = function (js, valuesObj, form, sourceURL) {
    js = String(js);
    js = js.trim();
    if (js.substring(0, 1) == "=") js = js.substring(1);
    else if (js.indexOf("javascript:") == 0) js = js.substr("javascript:".length);

    if (sourceURL) sourceURL = sourceURL.replace(/ /g, '_').toUpperCase();
    else sourceURL = "FORMULA";
   
    var buffer = [];
    // strict mode for script?
    //if (typeof (GlobalSettings) != undefined && GlobalSettings.getString('forms.usestrict') == "1") {
    if (AccountSettings.get("forms.usestrict") == "1") {
        buffer.push("'use strict';");
    }
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

// For onedit / code 
Forms.injectCode = function (js, frm, sourceURL) {
    js = String(js).trim();
    if (js != "") {
        try {
            var form = frm; // we need the form objet here
            var link = Forms._getLink(form);
            if (WEB()) js += "\n//# sourceURL=http://FORM/" + sourceURL + ".js\n";
            // warning in order to have the "form" defined inside the js script we need eval() and not window.eval();
            eval(js);
        } catch (err) {
            if (WEB()) {
                var msg = err.name + "\n" + err.message;
                window.alert(msg);
                if (console) console.log(msg, "color:red");
            } else {
                //App.confirm("Error: " + err.message + "\n" + js);
            }
        }
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
        if (state && state.onclick) return true;
        else return false;
    }
}

Forms.canDelete = function (form) {
    var values = Forms._getValues(form);
    if (values["NODELETE"] == 1) return false;
    else return true;
}

Forms.canDuplicate = function (form) {
    //if (User.isAdmin()) return true;
    var values = Forms._getValues(form);
    if (values["NODUPLI"] == 1) return false;
    else return Forms.canEdit(form);
}

Forms.hasRight = function (action, form) {
    if (User.isAdmin()) return true;
    if (action == "editlink") return form.linkedid == "";
    return false;
}

Forms.canAddSubForm = function (form, field) {
    return Forms.canEdit(form);
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

Forms.punchCountSubforms = function (id) {
    var count = 0;
    var form = Query.selectId("Forms.forms", id);
    var subforms = Forms.selectSubForms(form);
    for (var i = 0; i < subforms.length; i++) {
        var subformid = subforms[i].id;
        count += Query.count("Forms.punchitems", "formid={subformid}");
    }
    return count;
}

Forms.getSubformTitle = function (field) {
    if (field.label.startsWith("__@")) {
        return field.label.substr(3);
    } else {
        var subtemplateid = field.seloptions;
        return Query.names("Forms.templates", subtemplateid);
    }
}

// Including subforms
Forms.getPunchData = function (id) {
    var items = Query.select("Forms.punchitems", "*", "formid={id}", "creationdate");

    var form = Query.selectId("Forms.forms", id);
    var subforms = Forms.selectSubForms(form);
    for (var i = 0; i < subforms.length; i++) {
        var subformid = subforms[i].id;
        var subformitems = Query.select("Forms.punchitems", "*", "formid={subformid}", "creationdate");
        items = items.concat(subformitems);
    }

    return Punch.groupByStatus(items);
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
        
        // we need this because Forms.getFields uses scripting with options
        _valueObj = Forms._getValues(form); // we need this because Risk.view access it
        _formid = form.id;
        var fields = Forms.getFields(forms[i]);

        var header = [];
        var values = [];
        // When there are too many columns, the table does not display in the Web browser
        var nbcolumns = Math.min(fields.length, 10);
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            if (field.type != "signature" && field.type != "photo" && field.type != "image" && field.type != "button" && field.type != "label" && field.type != "header") {
                var value = CustomFields.formatValue(field.value, field.type, field.options, true); // isWeb=true
                if (field.type == "longtext") value = Format.text(value);
                header.push(field.label);
                values.push(value);
            }
            if (values.length > nbcolumns) break;
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