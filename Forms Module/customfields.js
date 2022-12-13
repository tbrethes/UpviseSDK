
/// CustomField class is defined in common.js because there is a namespace issue with web version.....
function CustomFields() {}

CustomFields._VIEWFILE = "Files.viewFile";

CustomFields.values = null; // Array of values indexed by name
CustomFields.buttons = {};

CustomFields.view = function (table, recordId, fieldsTable) {
    var item = Query.selectId(table, recordId);
    if (fieldsTable == null) fieldsTable = table;
    var where = "formid={fieldsTable}";
    var fields = Query.select("Notes.fields", "name;label;type;seloptions;groupid;roleid", where, "rank");
    fields = CustomFields.filterRole(fields);
    fields = CustomFields.filterGroup(fields, item.groupid);
    if (fields.length == 0 || item == null) return;

    CustomFields.values = CustomFields.loadValues(item.custom);
    // Strange bug : reported by K$ May 15th 2019:  CustomFields.values is a string, reparse it a second time
    var str = CustomFields.values;
    if (typeof str === 'string' || str instanceof String) {
        Query.updateId(table, recordId, "custom", str);
        CustomFields.values = CustomFields.loadValues(str);
    }

    CustomFields.buttons = {}; // to keep the onclick for button fields
    CustomFields.curHeader = null;
    CustomFields.headers = new HashMap();
    if (WEB() == false) List.addHeader(R.CUSTOMFIELDS);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.values[field.name];
        var options = CustomFields.evalOptions(recordId, field.name, field.seloptions);
        CustomFields.addViewItem(field.name, field.type, field.label, value, options, recordId);
    }
}

CustomFields.filterRole = function(fields, groupid) {
    var filtered = [];
    var userRole = User.getRole();
    if (userRole == null) return fields;
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.roleid == "" || MultiValue.contains(field.roleid, userRole.id)) {
            filtered.push(field);
        }
    }
    return filtered;
}

CustomFields.filterGroup = function(fields, groupid) {
    var filtered = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (!field.groupid || MultiValue.contains(field.groupid, groupid)) {
            filtered.push(field);
        }
    }
    return filtered;
}

