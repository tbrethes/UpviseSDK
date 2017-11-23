///////////////////////////////////////////////////////////////
// FORM Templates

Templates.editTemplates = function(tab) {

    Toolbar.addButton(R.NEWTEMPLATE, "Templates.newTemplate({tab})", "new");
    Toolbar.addButton(R.IMPORT, "Templates.importTemplates()", "upload");
    Toolbar.addButton(R.EXPORT, "Templates.exportCheckedTemplates()", "more");

    //if (User.isAdmin()) Toolbar.addButton("Import German Translations", "Templates.importLocalizeDE()", "more");

    Toolbar.addTab(R.ALL, "Templates.editTemplates()", "count:" + Query.count("Forms.templates", Where.addOwner()));
    var groups = Query.select("Forms.groups", "id;name", null, "rank");
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var count = Query.count("templates", Where.addOwner("groupid={group.id}"));
        Toolbar.addTab(group.name, "Templates.editTemplates({group.id})", "count:" + count);
    }
    if (groups.length > 0) {
        var count = Query.count("Forms.templates", "groupid=''");
        if (count > 0) Toolbar.addTab(R.UNCLASSIFIED, "Templates.editTemplates('')", "count:" + count);
    }

    List.addItemTitle(R.TEMPLATES);

    var where = (tab != null) ? "groupid={tab}" : "";
    var templates = Query.select("Forms.templates", "*", Where.addOwner(where), "name");

    List.addHeader([R.NAME, R.LINKEDTO, R.GROUP, "Last Modified", R.OWNER], ["50%"], "checkbox");
    for (var i = 0; i < templates.length; i++) {
        var template = templates[i];
        var name = template.name + " " + Format.text(template.prefix, "gray");
        var fields = Query.select("Forms.fields", "_date", "formid={template.id}", "_date DESC");
        var date = (fields.length > 0) ? Format.date(fields[0]._date) : "";
        var linkedto = (template.linkedtable) != "" ? Format.options(template.linkedtable, Forms.getLinkedOptions()) : "";
        var group = Query.names("Forms.groups", template.groupid);
        List.add([name, linkedto, group, date, Format.owner(template.owner)], "Templates.viewTemplate({template.id})", { id: template.id });
    }
    List.show();
}

Templates.exportCheckedTemplates = function() {
    var ids = Table.getChecked();
    if (ids.length == 0) { App.alert(R.CHECKFIRST, 'yellow'); return;  }
    Templates.exportTemplates(ids);
}

///////////////////////////////////////////////////////

Templates.newTemplate = function(groupid) {
    Toolbar.setTitle(R.NEWTEMPLATE);
    Toolbar.addButton(R.SAVE, "Templates.saveTemplate({groupid})", "save");
    List.addTextBox("name", R.NAME, "");
    List.show("pane");
}

Templates.saveTemplate = function(groupid) {
    var name = List.getValue("name");
    if (name == "") return;
    var id = Query.insert("Forms.templates", { name: name, groupid: groupid });
    History.replace("Templates.viewTemplate({id})");
}

/////////////// View Form Template'

Templates.updatePdfOptions = function (templateid, id, value) {
    Templates.pdfoptions[id] = value;
    Query.updateId("Forms.templates", templateid, "pdfoptions", JSON.stringify(Templates.pdfoptions));
   // History.reload();
}

