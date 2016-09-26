
//////////////////////////////////////

Forms.exportPdf = function (formid, action, email) {
    var form = Query.selectId("Forms.forms", formid);
    var template = Query.selectId("Forms.templates", form.templateid);
    
    var options = {};
    options.singleLine = AccountSettings.get("forms.columns") == "1";
    options.hideEmpty = AccountSettings.get("forms.hideempty") == "1";
    options.fontsize = AccountSettings.get("forms.fontsize");
    options.logoid = template.logoid;
    options.columnWidth = template.columnwidth;

    FormPdf.init(options);

    Pdf2.setWatermark(AccountSettings.get("forms.watermark"), AccountSettings.get("forms.watermarkcolor"));

    var filename = Forms.writePdf(form, template);

    // Download or Email
    Pdf2.setFilename(filename);
    if (action == "email") {
        var emails = Forms.getEmails(form);
        var customemail = Forms.getCustomEmail(form, template);
        Pdf2.setCustomEmail(customemail.subject, customemail.body);
        Pdf2.email(emails);
    } else if (action == "archive") {
        // if fileid is set, pdf email archival will also store PDF file in the Files app in Upvise
        if (AccountSettings.get("forms.archivedb") == "1") Pdf2.setFileid(formid);

        Pdf2.archiveEmail(email);
    } else {
        Pdf2.download();
    }
}

Forms.writePdf = function (form, template) {

    var group = Query.selectId("Forms.groups", template.groupid);
    var linkedItem = Forms.getLinkedRecord != undefined ? Forms.getLinkedRecord(form) : null;

    var filename = template.name + " " + form.name;
    if (linkedItem != null && linkedItem.value != null) filename += "-" + linkedItem.value;
    filename += ".pdf";
    
    _valueObj = Forms._getValues(form); // we need these 2 lines because of dynamic scripting in formulas and options
    _formid = form.id;
    var addFormCaption = (AccountSettings.get('formcaption', '1') != "0");

    var title = (group != null) ? group.name + " - " + template.name : template.name;
    if (form.status == Forms.DRAFT) title += " " + R.DRAFT;

    var addLocation = AccountSettings.get("forms.pdflocation", "0") != "0" && form.geo != null && form.geo != '';

    if (template.htmlpdf != "") {
        Forms.writeCustomPdf(form, template);
        return filename;
    }

    Pdf2.startTitleBlock(title);
    if (addFormCaption) {
        Pdf2.addRow([R.FORMID, form.name, R.CREATEDBY, Forms.getCreator(form)]);
        if (addLocation) {
            Pdf2.addRow([R.DATE, Format.datetime(form.date), R.LOCATION, (form.address != '') ? form.address : form.geo]);
        } else {
            Pdf2.addRow([R.DATE, Format.datetime(form.date), "", ""]);
        }
        if (linkedItem != null) Pdf2.addRow([linkedItem.label, linkedItem.value, "", ""]);
    }
    Pdf2.stopTable();

    var fields = Forms.getFields(form);
    FormPdf.addFields(fields, form);

    var files = Query.select("System.files", "id;name", "linkedtable='Forms.forms' AND linkedrecid={form.id}", "date");
    FormPdf.addImages(R.PHOTOS, files);

    var punchs = Query.select("Forms.punchitems", "*", "formid={form.id}", "date");
    if (punchs.length > 0 && typeof (Punch) != "undefined") {
        Pdf2.addPageBreak();
        for (var i = 0; i < punchs.length; i++) {
            Punch.writePdf(punchs[i]);
        }
    }

    if (template.pdfnohistory == false) {
        var history = Forms.getHistory(form);
        FormPdf.addHistory(history);
    }

    return filename;
}

////////////////////////////

// try to find emails for the linked record of this form in contactid or custom fields
Forms.getEmails = function (form) {
    var emails = [];
    var map = new HashMap(); // key = email, to avoid duplicates
    var link = (form.linkedtable != "" && form.linkedid != "") ? Query.selectId(form.linkedtable, form.linkedid) : null;
    if (link == null) return;
    // if link is a contact or company, use the email field
    if (link.email != null && link.email != "" && checkEmailMap(map, link.email)) emails.push(link.email);

    // if the link is e.g. Project has a contactid, use it
    if (link.contactid != null && link.contactid != "") {
        var contacts = Query.selectIds("Contacts.contacts", link.contactid);
        for (var i = 0; i < contacts.length; i++) {
            var contact = contacts[i];
            if (contact.email != "" && checkEmailMap(map, contact.email)) emails.push(contact.email);
        }
    }
    return emails.join(";");
}

function checkEmailMap(map, email) {
    if (map.get(email) == null) {
        map.set(email, "1");
        return true;
    }
    return false;
}

//////////////

Forms.MYNAME = "#MyName#";
Forms.FORMNAME = "#FormName#";
Forms.LINKEDNAME = "#LinkedName#";

Forms.replaceCustom = function (content, form, template) {
    if (content == null || content == "") return content;

    var output = content;
    // My Name
    output = output.replace(new RegExp(Forms.MYNAME, 'g'), User.getName());
    // Form Name
    output = output.replace(new RegExp(Forms.FORMNAME, 'g'), template.name + " " + form.name);
    // Linked Name
    var linkedItem = Forms.getLinkedRecord(form);
    var linkedvalue = (linkedItem != null && linkedItem.value != null) ? linkedItem.value : "";
    output = output.replace(new RegExp(Forms.LINKEDNAME, 'g'), linkedvalue);

    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.formatValue(field.value, field.type, field.options);
        output = output.replace(new RegExp("#" + field.id + "#", 'g'), value);
    }

    return output;
}


Forms.writeCustomPdf = function (form, template) {
    var html = Forms.replaceCustom(template.htmlpdf, form, template);
    Pdf2.add(html);
}

/// Custom Email that replaces the default email when sending a Form by PDF
Forms.getCustomEmail = function (form, template) {
    var custom = { subject: "", body: "" };

    if (template.subject != "") custom.subject = Forms.replaceCustom(template.subject, form, template);
    if (template.body != "") custom.body = Forms.replaceCustom(template.body, form, template);

    return custom;
}
