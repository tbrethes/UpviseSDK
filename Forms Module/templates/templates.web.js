///////////////////////////////////////////////////////////////
// FORM Templates

Templates.editTemplates = function () {
    let groups = Query.select("Forms.groups", "id;name", null, "name");
    if (groups.length >= 20) {
        History.redirect("Templates.editTemplates2()");
        return;
    }
    
    var title = R.CONFIGURE  + " " + R.TEMPLATES;
    Toolbar.setStyle("search");
    Toolbar.addButton(R.NEWTEMPLATE, "Templates.newTemplate()", "new");
    Toolbar.addButton(R.IMPORT, "Templates.importTemplates()", "upload");
    Toolbar.addButton(R.EXPORT, "Templates.exportCheckedTemplates(true)", "more");

    let templates = [];
    const search = History.current() ? History.current().search : null;
    if (search) {
        // search all forms
        templates = Query.select("Forms.templates", "*", "", "name");
        templates = Filter.search(templates, "name");
        groups = Filter.search(groups, "name");
        title += " / Search Results : " + search;
    } else {
        // only templates with no group
        templates = Query.select("Forms.templates", "*", "groupid=''", "name");
    }

    List.addItemTitle(title);
    for (let group of groups) {
        const count = Query.count("templates", "groupid={group.id}");
        Grid.add(group.name, "Templates.editTemplateGroup({group.id})", "img:folder;count:" + count);
    }

    // Show templates with no group
    Templates.writeTemplateList(templates);
    Grid.show();
}

Templates.editTemplates2 = function(tab) {
    let title = R.CONFIGURE;
    let templates = Query.select("Forms.templates", "*", "name");
    let groups = Query.select("Forms.groups", "id;name", null, "name");
    
    const search = History.current() ? History.current().search : null;
    if (search) {
        templates = Filter.search(templates, "name");
        groups = Filter.search(groups, "name");
        title += " / Search Results : " + search;
    }
    
    Toolbar.setStyle("search");
    Toolbar.addButton(R.NEWTEMPLATE, "Templates.newTemplate()", "new");
    Toolbar.addButton(R.IMPORT, "Templates.importTemplates()", "upload");
    Toolbar.addButton(R.EXPORT, "Templates.exportCheckedTemplates(true)", "more");
    
    List.addItemTitle(title);
    List.addTab(R.TEMPLATES, templates.length, "Templates.editTemplates2()", "img:form");
    List.addTab(R.GROUPS, groups.length, "Templates.editTemplates2('groups')", "img:folder");
    
    if (tab == "groups") {
        List.addLine();
        for (const group of groups) {
            const count = Query.count("templates", "groupid={group.id}");
            Grid.add(group.name, "Templates.editTemplateGroup({group.id})", "img:folder;count:" + count);
        }
    } else {
        Table.init();
        Table.addColumn(R.NAME, "string+");
        Table.addColumn(R.GROUP, "string", {width:"400px"});
        Table.addColumn(R.LINKEDTO, "string", {width:"100px"});
        Table.addColumn(R.DATE, "date");
        
        for (let template of templates) {
            let name = template.name;
            if (template.prefix) name += " -- " + template.prefix;
            let linkedto = template.linkedtable ? Format.options(template.linkedtable, Forms.getLinkedOptions()) : "(None)";
            let group = Query.names("Forms.groups", template.groupid);
            Table.addRow(template.id, [name, group, linkedto, template.date], "Templates.viewTemplate({template.id})");
        }
        Table.render();
    }
        
    List.show();    
}
        
Templates.editTemplateGroup = function (groupid) {
    var templates = Query.select("Forms.templates", "*", "groupid={groupid}", "name");

    Toolbar.addButton(R.NEWTEMPLATE, "Templates.newTemplate({groupid})", "new");
    Toolbar.addButton(R.EDIT, "Forms.editGroup({groupid})", "edit");
    Toolbar.addButton(R.IMPORT, "Templates.importTemplates()", "upload");
    Toolbar.addButton(R.EXPORT, "Templates.exportCheckedTemplates()", "more");
    
    List.addItemBox("", groupid ? Query.names("Forms.groups", groupid) : "#NO GROUP", "", "img:folder");
    Templates.writeTemplateList(templates);
    List.show();
}