Templates.viewTemplate = function(id, tab) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Templates.pdfoptions = FormsPdf.getOptions(template);

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";
    var onchange2 = "Templates.updatePdfOptions({template.id},this.id,this.value)";

    var fields = Query.select("Forms.fields", null, "formid={id}", "rank");
    var states = Query.select("Forms.states", "*", "templateid={id}", "state");
    var stateOptions = Templates.getStateOptions(id);

    Toolbar.addTab(R.FIELDS, "Templates.viewTemplate({id})", "count:" + fields.length);
    Toolbar.addTab(R.INFO, "Templates.viewTemplate({id},1)");
    if (states.length == 0) Toolbar.addTab(R.SUBMIT, "Templates.viewTemplate({id},5)"); // onSubmit is not used and not relevant when there is a workflow
    if (Templates.EXPORTPDF) {
        Toolbar.addTab(R.EXPORTPDF, "Templates.viewTemplate({id},6)");
        Toolbar.addTab(R.EXPORTEXCEL, "Templates.viewTemplate({id},8)");
        Toolbar.addTab(R.CUSTOMEMAIL, "Templates.viewTemplate({id},7)");
    }
    if (Templates.WORKFLOW) Toolbar.addTab(R.WORKFLOW, "Templates.viewTemplate({id},2)", "count:" + states.length);
    if (Templates.SHARING) Toolbar.addTab(R.SHARING, "Templates.viewTemplate({id},3)");
    if (Templates.DASHBOARD) Toolbar.addTab(R.DASHBOARD, "Templates.viewTemplate({id},4)");

    if (tab == null) Toolbar.addButton(R.HELP, "App.help('forms/help/template/fieldtypes.htm')", 'support');
    else if (tab == 1) Toolbar.addButton(R.HELP, "App.help('forms/help/template/info.htm')", 'support');
    else if (tab == 2) Toolbar.addButton(R.HELP, "App.help('forms/help/template/workflow.htm')", 'support');
    else if (tab == 3) Toolbar.addButton(R.HELP, "App.help('forms/help/template/sharing.htm')", 'support');
    else if (tab == 4) Toolbar.addButton(R.HELP, "App.help('forms/help/template/dashboard.htm')", 'support');
    else if (tab == 5) Toolbar.addButton(R.HELP, "App.help('forms/help/template/submit.htm')", 'support');
    else if (tab == 6) Toolbar.addButton(R.HELP, "App.help('forms/help/template/exportpdf.htm')", 'support');
    else if (tab == 7) Toolbar.addButton(R.HELP, "App.help('forms/help/template/customemail.htm')", 'support');
    else if (tab == 8) Toolbar.addButton(R.HELP, "App.help('forms/help/template/exportexcel.htm')", 'support');

    Toolbar.addButton(R.EXPORT, "Templates.exportTemplate({id})", "download");
    Toolbar.addButton(R.DELETE, "Templates.deleteTemplate({id})", "more");

    //Toolbar.addButton("Download Archive", "Forms.downloadArchive({id})", "more");

    var templateName = template.name + " " + Format.text(template.prefix, "gray");

    if (tab == null) writeNewFieldToolbar(id);

    List.addItemBox(R.TEMPLATE, templateName, "", "img:form");

    if (tab == null) {
        Toolbar.addButton(R.PREVIEW, "Templates.preview({id})");
        Toolbar.addButton(R.DUPLICATE, "Templates.duplicate({id})", "more");

  //      writeNewFieldToolbar(id);
  //      List.addItemTitle("", ""); // because of space taken by toolbox

        if (fields.length == 0) {
            _writeEmpty(R.NOFIELD + ".<br/><br/>" + R.ADDFIELDS);
        } else {
            if (states.length > 0) List.addHeader(["", R.NAME, R.TYPE, R.MANDATORYFIELD, R.EDITABLE, "ID"], ["40px", null, "150px", "80px", "80px", "40px"]);
            else List.addHeader(["", R.NAME, R.TYPE, R.MANDATORYFIELD, "ID"], ["40px", null, "150px", "80px", "40px"]);

            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var background = (field.type == "header") ? "#F1F1F1" : null;
                var style = { background: background, oncontext: "showFieldContextMenu({field.id})", ondrop:"Templates.onDropField", id:field.id };
                var label = field.label;
                if (field.type == "risk") label = Query.names("Qhse.risks", field.label);
                var type = Format.options(field.type, Templates.getFieldOptions());
                var mandatory = (field.mandatory == 1) ? R.YES : "";
                if (states.length > 0) {
                    var editable = Format.options(field.status, stateOptions);
                    List.add([field.rank, label, type, mandatory, editable, field.name], "editFieldTemplate({field.id})", style);
                } else {
                    List.add([field.rank, label, type, mandatory, field.name], "editFieldTemplate({field.id})", style);
                }
            }
        }
    } else if (tab == 1) {
        Templates.editFormTemplate(template, onchange);
    } else if (tab == 2) {
        Toolbar.addButton(R.NEWSTATE, "newState({id})", "new");
        writeStates(states);
    } else if (tab == 3) {
        if (template.public == 1) {
            List.addButton(R.DISABLEPUBLIC, "setTemplatePublic({id},false)");

            var data = 't=' + encodeURIComponent(User.shareToken) + '&i=' + encodeURIComponent(id);
            var url = User.BASE_URL + "form.htm" + '?' + data;
            var buf = '<a target=_blank href="' + url + '">' + url + '</a>';
            List.addItemLabel(R.PUBLICFORMURL, buf);
            var onchangeoption = "AccountSettings.set(this.id,this.value)";
            List.addCheckBox("forms.publiclink", R.DISPLAYLINKEDREC, AccountSettings.get("forms.publiclink"), onchangeoption); // NB this is common to all templates
            List.addTextBox("publicnotifemail", R.SUBMITNOTIFEMAIL, template.publicnotifemail, onchange);
            List.addHelp(R.SUBMITNOTIFEMAIL_HELP);

        } else {
            List.addButton(R.ENABLEPUBLIC, "setTemplatePublic({id},true)");
        }
    } else if (tab == 4) {
        List.addTextBox("dashboardjs", R.CUSTOMDASHBOARD, template.dashboardjs, onchange, "code");
        List.addHelp("Overwrite the function: Report.writeDashboard = function(tab) {" + "// insert your code here }")
    } else if (tab == 5) {
        List.addTextBox("onsubmit", R.EXECUTEONSUBMIT, template.onsubmit, onchange, "code");
        List.addHelp(R.EXECUTEONSUBMIT_HELP);
        List.addTextBox("onreject", "Execute OnReject", template.onreject, onchange, "code");
    } else if (tab == 6) {
        List.forceNewLine = false;

        List.addComboBox("columnwidth", R.COLUMNWIDTH, Templates.pdfoptions.columnwidth, onchange2, "200px|300px|400px|500px|600px|700px|800px|900px|1000px|:Dynamic");
        List.addComboBox("fontsize", R.FONTSIZE, Templates.pdfoptions.fontsize, onchange2, "1.0em|1.2em|1.4em|1.6em|1.8em|2.0em");
        List.addComboBox("columns", R.COLUMNS, Templates.pdfoptions.columns, onchange2, "1:" + R.SINGLECOL + "|2:" + R.TWOCOL);
        List.addComboBox("headercolor", "Header Background Color", Templates.pdfoptions.headercolor, onchange2, Color.getOptions());

        List.addComboBox("photoheight", "Photo height", Templates.pdfoptions.photoheight, onchange2, "200px|250px|275px|300px|350px|400px|410px|450px|500px|fullsize:Full Size");
        List.addComboBox("photocaption", "Add Photo Caption", Templates.pdfoptions.photocaption, onchange2, "0:" + R.NO + "|1:" + R.YES);

        List.addHeader(R.WATERMARK);
        List.addTextBox("watermark", R.TEXT, Templates.pdfoptions.watermark, onchange2);
        List.addTextBox("watermarkcolor", R.COLOR, Templates.pdfoptions.watermarkcolor, onchange2, "color");

        List.addHeader("Customize");
        List.addCheckBox("hideempty", R.HIDEEMPTYFIELDS, Templates.pdfoptions.hideempty, onchange2);
        List.addCheckBox("location", R.FORMSPDFLOCATION, Templates.pdfoptions.location, onchange2);
        List.addCheckBox("caption", R.INCLUDEFORMCAPTION, Templates.pdfoptions.caption, onchange2);
        List.addCheckBox("nohistory", R.PDFNOHISTORY, Templates.pdfoptions.nohistory, onchange2);
        List.addCheckBox("subformlist", "If used a as sub form, layout vertically", Templates.pdfoptions.subformlist, onchange2);

        List.addHeader(R.HEADER + " & " + R.FOOTER);
        List.addFileBox("logoid", R.HEADERIMAGE, Templates.pdfoptions.logoid, onchange2);
        List.addTextBox("footer", R.FOOTER, Templates.pdfoptions.footer, onchange2, "longtext");

  //      List.addHeader("Watermark");

        Toolbar.addButton(R.INSERTPLACEHOLDER, "Templates.popupInsertPlaceholder({id},'html')", "popup");
        //Toolbar.addButton("HTML Source", "Templates.viewTemplate({id},'htmlcode')");
        List.addHeader(R.CUSTOMIZELAYOUT);

        List.addFileBox("pdfid", "Custom Pdf Template", Templates.pdfoptions.pdfid, onchange2);
        List.addHeader("Simple HTML Layout");
        List.addHelp(R.CUSTOMIZELAYOUT_HELP);
        List.addTextBox("htmlpdf", "", template.htmlpdf, onchange, "textarea");
    } else if (tab == 7) {
        Toolbar.addButton(R.INSERTPLACEHOLDER, "Templates.popupInsertPlaceholder({id},'text')", "popup");
        List.addTextBox("subject", R.SUBJECT, template.subject, onchange);
        List.addTextBox("body", R.MESSAGE, template.body, onchange, "textarea2");
        List.addHelp(R.CUSTOMEMAIL_HELP);
    } else if (tab == 8) {
        List.addFileBox("excelid", "Custom Excel Template", Templates.pdfoptions.excelid, onchange2);
        List.addHelp("Append the prefix ## to a Form Field ID to insert the field value in your custom Excel.");
    }
    List.show();
}