CustomFields.addViewItem = function (id, type, label, value, options, formid, fieldguid) {
    if (type == "buttonbox") { // buttonbox are displayed separately
        return;
    } else if (type == 'header') {
        // Delayed write : overwrite any previous delayed header if any
        CustomFields.curHeader = label;
        return;
    }
    // do not write empty fields (exception button which can have value==null )
    if (type!= "button" && (value == null || value === "")) {
        return;
    }

    // Write the delayed header if any
    if (CustomFields.curHeader != null) {
        List.addHeader(CustomFields.curHeader);
        CustomFields.curHeader = null;
    }

    if (type == "button") {
        CustomFields.addButton(id, label, value, options, formid, fieldguid); // value instead of "code"
    } else if (type == 'select' || type == 'selectmulti') {
        List.addItemLabel(label, Format.options(value, options));
    } else if (type == 'toggle') {
        List.addToggleBox('', label, value, null, options);
    } else if (type == 'checkbox') {
        if (Settings.getPlatform() == "web") List.addItemLabel(label, (value == "1") ? R.YES : R.NO);
        else if (parseInt(value) == 1) List.addItem(label, '', 'icon:checked');
    } else if (type == 'contact') {
        CustomFields.writeMultivalueItem(label, value, "Contacts.contacts", "Contacts.viewContact", "contact");
    } else if (type == 'company') {
        CustomFields.writeMultivalueItem(label, value, "Contacts.companies", "Contacts.viewCompany", "company");
    } else if (type == 'project') {
        CustomFields.writeMultivalueItem(label, value, "Projects.projects", "Projects.viewProject", "project");
    } else if (type == 'opp') {
        CustomFields.writeMultivalueItem(label, value, "Sales.opportunities", "Sales.viewOpp");
    } else if (type == 'product') {
        CustomFields.writeMultivalueItem(label, value, "Sales.products", "Sales.viewProduct");
    } else if (type == 'asset') {
        CustomFields.writeMultivalueItem(label, value, "Assets.assets", "Assets.viewAsset");
    } else if (type == 'tool') {
        CustomFields.writeMultivalueItem(label, value, "Tools.tools", "Tools.viewTool", "job");
    } else if (type == 'form') {
        CustomFields.writeMultivalueItem(label, value, "Forms.forms", "Forms.viewForm");
    } else if (type == 'user') {
        var owners = value.split("|");
        var contactids = [];
        for (var i = 0; i < owners.length; i++) {
            var contact = User.getContact(owners[i]);
            if (contact != null) contactids.push(contact.id);
        }
        CustomFields.writeMultivalueItem(label, contactids.join("|"), "Contacts.contacts", "Contacts.viewContact", "contact"); // no table="" id and value are the same
    } else if (type == "photo") {
        CustomFields.addFileBox(label, "Forms.forms", value);
    } else if (type == "drawing") {
        CustomFields.addImage(id, label, value, options, formid);
    } else if (type == "image") {
        CustomFields.addImage(id, label, value, options, formid);
    } else if (type == 'signature') {
        var onclick = User.isAdmin() ? "Forms.popupResetSignature({formid},{id})" : "";
        if (WEB()) List.addItemLabel(label, Format.image64(value), onclick);
        else List.addSignatureBox('', label, value, '');
    } else if (type == 'barcode') {
        List.addItemLabel(label, value);
    } else if (type == 'readonly') {
        if (!WEB()) value = Format.text(value);
        List.addItemLabel(label, value);
    } else if (type == 'label') {
        List.addItemLabel(label, " ", null, "color:gray");
    } else if (type == 'phonenumber' || type == 'phone') {
        List.addItemLabel(label, Format.phone(value), "App.call({value})");
    } else if (type == 'email') {
        List.addItemLabel(label, value, "App.mailto({value})");
    } else if (type == 'link') {
        // if not protocol, then assume http
        if (value.indexOf(":") == -1) value = "http://" + value;
        if (WEB()) List.addItemLabel("", label, "App.web({value})");
        else List.addItemLabel(label, "Open Link", "App.web({value})");
    } else if (type == 'date') {
        // do not display Someday date for forms
        if (value != 0) List.addItemLabel(label, Format.date(value), null, "img:calendar");
    } else if (type == 'datetzi') {
        if (value != 0) List.addItemLabel(label, Format.date(value, "utc"), null, "img:calendar");
    } else if (type == 'time') {
        if (value == 0) return; // Otherwise on Android value = 0 is displayed as a default time, i.e 7:30
        List.addItemLabel(label, Format.time(value), null, "img:clock");
    } else if (type == 'datetime') {
        if (value == 0) return;  // do not display One day...
        List.addItemLabel(label, Format.datetime(value), null, "img:calendar");
    } else if (type == 'duration') {
        List.addItemLabel(label, Format.duration(parseInt(value)));
    } else if (type == 'textarea') {
        if (Settings.getPlatform() != "web") value = Format.text(value);
        List.addItemLabel(label, value);
    } else if (type == 'numeric' || type == 'decimal') {
        List.addItemLabel(label, "" + value); // we do this : because toLocaleString() rounds to 3 decimals only.....
    } else if (type == 'formula') {
        List.addItemLabel(label, value);
    } else if (type == 'risk') {
        Risk.view(id, label, value);
    } else if (type == 'location') {
        List.addItemLabel(label, value, "App.map({value})");
    } else if (type == "file") {
        List.addItemLabel(label, Query.names("System.files", value), CustomFields._VIEWFILE + "({value})");
    } else if (type == "score") {
        CustomFields.addScoreBox(label, value);
    } else {
        List.addItemLabel(label, value);
    }
}