Templates.writeTemplateList = function (templates) {
    if (templates.length == 0) return;

    Table.init();
        Table.addColumn(R.NAME, "string+");
        Table.addColumn(R.GROUP, "string", {width:"400px"});
        Table.addColumn(R.LINKEDTO, "string", {width:"100px"});
        Table.addColumn(R.DATE, "date");
        
        for (let template of templates) {
            let name = template.name;
            if (template.prefix) name += " -- " + template.prefix;
            let linkedto = template.linkedtable ? Format.options(template.linkedtable, Forms.getLinkedOptions()) : "";
            let group = Query.names("Forms.groups", template.groupid);
            Table.addRow(template.id, [name, group, linkedto, template.date], "Templates.viewTemplate({template.id})");
        }
        Table.render();
}

/////////////////////////////////////////////////////////

Templates.exportCheckedTemplates = function (all) {
    var ids = [];
    if (all === true) {
        var templates = Query.select("Forms.templates", "id", "", "name");
        for (var i = 0; i < templates.length; i++) {
            ids.push(templates[i].id);
        }
    } else {
        ids = Table.getChecked();
        if (ids.length == 0) { App.alert(R.CHECKFIRST, 'yellow'); return;  }
    }
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
    var values = { name: name, groupid: groupid, date:Date.now() };
    var id = Query.insert("Forms.templates", values);
    History.redirect("Templates.viewTemplate({id})");
}

/////////////// View Form Template

Templates.updatePdfOptions = function (templateid, id, value) {
    Templates.pdfoptions[id] = value;
    Query.updateId("Forms.templates", templateid, "pdfoptions", JSON.stringify(Templates.pdfoptions));
}

//////////////// 
Templates.editFields = function (id, headerid) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Templates.pdfoptions = FormsPdf.getOptions(template);

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";
    var onchange2 = "Templates.updatePdfOptions({template.id},this.id,this.value)";

    var fields = Query.select("Forms.fields", null, "formid={id}", "rank");
    var states = Query.select("Forms.states", "*", "templateid={id}", "status");
    var stateOptions = Templates.getStateOptions(id);

    Toolbar.addButton(R.EXPORT, "Templates.exportTemplate({id})", "download");
    Toolbar.addButton(R.HELP, "App.help('forms/help/template/fieldtypes.htm')", 'support');
    Toolbar.moreButton = false;
    
    writeNewFieldToolbar(id);

    List.addItemBox(template.name, R.FIELDS, "", "img:product");

    var fieldsMap = Forms.groupByHeader(fields);
    fieldsMap.keys.shift(); // remove the first "General" centry
    var filterLabel = headerid ? fieldsMap.get(headerid).label : "Sections";
    var fistColumnLabel = headerid ? filterLabel : R.NAME;

    if (fieldsMap.keys.length > 0) Grid.add(filterLabel, "Templates.popupHeaders({id})", "count:" + fieldsMap.keys.length);
    if (headerid) fields = fieldsMap.get(headerid).fields;

    Toolbar.addButton(R.PREVIEW, "Templates.preview({id})");
    Toolbar.addButton(R.DUPLICATE, "Templates.duplicate({id})", "more");

    if (fields.length == 0) {
        _writeEmpty(R.NOFIELD + ".<br/><br/>" + R.ADDFIELDS);
    } else {
        if (states.length > 0) List.addHeader(["", fistColumnLabel, R.TYPE, "", "", "", R.EDITABLE, "ID"], ["40px", null, "150px", "80px", "80px", "80px", "80px", "40px"]);
        else List.addHeader(["", fistColumnLabel, R.TYPE, "", "", "", "ID"], ["40px", null, "150px", "80px", "80px", "80px", "40px"]);

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var background = (field.type == "header") ? "#F1F1F1" : null;
            var style = { background: background, oncontext: "showFieldContextMenu({field.id})", ondrop: "Templates.onDropField", id: field.id };
            var label = '<div style="white-space: pre-line">' + field.label + "</div>";
            if (field.type == "risk") label = Query.names("Qhse.risks", field.label);
            var type = Format.options(field.type, Templates.getFieldOptions());
            var mandatory = (field.mandatory == 1) ? Format.tag(R.MANDATORYFIELD, Color.RED) : "";
            var hidden = (field.hidden == 1) ? Format.tag("Hidden", Color.BLUE) : "";

            var hasScript = "";
            if (field.onchange || Templates.hasScript(field.seloptions) || Templates.hasScript(field.value)) {
                hasScript = Format.tag("Script", "green")
            } else if (field.type == "button") {
                if (field.value == "newsubform") {
                    var subtemplateid = field.seloptions;
                    hasScript = Format.tag("Subform", "blue", "Templates.viewTemplate({subtemplateid})");
                } else if (field.value == "code") {
                    hasScript = Format.tag("Script", "green");
                }
            }

            var fieldName = Format.tag(field.name, Color.GRAY);
            if (states.length > 0) {
                var editable = Format.options(field.status, stateOptions);
                List.add([field.rank, label, type, hasScript, hidden, mandatory, editable, fieldName], "editFieldTemplate({field.id})", style);
            } else {
                List.add([field.rank, label, type, hasScript, hidden, mandatory, fieldName], "editFieldTemplate({field.id})", style);
            }
        }
    }
    List.show();
}

