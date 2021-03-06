
if (typeof (Forms) === "undefined") {
    // This is super wierd but if we use the line commented below, on Safari, it resets the Forms class and the left pane does not work when Forms > Files....
    //function Forms() { }
    var Forms = new function () { }
}

// 11/13/20: Moved from workflow.js
Forms.REJECTED = -1;
Forms.DRAFT = 0;

//////////////////////////// Form Creation

Forms.newForm = function (templateid, linkedtable, linkedid, remove, name, projectid, counterid) {
    if (remove == 1) History.remove(1);

    // we auto link job, assets, tools and subforms linked forms to project for standard user ownership...
    if (!projectid && (linkedtable == "Jobs.jobs" || linkedtable == "Projects.assets" || linkedtable == "Tools.tools")) {
        var linkedItem = Query.selectId(linkedtable, linkedid);
        if (linkedItem) projectid = linkedItem.projectid;
    }
    // 23 April 2021, we also try to link form to toolid
    var toolid;
    if (linkedtable == "Tools.tools") {
        toolid = linkedid;
    }
    
    // link subform to the projectid of the main form for standard user ownership. 11/01/21
    if (!projectid && linkedtable == "Forms.forms") {
        var parentFormId =  linkedid.split(":")[0];
        var parentForm = Query.selectId("Forms.forms", parentFormId);
        if (parentForm) {
            if (parentForm.linkedtable == "Projects.projects") projectid = parentForm.linkedid;
            else if (parentForm.linkedtable == "Tools.tools") toolid = parentForm.linkedid;
            else projectid = parentForm.projectid;
        } 
    }

    var id = Forms.newFormInternal(templateid, linkedtable, linkedid, null, name, projectid, counterid, toolid);
    if (id != null) {
        if (linkedtable != "Forms.forms") History.add(Forms._VIEWFORM + "({id})");
        History.redirect(Forms._EDITFORM +  "({id})");
    }
}

// counterid is used by Novade for custom counter app-level formating
Forms.newFormInternal = function (templateid, linkedtable, linkedid, values, name, projectid, counterid, toolid) {
    var template = Query.selectId("Forms.templates", templateid);
    if (template == null) return null;

    // 11/09/20 : Added to support server-side auto numbering counter in forms
    if (counterid == null && AccountSettings.get("forms.autocounter") == 1) {
        counterid = "" + templateid + ":6";
    }
    var form = {};
    form.name = name ? name : Forms.getNewName(templateid, counterid);
    form.templateid = templateid;
    form.date = Date.now();
    form.owner = User.getName();
    form.geo = Settings.getLocation();
    // TBR April 29, 2019 : we stopped getting the addresse because it is synchronous and delays too much when slow network
    //form.address = Settings.getAddress(form.geo);
    if (linkedtable != null) {
        form.linkedtable = linkedtable;
        form.linkedid = linkedid;
    } else {
        form.linkedtable = template.linkedtable;
    }
    if (projectid) form.projectid = projectid;
    if (counterid) form.counterid = counterid;
    if (toolid) form.toolid = toolid;
    
    form.hidden = Forms.getDefaultHidden(template.id);

    
    var formid = Query.insert("Forms.forms", form);
    // Warning : setDefaultValues needs form.id for drawing duplication
    _formid = formid;
    form.id = formid;
    if (values == null) values = {}; // must be an object not array for stringify
    Forms.setDefaultValues(form, values, Forms.DRAFT);
    Query.updateId("Forms.forms", formid, "value", JSON.stringify(values));
    if (template.oncreate) Forms.injectCode(template.oncreate, form, "ONCREATE_" + template.name);
    
    return form.id;
}

Forms.newPlanFormInternal = function (templateid, fileid, geo, linkedtable, linkedid, projectid, name, counterid) {
    var template = Query.selectId("Forms.templates", templateid);
    if (template == null) return null;

    // 11/09/20 : Added to support server-side auto numbering counter in forms
    if (counterid == null && AccountSettings.get("forms.autocounter") == 1) {
        counterid = "" + templateid + ":6";
    }
    var form = {};
    form.name = name ? name : Forms.getNewName(templateid, counterid);
    form.templateid = templateid;
    form.date = Date.now();
    form.owner = User.getName();
    if (projectid) form.projectid = projectid;
    if (counterid) form.counterid = counterid;

    form.planid = fileid;
    form.geo = geo

    var file = Query.selectId("System.files", fileid);
    if (linkedtable == null && linkedid == null && file != null) {
        linkedid = file.linkedrecid;
        linkedtable = file.linkedtable;
        if (linkedtable == "unybiz.projects.projects") linkedtable = "Projects.projects";
    }

    form.linkedtable = linkedtable;
    form.linkedid = linkedid;

    // if no linked table and id, try to get it from the file itself
    var file = Query.selectId("System.files", fileid);
    if (form.linkedtable == null && form.linkedid == null && file != null) {
        var linkedtable = file.linkedtable;
        if (linkedtable == "unybiz.projects.projects") linkedtable = "Projects.projects";
        form.linkedtable = linkedtable;
        form.linkedid = file.linkedrecid;
    }
    form.hidden = Forms.getDefaultHidden(template.id);

    var formid = Query.insert("Forms.forms", form);
    // Warning : setDefaultValues needs form.id for drawing duplication
    form.id = formid;
    var values = {}; // must be an object not array for stringify
    Forms.setDefaultValues(form, values, Forms.DRAFT);
    Query.updateId("Forms.forms", formid, "value", JSON.stringify(values));
  
    if (template.oncreate) {
        _formid = form.id;
        Forms.injectCode(template.oncreate, form,  "ONCREATE_" + template.name);
    }
    return form.id;
}