Templates.editFormTemplate = function(template, onchange) {
    List.addTextBox("name", R.NAME, template.name, onchange, "longtext");
    List.addTextBox("prefix", R.PREFIX, template.prefix, onchange);
    List.addComboBoxMulti('owner', R.OWNER, template.owner, onchange, User.getOptions());
    if (Forms.getLinkedOptions != undefined) List.addComboBox('linkedtable', R.LINKEDTO, template.linkedtable, onchange, Forms.getLinkedOptions());
    List.addTextBox("counter", R.NEXTFORMID, template.counter, onchange, "numeric");
    List.addHeader(R.TASKGROUP);
    List.addComboBox('groupid', R.GROUP, template.groupid, onchange, Query.options("Forms.groups"), "Templates.addGroupToCombo(this.value)");
    List.addComboBoxMulti('notifusers', R.NOTIFYMANAGERS, template.notifusers, onchange, User.getOptions("manager"));
    List.addHeader(R.OPTIONS);
    List.addCheckBox("favorite", R.PINLEFTPANE, template.favorite, onchange);
    List.addCheckBox("punch", R.HASPUNCHITEMS, template.punch, onchange);
    List.addTextBox("version", "Version", template.version, onchange, "longtext");
    List.addHeader("Display Columns");
    List.addComboBoxMulti('columns', "List Columns", template.columns, onchange, Templates.getColumnsOptions(template.id));
}