CustomFields.addButton = function (id, label, value, options, formid, fieldguid) {
    if (label.indexOf("__") == 0) return;

    // Button color
    var color = "gray";
    if (label.indexOf("#") > -1) {
        var parts = label.split("#");
        label = parts[0];
        color = parts[1];
        var upviseColor = Color[color.toUpperCase()];
        if (upviseColor) color = upviseColor;
    }
    var icon = "new";

    var form = formid ? Query.selectId("Forms.forms", formid) : null;
    var onclick = null;
    if (value == "newtask") onclick = WEB() ? "TaskUtils.newTask()" : "Tasks.newTask()";
    else if (value == "newnote") onclick = "Notes.newNote()";
    else if (value == "newevent") onclick = "Calendar.newEvent()";
    else if (value == "newform") {
        var templateid = options;
        var linkedtable = form ? form.linkedtable : "";
        var linkedid = form ? form.linkedid : "";
        onclick = "Forms.newForm({templateid},{linkedtable},{linkedid})";
    } else if (value == "newsubform") {
        if (form == null) return;
        var templateid = options;
        var linkedid = formid + ":" + id;
        if (label.endsWith(">>")) {
            onclick = "Forms.viewSubForms({formid},{fieldguid})";
            label = label.substr(0, label.length - 2);
            icon = "form";
        } else {
            onclick = "Forms.newForm({templateid},'Forms.forms',{linkedid},null,null,{form.projectid})";
        }
    } else { // defaut should be "code"
        if (!CustomFields.buttons) CustomFields.buttons = {};
        CustomFields.buttons[id] = options; // this contains the onclick for button
        onclick = "CustomFields.onButton({formid},{id})";
        icon = ""; // no icon for custom code
    }
    var style = "color:" + color + ";img:" + icon;
    List.addButton(label, onclick, style);
}

/////////////////////

CustomFields.addButtonBoxes = function (table, recordId) {
    var where = "formid={table} AND type='buttonbox'";
    var fields = Query.select("Notes.fields", "id;label;style", where, "rank");
    fields = CustomFields.filterRole(fields);
    var item = Query.selectId(table, recordId);
    if (fields.length == 0 || item == null) return;

    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var style = field.style ? field.style : "img:app";
        var label = field.label;
        if (field.label.startsWith("=")) {
            var js = field.label.substr(1); + "\n//# sourceURL=BUTTONBOX.ONLOAD.JS";
            try {
                label = eval(js);
            } catch(e) {
                label = "#Javascript Error";
            }
        }
        if (label) Grid.add(label, "CustomFields.onButtonBox({field.id},{recordId})", style);
    }
}

CustomFields.onButtonBox = function (fieldid, recordId) {
    var field = Query.selectId("Notes.fields", fieldid);
    if (field == null) {
        return;
    }

    var onclick = field.seloptions;
    if (onclick) {
        try {
            // the onclick script needs the form object.
            var form = Query.selectId("Forms.forms", recordId); // this is for button inside forms
            if (form == null) form = { id: recordId }; // this is for button inside other records

            var js = "";
            if (WEB()) js += "//# sourceURL=BUTTONBOX." + field.name.toUpperCase() + "\n";
            js += onclick; // we cannot interpolate because this is common mobile + desktop code.....
            eval(js);
        } catch (e) {
            WEB() ? alert(e.message) : App.alert(e.message);
        }
    }
}

/////////////////////


CustomFields.onButton = function (recordId, fieldid) {
    if (!CustomFields.buttons) CustomFields.buttons = {};
    var onclick = CustomFields.buttons[fieldid];
    if (onclick) {
        try {
            // the onclick script needs the form object.
            var form = Query.selectId("Forms.forms", recordId); // this is for button inside forms
            var link = (form && form.linkedtable) ? Query.selectId(form.linkedtable, form.linkedid) : null;
            if (form == null) form = { id: recordId }; // this is for button inside other records

            var js = "";
            if (WEB()) js += "//# sourceURL=FORM.BUTTON." + fieldid.toUpperCase() + "\n";
            js += onclick; // we cannot interpolate because this is common mobile + desktop code.....
            eval(js);
        } catch (e) {
            WEB() ? alert(e.message) : App.alert(e.message);
        }
    }
}