Forms.getNewName = function (templateid, counterid) {
    var template = Query.selectId("Forms.templates", templateid);
    var counter;

    if (counterid) {
        counter = "[NEW]";
    } else {
        var counter = 1 + template.counter;
        Query.updateId("Forms.templates", templateid, "counter", counter);
    }

    if (AccountSettings.get("forms.initials") == "1") {
        counter = User.getInitials() + "-" + counter;
    }
    return template.prefix + (template.prefix != "" ? "-" : "") + counter;
}

Forms.setDefaultValues = function (form, values, status) {
    var where = "status={status} AND formid={form.templateid}";
    var fields = Query.select("Forms.fields", "name;label;value;type", where, "rank");
    var fieldsall = Query.select("Forms.fields", "name;label;value;type", "status=-1 AND formid={form.templateid}", "rank");
    fields = fields.concat(fieldsall);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = values[field.name];
        if (value == null) {
            if (field.type == "drawing") {
                value = field.value ? App.duplicatePicture(field.value, "Drawing " + new Date().toLocaleString()) : "";
                values[field.name] = value;
                // TODO :  add linkedtable and linkedid as params in App.duplicatePicture
                if (value && form.id) {
                    // Note during form creation, there is no form.id yet,
                    // but during workflow state change, form.id is present
                    Query.updateId("System.files", value, "linkedtable", "Forms.forms");
                    Query.updateId("System.files", value, "linkedrecid", form.id + ":" + field.name);
                }
            } else if (field.type == "risk") {
                var risk = Query.selectId("Qhse.risks", field.label);
                if (risk != null) {
                    values[field.name + "S"] = risk.severity;
                    values[field.name + "P"] = risk.probability;
                }
            } else if (field.type != "header" && field.type != "label"  && field.type != "button" && field.type != "formula") {
                value = Forms._eval(field.value, form, "DEFAULTVALUE_" + field.name); // to use javacript:// feature
                if (value != "") values[field.name] = value;
            }
        }
    }
}

// Added May 6th, 2021
Forms.linkDrawingsToForm = function(form) {
    var values = JSON.parse(form.value);
    var fields = Query.select("Forms.fields", "name", "type='drawing' AND formid={form.templateid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var fileid = values[field.name];
        if (fileid) {
            // Add linkedtable and linkedrecid to give form owners access to these files
            Query.updateId("System.files", fileid, "linkedtable", "Forms.forms");
            Query.updateId("System.files", fileid, "linkedrecid", form.id + ":" + field.name);
        }
    }
}

Forms.getDefaultHidden = function (templateid) {
    var hiddenFields = Query.select("Forms.fields", "name", "formid={templateid} AND hidden=1");
    var array = [];
    for (var i = 0; i < hiddenFields.length; i++) {
        var field = hiddenFields[i];
        array.push(field.name);
    }
    return JSON.stringify(array);
}

/////////////////////

Forms.deleteForm = function(formid, goBack) {
    var form = Query.selectId("Forms.forms", formid);
    var files = Forms.selectFormPhotos(form);
    for (var i = 0; i < files.length; i++) {
        Query.deleteId("System.files", files[i].id);
    }
    var subforms = Forms.selectSubForms(form);
    for (var i = 0; i < subforms.length; i++) {
        Query.deleteId("Forms.forms", subforms[i].id);
    }

    Query.deleteId("Forms.forms", formid);
    if (!(goBack === false)) History.back();
}

///////////////////// Duplicate

Forms.duplicateForm = function (id, counterid) {
    var form = Query.selectId("Forms.forms", id);
    var newid = Forms.duplicateInternal(form, form.linkedid, counterid);

    // Also duplicate all sub forms if any
    var subforms = Forms.selectSubForms(form);
    for (var i = 0; i < subforms.length; i++) {
        var subform = subforms[i];
        // make the new subform linkedid : first part is the new parent form id, second part is field name stays the same
        var parts = subform.linkedid.split(":");
        parts[0] = newid;
        var linkedid = parts.join(":");
        Forms.duplicateInternal(subform, linkedid, counterid);
    }

    History.add(Forms._VIEWFORM + "({newid})");
    History.redirect(Forms._EDITFORM + "({newid})");
}


