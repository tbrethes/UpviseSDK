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

    // Keep in memory the value BEFORE the onchange
    var oldvalue = values[fieldname];

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
        Forms.field = fields[0]; // TBR added 29/22/2019
        var ok = Forms._evalFormula(onchange, { oldvalue: oldvalue, value: fieldvalue, label: fieldlabel, fieldid: fieldid,  }, form, "ONCHANGE_" + fieldname); // value keyword is available in onchange
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
        } else List.addHeader(obj.label);
    }
}

Forms.writeEditFields = function (form, sectionId) {
    // 4 March 2022: make sure the libjs has been loaded
    Forms.injectCodeLibjs();
    
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
    // 4 March 2022: make sure the libjs has been loaded
    Forms.injectCodeLibjs();
        
     // 19 April 2021 : buttons are now visible in view mode, so we need the onedit code here too
     var template = Query.selectId("Forms.templates", form.templateid);
     if (template) Forms.injectCode(template.onedit, form, "ONEDIT_" + template.name);

    _valueObj = Forms._getValues(form); // we need this because Risk.view access it
    _formid = form.id;
    CustomFields.curHeader = null;
    var fields = Forms.getFields(form);

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var isVisible = true;
        if (field.type == "button") {
            isVisible = (field.status == -1 || form.status == field.status);
        } else {
            isVisible = (form.status >= field.status || form.status == -1 || form.status == -2);
        }
        if (isVisible) {
            CustomFields.addViewItem(field.id, field.type, field.label, field.value, field.options, form.id, field.guid);
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
    if (lang == "pt") lang = "my"; // Portugese redirects to MY (Burmese)
    
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
    var obj;
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type == "header") {
            obj = { label: field.label, fields: [] };
            map.set(field.id, obj);
        }  else {
            if (obj == null) {
                obj = {label: R.GENERAL, fields:[]};
                map.set("", obj);
            }
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
    for (var member in valuesObj) {
        if (member != "") buffer.push('var ' + member + '=' + esc(valuesObj[member]) + ";");
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


Forms.injectCodeLibjs = function() {
    try {
        var libjs = GlobalSettings.getString("forms.libjs", "").trim();
        // we use the libjs code length as a hashcode
        if (Forms.LIBJS_HASH === libjs.length || libjs == "") {
            return;
        }
        Forms.LIBJS_HASH = libjs.length;

        if (WEB()) libjs += "\n//# sourceURL=http://FORM/LIBJS.js\n";
        eval(libjs);
    } catch (err) {
        if (WEB()) {
            var msg = "FORMS LIBJS\n" + err.name + "\n" + err.message;
            window.alert(msg);
            if (console) console.log(msg, "color:red");
        }
    }
}

// For onedit / code 
Forms.injectCode = function (js, frm, sourceURL) {
    try {
        if (js) js = String(js).trim();
        if (!js) return;
        
        // we need the form & link objet here in local scope for eval()
        var form = frm;
        var link = Forms._getLink(form);

        // warning in order to have the "form" defined inside the js script we need eval() and not window.eval()
        if (WEB() && sourceURL) js += "\n//# sourceURL=http://FORM/" + sourceURL.replace(/ /g, '_') + ".js\n";
        eval(js);
    } catch (err) {
        if (WEB()) {
            var msg = err.name + "\n" + err.message;
            window.alert(msg);
            if (console) console.log(msg, "color:red");
        } else { 
            App.confirm("Error: " + err.message + "\n" + js);
        }
    }
}

/////////////////////

// state may optionally to passed to optimize perf on mobile
Forms.canEdit = function (form, state) {
    // Admin can always edit
    if (User.isAdmin()) return true;

    var hasWorkflow = Query.count("Forms.states", "templateid={form.templateid}") > 0;
    if (hasWorkflow == false) {
        if (form.status == 1) {
            if (GlobalSettings.getString("forms.editsubmitadmin") == "1") return false;
        }
        // manager can always edit
        if (User.isManager()) return true;
        
        else if (form.status == 0) {
            // user(s) who own the form can edit it in Draft mode = 0
            return MultiValue.contains(form.owner, User.getName()); 
        } else {
            return false;
        }
    } else {
        if(state === undefined) {
            state = Forms.getState(form);
        }
        // is current user part of the current workflow state and there is a possible action, ie not the last step
        // with this changes, Managers cannot edit the last workflwo stage
        if (state && state.onclick) {
            return true;
        } else {
            return false;
        }
    }
}

Forms.canDelete = function (form) {
    var values = Forms._getValues(form);
    if (values["NODELETE"] == 1) return false;
    else return true;
}

Forms.canDuplicate = function (form, state) {
    var values = Forms._getValues(form);
    if (values["NODUPLI"] == 1) return false;

    var role = User.getRole();
    if (role && role.project == "readonly") {
        return false;
    }
    
    // Nov 6th, sub forms cannot duplicated  only if parent form can be edited
    if (form.linkedtable == "Forms.forms") {
        let parentFormId = form.linkedid.split(":")[0];
        let parentForm = Query.selectId("Forms.forms", parentFormId);
        if (!parentForm) return false;
        return Forms.canEdit(parentForm);
    }
    // 2 Sept. 2022
    // because if a user can view the form, he can edit (we already filter by role the form template has has the right for)
    return true;
}

Forms.hasRight = function (action, form) {
    if (User.isAdmin()) return true;
    if (action == "editlink") return form.linkedid == "";
    return false;
}

Forms.canAddSubForm = function (form, subtemplate) {
    if (subtemplate && subtemplate.disablenew == 1) return false;
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

Forms.canResetToDraft = function(form) {
    if (User.isAdmin()) return true;
    if (User.isManager()) {
        return AccountSettings.get("forms.resetdraft") == "1";
    } else {
        return false;
    }
}

Forms.punchCount = function(id) {
    return Query.count("Forms.punchitems", "formid={id}");
}

Forms.punchCountSubforms = function (id) {
    let count = 0;
    let form = Query.selectId("Forms.forms", id);
    let subforms = Forms.selectSubForms(form, "id");
    for (let subform of subforms) {
        count += Query.count("Forms.punchitems", "formid={subform.id}");
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
    let items = Query.select("Forms.punchitems", "*", "formid={id}", "creationdate");
    let form = Query.selectId("Forms.forms", id);
    let subforms = Forms.selectSubForms(form, "id");
    for (let subform of subforms) {
        let subitems = Query.select("Forms.punchitems", "*", "formid={subform.id}", "creationdate");
        items = items.concat(subitems);
    }

    return Punch.groupByStatus(items);
}

/////////////////////

Forms.getCreator = function (form) {
    return form.owner ? form.owner.split("|")[0] : "";
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
        var items = JSON.parse(form.history);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item.signature && item.staff) {
                // try to get it from signatures table
                item.signature = Forms.getUserSignature(item.staff);
            }
        }
        return items;
    } catch (e) {
        return [];
    }
}

Forms.addHistory = function (form, name, note) {
    var history = null;
    try {
        history = JSON.parse(form.history);
    } catch (e) {
    }
    if (history == null) history = [];

    var item = { name: name, staff: User.getName(), date: Date.now(), id: User.getId()};
    if (note) item.note = note;
    history.push(item);
    Query.updateId("Forms.forms", form.id, "history", JSON.stringify(history));
}

////////////////

Forms.getSubFormFields = function(template) {
    var list = [];
    var where = "formid={template.id}";
    var options = FormsPdf.getOptions(template);
    if (options.subformhidden != "1") where += " AND hidden=0";
    //var displayColumns = template.columns ? template.columns.split("|") : [];
    var fields = Query.select("Forms.fields", "name;label;type", where, "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type != "image" && field.type != "photo" && field.type != "button" && field.type != "label" && field.type != "header") {
            //if (displayColumns.length == 0 || displayColumns.includes(field.name)) {
                list.push(field);
            //}
        }
    }
    return list;
}

// WEB ONLY
Forms.writeSubformsTable = function (forms, template, editable) {
    if (forms.length == 0) return;

    // remember the current form state (coming from +valueObj ....)
    var state = Forms.GET_STATE();
  
    // Write table Header
    var displayFields = Forms.getSubFormFields(template);
    // When there are too many columns, the table does not display in the Web browser
    var columnCount = Math.min(displayFields.length, 10);
    var header = [];
    for (var i = 0; i < columnCount; i++) {
        header.push(displayFields[i].label);
    }
    List.addHeader(header);
          
    for (var i = 0; i < forms.length; i++) {
        var form = forms[i];
        // we need this because Forms.getFields uses scripting with options and  Risk.view access it
        _valueObj = Forms._getValues(form); 
        _formid = form.id;
        var includeHidden = true;
        var fields = Forms.getFields(forms[i], null, includeHidden);
        // get fieldMap
        var fieldMap = [];
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            fieldMap[field.id] = field;
        }
        
        var values = [];
        // When there are too many columns, the table does not display in the Web browser
        for (var j = 0; j < columnCount; j++) {
            var name = displayFields[j].name;
            var field = fieldMap[name];
            if (field == null) {
                values.push("");
            } else {
                var value = CustomFields.formatValue(field.value, field.type, field.options, true); // isWeb=true
                if (field.type == "longtext") value = Format.text(value);
                values.push(value);
            }
        }
      
        var func = editable ? Forms._EDITFORM : Forms._VIEWFORM;
        var style = form.color ? "priority:" + form.color : "";
        List.add(values, func + "({forms[i].id})", style);
    }

    // restore the current form state (we changed it with valueObj = xxx)
    Forms.RESTORE_STATE(state);
}