CustomFields.writeMultivalueItem = function (label, id, table, func, img) {
    id = String(id); // make sure its a string
    var items = Query.select(table, "id;name", "id IN " + list(id), "name");
    if (items.length == 0) {
        if (WEB() && id){
          List.addItemLabel(label, "#ERROR : no record for ID: " + id);
        }
        return;
    } 

    var style = "icon:arrow"  + (img !=null ? ";img:" + img : "");
    if (items.length == 1) {
        var item = items[0];
        var onclick = func + "(" + esc(item.id) + ")";
        List.addItemLabel(label, item.name, onclick, style );
    } else {
        var values = new Array();
        for (var i = 0; i < items.length; i++) {
            values.push(items[i].name);
        }
        var onclick = "CustomFields.viewItemList(" + esc(id) + "," + esc(table) + "," + esc(func) + ")";
        List.addItemLabel(label, values.join(", "), onclick, style);
    }
}

CustomFields.viewItemList = function (id, table, func) {
    var items = Query.select(table, "id;name", "id IN " + list(id), "name");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        Popup.add(item.name, func + "(" + esc(item.id) + ")");
    }
    Popup.show();
}

CustomFields.edit = function (table, recordId, ids, fieldsTable) {
    var item = Query.selectId(table, recordId);

    if (fieldsTable == null) fieldsTable = table;
    var where = "formid={fieldsTable}";
    if (ids != null && ids != "") where += " AND id IN " + list(ids);
    var fields = Query.select("Notes.fields", "name;label;type;seloptions;onchange;id;groupid;roleid", where, "rank");
    if (fields.length == 0) return;
    fields = CustomFields.filterRole(fields);
    // for edit we also filter group (optional)
    fields = CustomFields.filterGroup(fields, item.groupid);

    CustomFields.values = CustomFields.loadValues(item.custom);   
    CustomFields.companyOptions = null;
    CustomFields.contactOptions = null;

    List.addHeader(R.CUSTOMFIELDS);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.values[field.name];
        if (value == null) value = '';
        var options = CustomFields.evalOptions(recordId, field.name, field.seloptions);
        var onchange = "CustomFields._update({table},{recordId},this.id,this.value)";
        if (field.onchange) onchange += ";CustomFields._onchange({field.id},{recordId})";
        CustomFields.writeEditItem(field.name, field.type, field.label, value, onchange, options, null);
    }
}