Forms.duplicateInternal = function (form, linkedid, counterid) {
    // 10/03/21 : Added to support server-side auto numbering counter in forms
    if (counterid == null && AccountSettings.get("forms.autocounter") == 1) {
        counterid = "" + form.templateid + ":6";
    }

    var form2 = {};
    form2.templateid = form.templateid;
    form2.status = Forms.DRAFT;
    form2.name = (form.linkedtable != "Forms.forms") ? Forms.getNewName(form.templateid, counterid) : form.name;
    form2.owner = User.getName();
    form2.date = Date.now();
    if (form.planid) {
        form2.planid = form.planid;
        form2.geo = form.geo;
    } else {
        form2.geo = Settings.getLocation();
        form2.address = Settings.getAddress(form.geo);
    }
    form2.linkedtable = form.linkedtable;
    form2.linkedid = linkedid;
    if (form.projectid) form2.projectid = form.projectid;
    if (counterid) form2.counterid = counterid;
    form2.hidden = form.hidden;
    form2.priority = form.priority;

    var values2 = JSON.parse(form.value);
    var fields = Query.select("Forms.fields", "name;type", "formid={form.templateid}", "rank");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type == "photo" || field.type == "signature") {
            values2[field.name] = "";
        }
    }
    form2.value = JSON.stringify(values2);
    return Query.insert("Forms.forms", form2);
}

//////////////////////////////////

Forms.selectFormPhotos = function (form) {
    var files = [];
    var fields = Query.select("Forms.fields", "name", "formid={form.templateid} AND type IN ('photo','drawing')");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = form.id + ":" + field.name; // hack for photos.....
        var list = Query.select("System.files", "*", "linkedtable='Forms.forms' AND linkedrecid={value}", "date");
        files = files.concat(list);
    }
    return files;
}

Forms.selectSubForms = function (form) {
    var subforms = [];
    var fields = Query.select("Forms.fields", "name", "type='button' AND value='newsubform' AND formid={form.templateid}");
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var linkedid = form.id + ":" + field.name;
        var list = Query.select("Forms.forms", "*", "linkedtable='Forms.forms' AND linkedid={linkedid}", "date");
        subforms = subforms.concat(list);
    }
    return subforms;
}

////////////////////////////////////////////////////////////////////

Forms.editAddress = function (id) {
    var form = Query.selectId("forms", id);
    if (form == null) { History.back(); return; }
    var onchange = "Query.updateId('forms',{id},this.id,this.value)";

    Toolbar.setStyle("edit");
    List.forceNewLine = true;
    List.addTextBox('date', R.DATE, form.date, onchange, "datetime");
    List.addComboBoxMulti('owner', R.OWNER, form.owner, "Forms.changeOwner({id},this.value)", User.getOptions());
    List.addTextBox('address', R.ADDRESS, form.address, onchange);
    List.addTextBox('geo', R.POSITION, form.geo, onchange);
    List.show();
}


Forms.changeOwner = function (id, owner) {
    var form = Query.selectId("Forms.forms", id);
    var files = Forms.selectFormPhotos(form);
    var subforms = Forms.selectSubForms(form);
    Query.updateId("Forms.forms", id, "owner", owner);
    // change the owner of the photos linked to the form too.
    for (var i = 0; i < files.length; i++) {
        Query.updateId("System.files", files[i].id, "owner", owner);
    }
    // same for subforms
    for (var i = 0; i < subforms.length; i++) {
        Query.updateId("Forms.forms", subforms[i].id, "owner", owner);
    }
}

/////////////////////

Forms.archiveForm = function (id, confirm) {
    if (confirm === true) {
        if (App.confirm("Confirm Archive") == false) return;
    }

    var form = Query.selectId("Forms.forms", id);
    var files = Forms.selectFormPhotos(form);
    for (var i = 0; i < files.length; i++) {
        Query.archiveId("System.files", files[i].id);
    }
    Query.archiveId("Forms.forms", id);

    // Also archive SubForms
    var subforms = Forms.selectSubForms(form);
    for (var i = 0; i < subforms.length; i++) {
        Forms.archiveForm(subforms[i].id, false);
    }

    if (confirm === true) History.back();
}

///////////////////

Forms.popupResetSignature = function (formid, fieldid) {
    Popup.add("Reset", "Forms.resetSignature({formid},{fieldid})", "img:delete");
    Popup.show();
}

Forms.resetSignature = function (formid, fieldid) {
    if (App.confirm(R.CONFIRM) == false) return;
    var form = Query.selectId("Forms.forms", formid);
    if (form == null) return;
    var values = JSON.parse(form.value);
    values[fieldid] = "";
    Query.updateId("Forms.forms", formid, "value", JSON.stringify(values));
    Query.updateId("Forms.forms", formid, "status", 0); // set back to draft
    History.reload();
}