Templates.hasScript = function (value) {
    if (!value) return false;
    value = value.trim();
    return (value.startsWith("=") || value.startsWith("javascript:"))
}

Templates.editInfo = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.HELP, "App.help('forms/help/template/info.htm')", 'support');
    Toolbar.moreButton = false;

    List.addItemBox(template.mame, R.INFO, "", "img:info");

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";

    List.addTextBox("name", R.NAME, template.name, onchange, "longtext");
    List.addTextBox("prefix", R.PREFIX, template.prefix, onchange);
    List.addComboBoxMulti('owner', R.OWNER, template.owner, onchange, User.getOptions());
    if (Forms.getLinkedOptions != undefined) List.addComboBox('linkedtable', R.LINKEDTO, template.linkedtable, onchange, Forms.getLinkedOptions());
    List.addTextBox("counter", R.NEXTFORMID, template.counter, onchange, "numeric");
    List.addTextBox("version", "Version", template.version, onchange, "longtext");
    //List.addTextBox("icon", "Icon", template.icon, onchange, "text");
    List.addCheckBox("schedule", "Requires schedule to create", template.schedule, onchange);

    List.addHeader(R.TASKGROUP);
    List.addComboBox('groupid', R.GROUP, template.groupid, onchange, Query.options("Forms.groups"), "Templates.addGroupToCombo(this.value)");
    List.addComboBoxMulti('notifusers', R.NOTIFYMANAGERS, template.notifusers, onchange, User.getOptions("manager"));
 
    List.addHeader("Auto Archive");
    List.addTextBox('archivedays', "Archive after nb days", template.archivedays, onchange, "numeric");
    List.show();
}

Templates.editDisplay = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.HELP, "App.help('forms/help/template/info.htm')", 'support');
    Toolbar.moreButton = false;

    List.addItemBox(template.name, R.DISPLAY, "", "img:template");

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";

    List.forceNewLine = true;
    List.addHeader("Display Columns");
    List.addComboBoxMulti('columns', "List Columns", template.columns, onchange, Templates.getColumnsOptions(template.id));
    List.addComboBox('sortby', R.SORTBY, template.sortby, onchange, "date DESC:Most Recent|date:Older First|name:Name|priority:Priority");

    List.addHeader(R.OPTIONS);
    List.addCheckBox('splitheader', "Display each section on a separate screen on mobile" + " " + Format.tag("NEW", Color.BLUE), template.splitheader, onchange);
    List.addCheckBox("punch", R.HASPUNCHITEMS, template.punch, onchange);
    List.addCheckBox("favorite", R.FAVOURITE, template.favorite, onchange);
    List.addCheckBox("disablenew", "User cannot create new form", template.disablenew, onchange);  
    List.show();
}