CustomFields.writeEditItem = function (id, type, label, value, onchange, options, formid) {
    if (type == 'header') {
        List.addHeader(label);
    } else if (type == 'select') {
        List.addComboBox(id, label, value, onchange, options);
    } else if (type == 'selectmulti') {
        List.addComboBoxMulti(id, label, value, onchange, options);
    } else if (type == 'toggle') {
        onchange += ";CustomFields.onPunch({formid},{label},this.value,{id})";
        List.addToggleBox(id, label, value, onchange, options);
    } else if (type == 'checkbox') {
        List.addCheckBox(id, label, parseInt(value), onchange);
    } else if (type == 'contact') {
        var groupid = options;  // options field may contain the groupid to filter
        var where = groupid ? "groupid CONTAINS {options}" : "";
        var contactOptions = Query.options("Contacts.contacts", where);
        List.addComboBoxMulti(id, label, value, onchange, contactOptions, "CustomFields.onNewContact({formid},{id},this.value,{groupid})");
    } else if (type == 'company') {
        var groupid = options;  // options field may contain the groupid to filter
        var where = groupid ? "groupid CONTAINS {options}" : "";
        var companyOptions = Query.options("Contacts.companies", where);
        List.addComboBoxMulti(id, label, value, onchange, companyOptions, "CustomFields.onNewCompany({formid},{id},this.value,{groupid})");
    } else if (type == 'project') {
        List.addComboBoxMulti(id, label, value, onchange, Query.options("Projects.projects", "status=0"));
    } else if (type == 'opp') {
        List.addComboBoxMulti(id, label, value, onchange, Query.options("Sales.opportunities", "status!=2")); // 2 : lost
    } else if (type == 'product') {
        List.addComboBoxMulti(id, label, value, onchange, Query.options("Sales.products", "status=0"));
    } else if (type == 'asset') {
        List.addComboBoxMulti(id, label, value, onchange, Query.options("Assets.assets"));
    } else if (type == 'tool') {
        List.addComboBoxMulti(id, label, value, onchange, CustomFields.getToolOptions(formid));
    } else if (type == 'form') {
        List.addComboBox(id, label, value, onchange, Query.options("Forms.forms", "templateid!=''"));
    } else if (type == 'user') {
        List.addComboBoxMulti(id, label, value, onchange, User.getOptions());
    } else if (type == "photo") {
        CustomFields.addFileBox(label, "Forms.forms", value, options, onchange); // options is for add new
    } else if (type == "drawing") {
        List.addHeader(label);
        if (value != "") List.addImage(Settings.getFileUrl(value), "App.editPicture({value})");
    } else if (type == "image") {
        CustomFields.addImage(id, label, value, options, formid);
    } else if (type == 'signature') { 
        List.addSignatureBox(id, label, value, onchange);
    } else if (type == 'barcode') {
        List.addBarcodeBox(id, label, value, onchange, options); // options if for custom action
    } else if (type == 'button' || type == "buttonbox") {
        // do not display button in edit mode
    } else if (type == 'label') {
        List.addItemLabel (label, " ", null, "color:gray");
    } else if (type == 'formula') {
        // do not display formula in edit mode unless seloptions=1
        if (options == "1") { // we use the seloptions template field to store if formula is visible in edit mode
            List.addItemLabel(label, value);
        }
    } else if (type == 'textarea') {
        if (Settings.getPlatform() == "web") type = "textarea2";
        List.addTextBox(id, label, value, onchange, type);
    } else if (type == 'risk') {
        Risk.edit(id, label, value, options, formid);
    } else if (type == 'file') {
        List.addComboBox(id, label, value, onchange, Query.options("System.files", "folderid={options}"));
    } else if (type == "button") {
        // no button in edit mode
    } else if (type == 'score') {
        CustomFields.addScoreBox(label, value);
    } else if (type == 'readonly') {
        if (!WEB()) value = Format.text(value);
        List.addItemLabel(label, value);
    } else {
        // works for text, phone, email, time, duration, currency
        List.addTextBox(id, label, value, onchange, type);
    }
}

CustomFields.addImage = function (id, label, fileid, options, formid) {
    if (!CustomFields.buttons) CustomFields.buttons = {};
    CustomFields.buttons[id] = options; // we use options for optional onclick
    var url = Settings.getFileUrl(fileid);
    List.addHeader(label);
    List.addImage(url, "CustomFields.viewImage({fileid},{id},{formid})");
}

CustomFields.viewImage = function (fileid, id, formid) {
    var url = Settings.getFileUrl(fileid);
    // this.value in the callback will contain the (x,y) tap event
    var callback = "CustomFields.onImageTap({id},{formid},this.value)";
    WebView.showImage(url, callback);
}

CustomFields.onImageTap = function (id, formid, geo) {
    if (!CustomFields.buttons) CustomFields.buttons = {};
    var jsCode = CustomFields.buttons[id];
    if (!jsCode) return;
    try {
        // jsCode can use x, y and form
        var form = Query.selectId("Forms.forms", formid);
        var x = Math.round(geo.split(",")[0]);
        var y = Math.round(geo.split(",")[1]);
        eval(jsCode)
    } catch (e) {
        App.confirm("Error: " + e.message + "\n" + buffer);
    }
}



CustomFields.onPunch = function (formid, label, value, id) {
    if (value == "P") {
        Punch.newFormItem(formid, label);
    }
}

CustomFields.getToolOptions = function (formid) {
    var projectid = null;
    if (formid != null) {
        var form = Query.selectId("Forms.forms", formid);
        if (form != null && form.linkedtable == "Projects.projects" && form.linkedid != "") {
            projectid = form.linkedid;
        }
    }

    var where = (projectid != null) ? "projectid={projectid}" : null;
    return Query.options("Tools.tools", where);

}