Templates.getColumnsOptions = function (templateid) {
    var options = [];
    options.push("name:" + R.NAME);
    options.push("status:" + R.STATUS);
    options.push("link:" + R.LINKEDTO);
    options.push("date:" + R.DATE);
    options.push("owner:" + R.OWNER);

    var fields = Query.select("Forms.fields", "name;label;type", "formid={templateid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type != "signature" && field.type != "photo" && field.type != "image" && field.type != "button" && field.type != "label" && field.type != "header") {
            options.push(field.name + ":" + field.label);
        }
    }
    return options.join("|");
}

Templates.addGroupToCombo = function (name) {
    var rank = 10 + Query.max("Forms.groups", "rank");
    var id = Query.insert("Forms.groups", { rank: rank, name: name });
    ComboBox.addOption('groupid', name, id);
    return true;
}

function setTemplatePublic(id, yes) {
    Query.updateId("Forms.templates", id, "public", yes ? 1 : 0);
    History.reload();
}

Templates.preview = function (id) {
    var template = Query.selectId("Forms.templates", id);

    Toolbar.setTitle(R.PREVIEW);
    List.forceNewLine = AccountSettings.getBool("Forms.twocols", false) == false;
    List.addItemTitle(template.name);

    var fields = Query.select("Forms.fields", null, "formid={id}", "rank");
    var list = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var field2 = {};
        field2.id = field.name;
        field2.label = field.label;
        field2.type = field.type;
        field2.value = field.value;
        field2.options = field.seloptions;

        if (field2.type == "risk") {
            var risk = Query.selectId("Qhse.risks", field.label);
            if (risk != null) {
                field2.label = risk.name;
                field2.options = risk.measures;
                if (_valueObj == null) _valueObj = new Object();
                _valueObj[field2.id + "P"] = risk.probability;
                _valueObj[field2.id + "S"] = risk.severity;
            }
        }
        list.push(field2);
    }


    for (var i = 0; i < list.length; i++) {
        var field = list[i];
        CustomFields.writeEditItem(field.id, field.type, field.label, field.value, null, field.options);
    }
    List.show();
}

////////////////////////////////////////////////////