Templates.editWorkflow = function(id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.NEWSTATE, "newState({id})", "new");
    Toolbar.addButton(R.HELP, "App.help('forms/help/template/workflow.htm')", 'support');  
    Toolbar.moreButton = false;

    List.addItemBox(template.name, R.WORKFLOW, "", "img:team");

    var states = Query.select("Forms.states", "*", "templateid={id}", "status");
    writeStates(states);
    List.show();
}

Templates.editScripting = function(id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.moreButton = false;

    List.addItemBox(template.name, "Scripting", "", "img:app");

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";
    List.addTextBox("oncreate", "On Form Creation Custom Script", template.oncreate, onchange, "code");

    List.addTextBox("onedit", "On Form Edit Custom Script", template.onedit, onchange, "code");
    var help = [];
    help.push("Define here your own custom functions to be called from onchange script of your various form fields.");
    help.push("Functions must be declared in the <b>Forms</b> global object to be accessible.");
    help.push("<b>Forms.doSomething = function(form, value, label, fieldid) {"  + "...." + "}");
    List.addHelp(help.join("<br/>"));
    
    var hasWorkflow = Query.count("Forms.states", "templateid={id}") > 0;
    if (hasWorkflow == false) {
        List.addTextBox("onsubmit", R.EXECUTEONSUBMIT, template.onsubmit, onchange, "code");
        List.addHelp(R.EXECUTEONSUBMIT_HELP);
        List.addCheckBox("signonsubmit", "Require signature on Submit", template.signonsubmit, onchange);
    } else {
        List.addTextBox("onreject", "Execute OnReject", template.onreject, onchange, "code");
    }
    List.show();
}

Templates.editExportPdf = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.HELP, "App.help('forms/help/template/exportpdf.htm')", 'support');
    Toolbar.moreButton = false;

    List.addItemBox(template.name, R.EXPORTPDF, "", "img:pdf");

    Templates.pdfoptions = FormsPdf.getOptions(template);
    var onchange2 = "Templates.updatePdfOptions({template.id},this.id,this.value)";

    List.forceNewLine = false;

    List.addComboBox("columnwidth", R.COLUMNWIDTH, Templates.pdfoptions.columnwidth, onchange2, "200px|300px|400px|500px|600px|700px|800px|900px|1000px|:Dynamic");
    List.addComboBox("fontsize", R.FONTSIZE, Templates.pdfoptions.fontsize, onchange2, "1.0em|1.2em|1.4em|1.6em|1.8em|2.0em");
    List.addComboBox("columns", R.COLUMNS, Templates.pdfoptions.columns, onchange2, "1:" + R.SINGLECOL + "|2:" + R.TWOCOL);
    List.addComboBox("headercolor", "Header Background Color", Templates.pdfoptions.headercolor, onchange2, Color.getOptions());

    List.addComboBox("photoheight", "Photo height", Templates.pdfoptions.photoheight, onchange2, "200px|250px|275px|300px|350px|400px|410px|450px|500px|fullsize:Full Size");
    List.addComboBox("photocaption", "Add Photo Caption", Templates.pdfoptions.photocaption, onchange2, "0:" + R.NO + "|1:" + R.YES);
    List.addComboBox("orientation", "Orientation", Templates.pdfoptions.orientation, onchange2, "portrait:" + "Portrait" + "|landscape:" + "Landscape");
   
    List.addHeader("Customize");
    List.addCheckBox("location", R.FORMSPDFLOCATION, Templates.pdfoptions.location, onchange2);
    List.addCheckBox("caption", R.INCLUDEFORMCAPTION, Templates.pdfoptions.caption, onchange2);
    List.addCheckBox("nohistory", R.PDFNOHISTORY, Templates.pdfoptions.nohistory, onchange2);
    List.addCheckBox("hideempty", R.HIDEEMPTYFIELDS, Templates.pdfoptions.hideempty, onchange2);
    List.addCheckBox("nopunch", "Hide punch items", Templates.pdfoptions.nopunch, onchange2);
    List.addCheckBox("linkedpdfcover", "Add link and cover for Attached PDF File&nbsp;" + Format.tag("New", Color.BLUE), Templates.pdfoptions.linkedpdfcover, onchange2);
 
    List.addHeader("If used as a subform");
    List.addCheckBox("subformlist", "Layout vertically", Templates.pdfoptions.subformlist, onchange2);
    List.addCheckBox("subformhidden", "Show hidden fields", Templates.pdfoptions.subformhidden, onchange2);
    List.addCheckBox("subformskip", "Do not export at all", Templates.pdfoptions.subformskip, onchange2);
    List.addCheckBox("subformtableheader", "Show Template Name header", Templates.pdfoptions.subformtableheader, onchange2);
    
    List.addHeader(R.WATERMARK);
    List.addTextBox("watermark", R.TEXT, Templates.pdfoptions.watermark, onchange2);
    List.addTextBox("watermarkcolor", R.COLOR, Templates.pdfoptions.watermarkcolor, onchange2, "color");
    List.addCheckBox("qrcode", "QRCode Verification" + " " + Format.tag("New", Color.BLUE), Templates.pdfoptions.qrcode, onchange2);
    List.addCheckBox("watermarkstatus", "Show Intermediate Form Status Watermark" + " " + Format.tag("New", Color.BLUE), Templates.pdfoptions.watermarkstatus, onchange2);
    
    List.addHeader(R.HEADER + " & " + R.FOOTER);
    List.addFileBox("logoid", R.HEADERIMAGE, Templates.pdfoptions.logoid, onchange2);
    List.addTextBox("footer", R.FOOTER, Templates.pdfoptions.footer, onchange2, "longtext");
    List.addFileBox("footerid", "Footer Image", Templates.pdfoptions.footerid, onchange2);
    List.show();
}