CustomFields.onNewContact = function (formid, fieldname, name, groupid) {
    if (!groupid) groupid = "";
    var newid = Query.insert("Contacts.contacts", { name: name, groupid:groupid, creationdate: Date.now() });
    var value = _valueObj ? _valueObj[fieldname] : null ;
    value = value ? value + "|" + newid : newid;
    if (formid) _updateValue(formid, fieldname, value);
    CustomFields.contactOptions = null;
    History.reload();
}

CustomFields.onNewCompany = function (formid, fieldname, name, groupid) {
    if (!groupid) groupid = "";
    var newid = Query.insert("Contacts.companies", { name: name, groupid: groupid, creationdate: Date.now() });
    var value = _valueObj ? _valueObj[fieldname] : null;
    value = value ? value + "|" + newid : newid;
    if (formid) _updateValue(formid, fieldname, value);
    CustomFields.companyOptions = null;
    History.reload();
}

CustomFields.loadValues = function (custom) {
    if (custom == null || custom == "") return {};

    // avoid try catch for malformed custom
    if (custom.indexOf("{") == -1) return {};
    try {
        var values = JSON.parse(custom);
        return values;
    } catch (e) {
        return new Object();
    }
}

CustomFields._update = function (table, recordId, name, value) {
    if (typeof(Change) != "undefined") {
        Change.addLog(table, recordId, name, CustomFields.values[name]);
    }
    CustomFields.values[name] = value;
    var custom = JSON.stringify(CustomFields.values);
    Query.updateId(table, recordId, "custom", custom);
}

CustomFields._onchange = function(fieldId, recordId) {
    var field = Query.selectId("Notes.fields", fieldId);
    if (!field) return;
    var js = field.onchange;
    if (!js) return;

    // we need the obj id and value variable to be accessible in the JS code
    var id = recordId;
    var value = CustomFields.values[field.name];
    if (WEB()) js += "//# sourceURL=CUSTOMFIELD_ONCHANGE." + field.name.toUpperCase() + "\n";
    try {
        eval(js);
    } catch (e) {
        WEB() ? alert(e.message) : App.alert(e.message);
    }
}

CustomFields._getValue = function (name) {
    var value = CustomFields.values[name];
    return (value != null) ? value : "";
}

// returns an array of custom field object, with id, name, label and formatted value
CustomFields.get = function (table, custom, recordId) {
    var list = new Array();

    var objValues = CustomFields.loadValues(custom);
    var fields = Query.select("Notes.fields", "id;name;label;type;seloptions", "formid={table}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var item = new Object();
        item.id = field.id;
        item.name = field.name;
        item.label = field.label;
        var options = CustomFields.evalOptions(recordId, field.name, field.seloptions);
        item.value = CustomFields.formatValue(objValues[field.name], field.type, options);
        list.push(item);
    }
    return list;
}

// isWeb = true for HTML output (web and pdf)
CustomFields.formatValue = function (value, type, options, isWeb) {
    if (value == null || value === "") return "";
    if (value == 0 && type == 'time') return ""; // Otherwise on Android value = 0 is displayed as Unix time 1 Jan 1970, i.e 7:30 for GMT +8

    if (type == 'date') return Format.date(parseFloat(value));
    else if (type == 'datetzi') return Format.date(parseFloat(value), "utc");
    else if (type == 'time') return Format.time(parseFloat(value));
    else if (type == 'datetime') return Format.datetime(parseFloat(value));
    else if (type == 'duration') return Format.duration(parseInt(value));
    else if (type == 'contact') return buf = Query.names("Contacts.contacts", value);
    else if (type == 'company') return Query.names("Contacts.companies", value);
    else if (type == 'project') return Query.names("Projects.projects", value);
    else if (type == 'product') return Query.names("Sales.products", value);
    else if (type == 'opp') return Query.names("Sales.opportunities", value);
    else if (type == 'asset') return Query.names("Assets.assets", value);
    else if (type == 'tool') return Query.names("Tools.tools", value);
    else if (type == 'file') return Query.names("System.files", value);
    else if (type == 'button' || type == "header") return "";
    else if (type == "select" || type == "selectmulti") return Format.options(value, options);
    else if (type == "toggle") return CustomFields.formatToggle(value, options, isWeb);
    else if (type == 'checkbox') return value == 1 ? R.YES : R.NO;
    else if (type == "numeric" || type == "decimal") return value; 
    else if (type == "signature") return CustomFields.formatSignature(value);
    else if (type == "photo") return CustomFields.formatImages(value);
    else if (type == "drawing" || type == "image") return CustomFields.formatDrawing(value);
    else if (type == "formula") return typeof(value) === "string" ? value : Number(value).toLocaleString(); // try to convert to number only if already a number. Nov 16 2022.
    else if (type == "score") return CustomFields.formatScore(value, isWeb);
    else return String(value);
}