function writeNewFieldToolbar(templateId) {
    Toolbox.addButton("Question", "Templates.newQuestion({templateId})", "Question with a set of toggle answer buttons", "popup");
    Toolbox.addButton(R.COMBOBOX, "Templates.newComboBox({templateId})", "Single or Multi Combobox with custom or predefined values from Upvise records", "popup");
    Toolbox.addButton(R.TEXTBOX, "Templates.newTextBox({templateId})", "Text input field, email, phone number, numeric, decimal, web link,...", "popup");
    Toolbox.addButton("Date Box", "Templates.newDateBox({templateId})", "Date, Time or Duration input field", "popup");
    Toolbox.addButton(R.PHOTO, "Templates.newPhotoBox({templateId})", "Take photos from your phone camera", "popup");
    Toolbox.addButton(R.BUTTON, "Templates.newButton({templateId})", "Button Field to create a Task, Note, Event or Form", "popup");
    Toolbox.addButton(R.LABEL, "Templates.newLabel({templateId})", "Read only label", "popup");

    var list = [];
    list.push({ id: "checkbox", label: R.CHECKBOX, tooltip: "Check Box Field" });
    list.push({ id: "header", label: "Section", tooltip: "Section Header separator" });
 //   list.push({ id: "label", label: R.LABEL, tooltip: "Read only label" });
    list.push({ id: "formula", label: "Formula", tooltip: "Javascript formula field to compute value from other form values or any Upvise database record" });
    list.push({ id: "signature", label: R.SIGNATURE, tooltip: "Digital Signature field from phone" });
    if (User.hasApp("qhse")) list.push({ id: "risk", label: "Risk", tooltip: "Risk defined in the Knowledge Base Application. Each Risk has a set of control measures and probability / severity predefined" });

    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        Toolbox.addButton(item.label, "newFieldTemplate({templateId},{item.id})", item.tooltip);
    }
    Toolbox.show();

    _html.push("<br/><br/><br/>"); // to keep space for the toolbox
}

Templates.duplicate = function(templateid) {
    var template = Query.selectId("Forms.templates", templateid);
    var name = R.COPYOF + " " + template.name;
    Toolbar.setTitle("Duplicate Template");
    Toolbar.addButton(R.SAVE, "Templates.onDuplicate({templateid})", "save");
    List.addTextBox("name", R.NAME, name, "");
    List.show("pane");
}

Templates.onDuplicate = function(templateid) {
    var name = List.getValue("name");
    if (name == "") {App.alert("Please enter a Template Name");return; }

    var template = Query.selectId("Forms.templates", templateid);

    // create the new blank template form
    var newid = Query.insert("Forms.templates", { name: name, linkedtable: template.linkedtable, onsubmit: template.onsubmit, groupid: template.groupid });

    // duplicate all fields
    var fields = Query.select("Forms.fields", null, "formid={templateid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        field = Utils.clone(field);
        field._date = undefined;
        field.formid = newid;
        Query.insert("Forms.fields", field);
    }

    // duplicate all states
    var states = Query.select("Forms.states", null, "templateid={templateid}", "rank");
    for (var i = 0; i < states.length; i++) {
        var state = states[i];
        state = Utils.clone(state);
        state.templateid = newid;
        Query.insert("Forms.states", state);
    }

    // now insert all fields
    History.replace("Templates.viewTemplate({newid})");
}

// type="html" for HTML text area or "text" for text-only text ares and input fields
Templates.popupInsertPlaceholder = function (templateid, type) {
    var callback = (type == "html") ? "Templates.onInsertHtmlPdf" : "TextBox.insertTextAtCursor";

    Popup.add(R.MYNAME, callback + "('" + FormsPdf.MYNAME + "')");
    Popup.add(R.FORMNAME, callback + "('" + FormsPdf.FORMNAME + "')");
    Popup.add(R.LINKEDNAME, callback + "('" + FormsPdf.LINKEDNAME + "')");
    Popup.addHeader(R.FIELDS);
    var fields = Query.select("Forms.fields", "*", "formid={templateid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var toinsert = "#" + field.name + "#";
        Popup.add(field.label + " (" + field.name + ")", callback + "({toinsert})");
    }
    Popup.show();
}

Templates.onInsertHtmlPdf = function (fieldname) {
    HtmlBox.insertText("htmlpdf", fieldname);
}

/////////////////////

Templates.importLocalizeDE = function () {
    Import.pickExcelFile(Templates.onImportLocalize);
}

Templates.onImportLocalize = function (rows) {
    var map = new HashMap();
    var fields = Query.select("fields", "*");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var template = Query.selectId("templates", field.formid);
        if (template) {
            var key = template.name + ":" + field.name;
            map.set(key, field);
        }
    }

    var count = 0;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var templateName = row[0];
        var name = row[3];
        var labelDE = row[5];
        var key = templateName + ":" + name;
        var field = map.get(key);
        if (field) {
            count++;
            Query.updateId("fields", field.id, "labelDE", labelDE)
        }
    }
    History.reload();
    alert("Updated DE Labesl: " + count);
}