Templates.editCustomExportPdf = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Templates.pdfoptions = FormsPdf.getOptions(template);
    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";
    var onchange2 = "Templates.updatePdfOptions({template.id},this.id,this.value)";

    Toolbar.moreButton = false;
    Toolbar.addButton(R.INSERTPLACEHOLDER, "Templates.popupInsertPlaceholder({id},'html')", "popup");
    Toolbar.addButton(R.HELP, "App.help('forms/help/template/exportpdf.htm')", 'support');
    
    List.forceNewLine = true;
    List.addItemBox(template.name, "Custom PDF Export Template", "", "img:upload");
    List.addFileBox("pdfid", "Custom Pdf Template", Templates.pdfoptions.pdfid, onchange2);
    
    List.addTextBox("pdffunc", "Custom Pdf Function", Templates.pdfoptions.pdffunc, onchange2, "text");
    List.addHelp("This function must be specific the Script On Edit");

    _html.push("<br/><br/><br/><br/>");
    List.addHeader("Simple HTML Layout");
    List.addTextBox("htmlpdf", "", template.htmlpdf, onchange, "textarea");
    List.addHelp(R.CUSTOMIZELAYOUT_HELP);

    List.show();
}

Templates.editExportExcel = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.HELP, "App.help('forms/help/template/exportexcel.htm')", 'support');
    Toolbar.moreButton = false;

    List.addItemBox(template.name, R.EXPORTEXCEL, "", "img:excel");

    Templates.pdfoptions = FormsPdf.getOptions(template);
    var onchange2 = "Templates.updatePdfOptions({template.id},this.id,this.value)";

    List.forceNewLine = false;
    List.addFileBox("excelid", "Custom Excel Template", Templates.pdfoptions.excelid, onchange2);
    List.addHelp("Append the prefix ## to a Form Field ID to insert the field value in your custom Excel.");
    List.show();
}

Templates.editDashboard = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.HELP, "App.help('forms/help/template/dashboard.htm')", 'support');
    Toolbar.moreButton = false;

    List.addItemBox(template.name, R.DASHBOARD, "", "img:chart");

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";
    List.forceNewLine = false;
    List.addTextBox("dashboardjs", R.CUSTOMDASHBOARD, template.dashboardjs, onchange, "code");
    List.addHelp("Overwrite the function: Report.writeDashboard = function(tab) {" + "// insert your code here }")
    List.show();
}