CustomFields.formatScore = function (value, isWeb) {
    if (!value) value = "";
    var parts = value.split(":");
    var label = parts[0];
    var color = (parts.length == 2) ? parts[1] : Color.BLUE;

    if (isWeb === true) {
        return '<span style="font-weight:bold;color:' + color + '">' + label + '</span>';
    } else {
        return label;
    }
}

// Aligned with ToggleBox.getSelectedStyle in framework/web/edit/ToogleBox
CustomFields.formatToggle = function (value, options, isWeb) {
    var label = Format.options(value, options);
    if (isWeb === true) {
        var color = Color.BLUE;
        if (value == "0" || value == "5") color = Color.RED;
        else if (value == "1") color = Color.GREEN;
        else if (value == "11") color = Color.BLUE;
        else if (value == "2" || value == "3") color = Color.YELLOW;
        else if (value == "4" || value == "P") color = Color.ORANGE;
        else if (value == "6") color = Color.BLUEGRAY;
        return '<span style="font-weight:bold;color:' + color + '">' + label + '</span>';
    }
    return label;
}

CustomFields.getHtml = function (table, custom, recordId) {
    var html = [];
    var items = CustomFields.get(table, custom, recordId);
    var EXCLUDE = ["signature", "photo", "drawing", "image", "risk"];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (EXCLUDE.indexOf(item.type) == -1 && item.value != null && item.value != "") {
            var value = String(item.value).split("|").join(", ");
            html.push("<b>" + item.label + "</b>: " + value);
        }
    }
    return html.join("<br/>");
}

CustomFields.formatSignature = function (value) {
    return (value == null || value == "") ? "" : '<img height="100" src="data:image/png;base64,' + value + '" />'
}

CustomFields.formatImages = function (value) {
    var buf = [];
    var files = Query.select("System.files", "id", "linkedtable='Forms.forms' AND linkedrecid={value}", "date");
    for (var i = 0; i < files.length; i++) {
        buf.push('<img height=300 class="photo" src="##BASE##', files[i].id, '"/>');
    }
    return buf.join("");
}

CustomFields.formatDrawing = function (value) {
    var buf = [];
    var file = Query.selectId("System.files", value);
    if (file) buf.push('<img height="300" class="photo" src="##BASE##', file.id, '"/>');
    return buf.join("");
}

CustomFields.writePdf = function (table, recordId) {
    var item = Query.selectId(table, recordId);
    if (item == null) return;
    var customFields = CustomFields.get(table, item.custom, item.id);
    if (customFields.length > 0) {
        Pdf2.startTable([R.DETAILS, ""]);
        for (var i = 0; i < customFields.length; i++) {
            var field = customFields[i];
            if (field.value != "") Pdf2.addRow([field.label, field.value]);
        }
        Pdf2.stopTable();
    }
}

//////////////////////

