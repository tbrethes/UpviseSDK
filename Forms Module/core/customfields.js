
/// CustomField class is defined in common.js because there is a namespace issue with web version.....
function CustomFields() {}

CustomFields._VIEWFILE = "Files.viewFile";

CustomFields.values = null; // Array of values indexed by name

CustomFields.view = function (table, recordId, fieldsTable) {
    if (fieldsTable == null) fieldsTable = table;
    var where = "formid={fieldsTable}";
    var fields = Query.select("Notes.fields", "name;label;type;seloptions", where, "rank");
    var item = Query.selectId(table, recordId);
    if (fields.length == 0 || item == null) return;

    CustomFields.values = CustomFields.loadValues(item.custom);
    CustomFields.buttons = {}; // to keep the onclick for button fields

    if (WEB() == false) List.addHeader(R.CUSTOMFIELDS);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.values[field.name];
        CustomFields.addViewItem(field.name, field.type, field.label, value, field.seloptions, recordId);
    }
}

CustomFields.addViewItem = function (id, type, label, value, options, formid) {
    if (type == 'header') {
        List.addHeader(label);
        return;
    } else if (type == "button") {
        CustomFields.addButton(id, label, "code", options, formid);
        return;
    } 
    if (value == null || value === "") return;

    if (type == 'select' || type == 'selectmulti') {
        List.addItemLabel(label, (Format.options != null) ? Format.options(value, options) : value);
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
        List.addHeader(label);
        List.addImage(Settings.getFileUrl(value));
    } else if (type == "image") {
        List.addHeader(label);
        List.addImage(Settings.getFileUrl(value));
    } else if (type == 'signature') {
        var onclick = User.isAdmin() ? "Forms.popupResetSignature({formid},{id})" : "";
        if (WEB()) List.addItemLabel(label, Format.image64(value), onclick);
        else List.addSignatureBox('', label, value, '');
    } else if (type == 'barcode') {
        List.addItemLabel(label, value);
    } else if (type == 'label') {
        List.addItemLabel(label, " ", null, "color:gray");
    } else if (type == 'phonenumber' || type == 'phone') {
        List.addItemLabel(label, Format.phone(value), "App.call({value})");
    } else if (type == 'email') {
        List.addItemLabel(label, value, "App.mailto({value})");
    } else if (type == 'link') {
        if (WEB()) List.addItemLabel("", label, "App.web({value})");
        else List.addItemLabel(label, value, "App.web({value})");
    } else if (type == 'date') {
        // do not display Someday date for forms
        if (value != 0) List.addItemLabel(label, Format.date(parseFloat(value)));
    } else if (type == 'time') {
        if (value == 0) return; // Otherwise on Android value = 0 is displayed as a default time, i.e 7:30
        List.addItemLabel(label, Format.time(parseFloat(value)));
    } else if (type == 'datetime') {
        if (value == 0) return;  // do not display One day...
        List.addItemLabel(label, Format.datetime(parseFloat(value)));
    } else if (type == 'duration') {
        List.addItemLabel(label, Format.duration(parseInt(value)));
    } else if (type == 'textarea') {
        if (Settings.getPlatform() != "web") value = Format.text(value);
        List.addItemLabel(label, value);
    } else if (type == 'numeric' || type == 'decimal') {
        //List.addItemLabel(label, Number(value).toLocaleString());
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

CustomFields.addButton = function (id, label, value, options, formid) {
    // if (label.startsWith("__")) return; Sep 2017 we replace startsWith because of Javascript errors on Android 4 devices
    if (label.indexOf("__") == 0) return;
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
        var templateid = options;
        var linkedid = formid + ":" + id;
        List.addButton(label, "Forms.newForm({templateid},'Forms.forms',{linkedid},null,null,{form.projectid})", "color:gray");
        return;
    }
    else if (value == "code") {
        if (CustomFields.buttons == null) CustomFields.buttons = {};
        CustomFields.buttons[id] = options; // this contains the onclick for button
        onclick = "CustomFields.onButton({formid},{id})";
    } else return;
    List.addButton(label, onclick, "color:gray");
}

CustomFields.onButton = function (recordId, fieldid) {
    var onclick = CustomFields.buttons[fieldid];
    if (onclick) {
        try {
            // the onclick script needs the form object.
            var form = Query.selectId("Forms.forms", recordId); // this is for button inside forms
            var link = (form && form.linkedtable) ? Query.selectId(form.linkedtable, form.linkedid) : null;
            if (form == null) form = { id: recordId }; // this is for button inside other records
            eval(onclick + "\n//# sourceURL=http://FORM/BUTTON.js");
        } catch (e) {
            App.alert(e.message);
        }
    }
}

CustomFields.writeMultivalueItem = function (label, id, table, func, img) {
    var items = Query.select(table, "id;name", "id IN " + list(id), "name");
    if (items.length == 0) return;

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
    var fields = Query.select("Notes.fields", "name;label;type;seloptions", where, "rank");
    if (fields.length == 0) return;

    CustomFields.values = CustomFields.loadValues(item.custom);
    
    CustomFields.companyOptions = null;
    CustomFields.contactOptions = null;

    List.addHeader(R.CUSTOMFIELDS);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.values[field.name];
        if (value == null) value = '';
        var onchange = "CustomFields._update({table},{recordId},this.id,this.value)";
        CustomFields.writeEditItem(field.name, field.type, field.label, value, onchange, field.seloptions, null);
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
        //label = Utils.xmlEncode(label);
        onchange += ";CustomFields.onPunch({formid},{label},this.value,{id})";
        List.addToggleBox(id, label, value, onchange, options);
    } else if (type == 'checkbox') {
        List.addCheckBox(id, label, parseInt(value), onchange);
    } else if (type == 'contact') {
        if (CustomFields.contactOptions == null) CustomFields.contactOptions = Query.options("Contacts.contacts");
        List.addComboBoxMulti(id, label, value, onchange, CustomFields.contactOptions, "CustomFields.onNewContact({formid},{id},this.value)");
    } else if (type == 'company') {
        if (CustomFields.companyOptions == null) CustomFields.companyOptions = Query.options("Contacts.companies");
        List.addComboBoxMulti(id, label, value, onchange, CustomFields.companyOptions, "CustomFields.onNewCompany({formid},{id},this.value)");
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
        CustomFields.addFileBox(label, "Forms.forms", value, options); // options is for add new
    } else if (type == "drawing") {
        List.addHeader(label);
        if (value != "") List.addImage(Settings.getFileUrl(value), "App.editPicture({value})");
    } else if (type == "image") {
        List.addHeader(label);
        List.addImage(Settings.getFileUrl(value));
    } else if (type == 'signature') {
        List.addSignatureBox(id, label, value, onchange);
    } else if (type == 'barcode') {
        List.addBarcodeBox(id, label, value, onchange, options); // options if for custom action
    } else if (type == 'button') {
        // do not display button in edit mode
    } else if (type == 'label') {
        List.addItemLabel(label, " ", null, "color:gray");
    } else if (type == 'formula') {
        // do not display formula in edit mode
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
    } else {
        // works for text, phone, email, time, duration, currency
        List.addTextBox(id, label, value, onchange, type);
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

CustomFields.onNewContact = function (formid, fieldname, name) {
    var newid = Query.insert("Contacts.contacts", { name: name, creationdate: Date.now() });
    var value = _valueObj ? _valueObj[fieldname] : null ;
    value = value ? value + "|" + newid : newid;
    if (formid) _updateValue(formid, fieldname, value);
    CustomFields.contactOptions = null;
    History.reload();
}

CustomFields.onNewCompany = function(formid, fieldname, name) {
    var newid = Query.insert("Contacts.companies", {name: name, creationdate: Date.now() });
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
    CustomFields.values[name] = value;
    var custom = JSON.stringify(CustomFields.values);
    Query.updateId(table, recordId, "custom", custom);
}

CustomFields._getValue = function (name) {
    var value = CustomFields.values[name];
    return (value != null) ? value : "";
}

// returns an array of custom field object, with id, name, label and formatted value
CustomFields.get = function (table, custom) {
    var list = new Array();

    var objValues = CustomFields.loadValues(custom);
    var fields = Query.select("Notes.fields", "id;name;label;type;seloptions", "formid={table}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var item = new Object();
        item.id = field.id;
        item.name = field.name;
        item.label = field.label;
        item.value = CustomFields.formatValue(objValues[field.name], field.type, field.seloptions);
        list.push(item);
    }
    return list;
}


// isWeb = true for HTML output (web and pdf)
CustomFields.formatValue = function (value, type, options, isWeb) {
    if (value == null || value === "") return "";
    if (value == 0 && type == 'time') return ""; // Otherwise on Android value = 0 is displayed as Unix time 1 Jan 1970, i.e 7:30 for GMT +8

    if (type == 'date') return Format.date(parseFloat(value));
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
    else if (type == 'button' || type == "header") return "";
    else if (type == "select" || type == "selectmulti") return Format.options(value, options);
    else if (type == "toggle") return CustomFields.formatToggle(value, options, isWeb);
    else if (type == 'checkbox') return value == 1 ? R.YES : R.NO;
    else if (type == "numeric" || type == "decimal") return value; // Number(value).toLocaleString();
    else if (type == "signature") return CustomFields.formatSignature(value);
    else if (type == "photo") return CustomFields.formatImages(value);
    else if (type == "drawing" || type == "image") return CustomFields.formatDrawing(value);

    else if (type == "formula") return Number(value) ? Number(value).toLocaleString() : value; // try to convert to number

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
        else if (value == "2" || value == "3") color = Color.YELLOW;
        else if (value == "4" || value == "P") color = Color.ORANGE;
        return '<span style="font-weight:bold;color:' + color + '">' + label + '</span>';
    }
    return label;
}

CustomFields.getHtml = function (table, custom) {
    var html = [];
    var items = CustomFields.get(table, custom);
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
    var customFields = CustomFields.get(table, item.custom);
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

CustomFields.addFileBox = function (label, table, id, action) {
    var files = [];
    if (table && id) files = Query.select("System.files", "id;name;mime;externalurl", "linkedtable={table} AND linkedrecid={id}", "date");
    if (action == null && files.length == 0) return;

    if (label != null) List.addHeader(label);

    if (WEB()) {
        _html.push('<div style="margin-left:60px;">');
        NextPrevious.addSection();
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var fileid = (file.mime.indexOf("image/") != -1 && file.externalurl == "") ? file.id : null;
            List.addThumbnail(file.name, fileid, CustomFields._VIEWFILE + "({file.id})");
        }
        if (action != null) FileBox.writeButton("", R.SELECTFILE, "FilePicker.pick({table},{id})", "");
        _html.push('</div>');
    } else {
        if (action != null) {
            var label = (action == "scan") ? R.SCANDOCUMENT : R.ADDPHOTO;
            List.addItem(label, "App.takePicture({table},{id},{action})", "img:camera;icon:new");
        }

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var style = null;
            if (file.mime == 'image/jpeg' || file.mime == 'image/png' || file.mime == 'image/gif') style = "scale:crop;img:" + Settings.getFileUrl(file.id);
            List.addItem(file.name, CustomFields._VIEWFILE + "({file.id})", style);
        }
    }
}

CustomFields.addScoreBox = function (label, value) {
    var onchange = "";
    var options = "";
    List.addToggleBox('', label, value, onchange, options);
}