Templates.editCustomEmail = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.INSERTPLACEHOLDER, "Templates.popupInsertPlaceholder({id},'text')", "popup");
    Toolbar.addButton(R.HELP, "App.help('forms/help/template/customemail.htm')", 'support');
    Toolbar.moreButton = false;

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";

    List.addItemBox(template.name, R.CUSTOMEMAIL, "", "img:email");

    List.forceNewLine = false;
    List.addTextBox("subject", R.SUBJECT, template.subject, onchange);
    List.addTextBox("body", R.MESSAGE, template.body, onchange, "textarea2");
    List.addHelp(R.CUSTOMEMAIL_HELP);
    List.show();
}


Templates.editSharing = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.HELP, "App.help('forms/help/template/sharing.htm')", 'support');
    Toolbar.moreButton = false;

    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";

    List.addItemBox(template.name, R.SHARING, "", "img:group");

    List.forceNewLine = false;
    if (template.public == 1) {
        List.addButton(R.DISABLEPUBLIC, "setTemplatePublic({id},false)");

        var data = 't=' + encodeURIComponent(User.shareToken) + '&i=' + encodeURIComponent(id);
        var url = User.BASE_URL + "form.htm" + '?' + data;
        var buf = '<br/><a target=_blank href="' + url + '">' + url + '</a>';
        List.addItemLabel(R.PUBLICFORMURL, buf);
        List.addTextBox("publicnotifemail", R.SUBMITNOTIFEMAIL, template.publicnotifemail, onchange);
        List.addHelp(R.SUBMITNOTIFEMAIL_HELP);
    } else {
        List.addButton(R.ENABLEPUBLIC, "setTemplatePublic({id},true)");
    }
    List.show();
}

Templates.editIntegration = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.moreButton = false;
    List.addItemBox(template.name, "Integration", "", "img:pipe");
    List.forceNewLine = true;

    var url = Forms.getExportUrl(template.id);
    var absUrl = new URL(url, document.URL).href;
    var value = '<a href="' + absUrl + '">' + absUrl + '</a>';
    _html.push('<div><b>', "Integration URL" + Format.tag("Deprecated", Color.ORANGE), '</b></div><div style="background-color:#EEEEEE;padding:10px;margin:10px;display:inline-block">', value, '</div>');

    List.addLine();
    
    var onchange2 = "Query.updateId('forms.templates',{id},this.id,this.value);App.sync()";
    var fieldOptions = Templates.getIntegrationFieldOptions(id);
    // hack fix
    if (template.export && template.export.startsWith("{")) template.export = "";
    List.addComboBoxMulti("export", "Export Only these fields", template.export, onchange2, fieldOptions);

    _html.push("<br/><br/>");
    var onchange = "AccountSettings.set(this.id, this.value);App.sync()";
    List.addComboBox("forms.export.year", "Since year", AccountSettings.get("forms.export.year"), onchange, "0:All|2018|2019|2020|2021");
    List.addHelp("This applies for ALL form templates & Jobs URL export");
    
    List.show();
}

Templates.getIntegrationFieldOptions = function(id) {
    let fields = Query.select("Forms.fields", "id;type;label", "formid={id}", "rank");
    let options = [];
    let EXCLUDE_TYPES = ["photo", "drawing", "image", "header", "button", "formula", "label", "signature", "risk"];
    for (let field of fields) {
        if (field.label && EXCLUDE_TYPES.includes(field.type) == false) {
            options.push(field.name + ":(" + field.name + ") " + field.label);
        }
    }
    return options.join("|");
}