CustomFields.addFileBox = function (label, table, id, action, onchange) {
    var files = [];
    if (table && id) files = Query.select("System.files", "id;name;mime;externalurl", "linkedtable={table} AND linkedrecid={id}", "date");
    if (action == null && files.length == 0) return;

    var edit = (action != null);

    if (CustomFields._VIEWFILE == "Files.viewFile" && User.hasApp("files") == false) {
        CustomFields._VIEWFILE = "CustomFields.viewFile";
    }
      
    if (WEB()) {
        if (edit) {
            Form.ensure(label, true) 
        } else {
            List.addItemLabel(label, " ");
            List.ensureClose();
        } 
        NextPrevious.addSection();
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var fileid = (file.mime.indexOf("image/") != -1 && file.externalurl == "") ? file.id : null;
            List.addThumbnail(file.name, fileid, CustomFields._VIEWFILE + "({file.id})", file.mime);
        }
        if (edit) {
            if (files.length > 0) { List.addLine();List.addLine();}
            Grid.add(R.SELECTFILE, "FilePicker.pick({table},{id},'',{action},{onchange})", "img:upload;ondrop:true");
            Form.ensureClose();
        }
    } else {
        if (label) List.addHeader(label);
        if (edit) {
            var label = (action == "scan") ? R.SCANDOCUMENT : R.ADDPHOTO;
            List.addItem(label, "App.takePicture({table},{id},{action},{onchange})", "img:camera;icon:new");
        }
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var style = null;
            if (file.mime == 'image/jpeg' || file.mime == 'image/png' || file.mime == 'image/gif') {
                style = "scale:crop;img:" + Settings.getFileUrl(file.id);
            }
            List.addItem(file.name, CustomFields._VIEWFILE + "({file.id})", style);
        }
    }
}

CustomFields.addScoreBox = function (label, value) {
    var onchange = "";
    var options = "";
    List.addToggleBox('', label, value, onchange, options);
}

CustomFields.evalOptions = function (recordId, fieldId, options) {
    if (!options) return options;

    var js = String(options).trim();
    if (js.substring(0, 1) == "=") js = js.substring(1);
    else if (js.indexOf("javascript:") == 0) js = js.substr("javascript:".length);
    else return options;

    var sourceURL = "OPTIONS_" + fieldId.toUpperCase();
   
    var buffer = [];
    buffer.push('var id=' + esc(recordId) + ";");
    buffer.push(js);
    if (WEB()) buffer.push("//# sourceURL=http://CUSTOMFIELD/" + sourceURL + ".js");
    buffer = buffer.join('\n');
    try {
        var result = eval(buffer);
        return result;
    } catch (e) {
        if (WEB()) {
            var msg = "%cCustom Field Option Eval Error:\n" + e.message + "\nFieldId: " + fieldId + "\nRecordId: " + recordId;
            if (console != null) console.log(msg, "color:red");
        } else {
            App.confirm("Error: " + e.message + "\n" + buffer);
        }
        return "Error: " + e.message;
    }
}

// name if FXX format, type is custom field type
CustomFields.groupBy = function(table, where, names, type) {
    let map = new HashMap();
    names = names.split("|");
    
    const items = Query.select(table, "*", where, "name");
    for (const item of items) {
        let custom = {};
        try {
            custom = item.custom ? JSON.parse(item.custom) : {};
        } catch(e) {}
        for (let name of names) {
            let value = custom[name];
            if (value) {
                let obj = map.get(value);
                if (obj == null) {
                    // we use a set to make sure the itmes are not added multiple times
                    obj = {name: CustomFields.formatValue(value, type), items: new Set()};
                    map.set(value, obj);
                }
                obj.items.add(item);
            }
        }
    }
    // sort by most vessels
    map.keys.sort(function (k1, k2) { return map.get(k2).items.size - map.get(k1).items.size });
    return map;
}

////////

CustomFields.viewFile = function(id) {
    var file = Query.selectId("System.files", id);
    if (file == null) { History.back(); return; }

    if (file.externalurl != '' && file.kind != 0) {
        // not supported
        return;
    }

    if (file.mime == "image/jpeg" || file.mime == "image/png") {
        Toolbar.setStyle("nextprevious");
        if (User.canEdit(file.owner)) {
            if (App.editPicture) Toolbar.addButton(R.EDIT, "App.editPicture({id})", "edit");
            Toolbar.addButton(R.DELETE, "CustomFields.deleteFile({id})", "delete");
        }
        if (WEB()) {
            WebView.showImage(file.id, file.name);
        } else {
            Toolbar.setTitle("Photo");
            var url = Settings.getFileUrl(file.id);
            WebView.showImage(url);
        }
    }
}

CustomFields.deleteFile = function(id) {
    Query.deleteId("System.files", id);
    History.back();
}