Templates.viewTemplate = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }

    Toolbar.addButton(R.DUPLICATE, "Templates.duplicate({id})", "duplicate");
    Toolbar.addButton(R.EXPORT, "Templates.exportTemplate({id})", "download");
    Toolbar.addButton("Import Forms", "Forms.importForms({id})", "more");
    Toolbar.addButton(R.DELETE, "Templates.deleteTemplate({id})", "more");
    
    let templateName = template.name + " " + Format.text(template.prefix, "gray");
    let fields = Query.select("Forms.fields", null, "formid={id}", "rank");
    let states = Query.select("Forms.states", "*", "templateid={id}", "status");
   
    List.addItemBox(R.TEMPLATE, templateName, "", "img:form");
    List.addLine();

    Grid.setStyle("compact");
    Grid.add(R.FIELDS, "Templates.editFields({id})", "img:product;count:" + fields.length);
    Grid.add(R.INFO, "Templates.editInfo({id})", "img:info");
    Grid.add("Display", "Templates.editDisplay({id})", "img:template");
    if (Templates.WORKFLOW) Grid.add(R.WORKFLOW, "Templates.editWorkflow({id})", "img:team;count:" + states.length);
    
    const scriptingColor = (template.oncreate || template.onedit || template.onsubmit || template.onreject) ? "green" : "";
    Grid.add("Scripting", "Templates.editScripting({id})", "img:app;color:" + scriptingColor);
    
    if (Templates.EXPORTPDF) {
        Grid.addHeader(R.EXPORT);
        Grid.add(R.EXPORTPDF, "Templates.editExportPdf({id})", "img:pdf");
        Grid.add("Custom PDF Template", "Templates.editCustomExportPdf({id})", "img:upload"); 
        Grid.add(R.EXPORTEXCEL, "Templates.editExportExcel({id})", "img:excel");
        Grid.add(R.CUSTOMEMAIL, "Templates.editCustomEmail({id})", "img:email");
    }
    Grid.addHeader("Advanced");
    if (Templates.DASHBOARD) Grid.add(R.DASHBOARD + " " + (template.dashboardjs? Format.tag("Script", Color.GREEN) : ""), "Templates.editDashboard({id})", "img:chart");
    
    let sharingStyle= "img:group";
    if (template.public == 1) sharingStyle += ";color:green;count:ON";
    if (Templates.SHARING) Grid.add(R.SHARING, "Templates.editSharing({id})", sharingStyle);
    Grid.add("Integration<br/>" + Format.tag("Deprecated", Color.ORANGE), "Templates.editIntegration({id})", "img:pipe");

    List.show();    
}

Templates.popupHeaders = function (templateid) {
    var fields = Query.select("Forms.fields", null, "formid={templateid}", "rank");
    var fieldsMap = Forms.groupByHeader(fields);
    fieldsMap.keys.shift();// remove the first General entry
    var func = "Templates.editFields({templateid})";
    Popup.add(R.ALL, "History.reload({func})", "img:close");
    Popup.addHeader(R.SECTIONHEADER);
    for (var i = 0; i < fieldsMap.keys.length; i++) {
        var key = fieldsMap.keys[i];
        var obj = fieldsMap.get(key);
        func = "Templates.editFields({templateid},{key})";
        Popup.add(obj.label, "History.reload({func})", "img:product");
    }
    Popup.show();    
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
    List.addCheckBox('splitheader', "Display each section on a separate screen on mobile" +  " " + Format.tag("NEW", Color.BLUE), template.splitheader, onchange);
    List.addTextBox("version", "Version", template.version, onchange, "longtext");
    List.addHeader("Display Columns");
    List.addComboBoxMulti('columns', "List Columns", template.columns, onchange, Templates.getColumnsOptions(template.id));
    List.addComboBox('sortby', R.SORTBY, template.sortby, onchange, "date DESC:Most Recent|date:Older First|name:Name|priority:Priority");
   
    List.addHeader("Auto Archive");
    List.addTextBox('archivedays', "Archive after nb days", template.archivedays, onchange, "numeric");
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
    list.push({ id: "formula", label: "Formula", tooltip: "Javascript formula field to compute value from other form values or any Upvise database record" });
    list.push({ id: "signature", label: R.SIGNATURE, tooltip: "Digital Signature field from phone" });
    if (User.hasApp("qhse")) list.push({ id: "risk", label: "Risk", tooltip: "Risk defined in the Knowledge Base Application. Each Risk has a set of control measures and probability / severity predefined" });

    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        Toolbox.addButton(item.label, "newFieldTemplate({templateId},{item.id})", item.tooltip);
    }
    Toolbox.show();
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
    var newValues = Utils.clone(template);
    newValues.name = name;
    newValues.counter = 0;
    newValues.date = Date.now();
    var newid = Query.insert("Forms.templates", newValues);

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
    History.redirect("Templates.viewTemplate({newid})");
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
