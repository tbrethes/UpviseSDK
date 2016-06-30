
//////////////////////////////////////

Forms.exportPdf = function (formid, action, email) {
    var form = Query.selectId("Forms.forms", formid);
    var template = Query.selectId("Forms.templates", form.templateid);

    var options = {};
    options.singleLine = AccountSettings.get("forms.columns") == "1";
    options.hideEmpty = AccountSettings.get("forms.hideempty") == "1";
    options.fontsize = AccountSettings.get("forms.fontsize");
    options.logoid = template.logoid;
    FormPdf.init(options);

    Pdf2.setWatermark(AccountSettings.get("forms.watermark"), AccountSettings.get("forms.watermarkcolor"));

    var filename = Forms.writePdf(form, template);

    // Download or Email
    Pdf2.setFilename(filename);
    if (action == "email") {
        var emails = Forms.getEmails(form);
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
    var fields = Forms.getFields(form);
    var addFormCaption = (AccountSettings.get('formcaption', '1') != "0");

    var title = (group != null) ? group.name + " - " + template.name : template.name;
    if (form.status == Forms.DRAFT) title += " " + R.DRAFT;

    var addLocation = AccountSettings.get("forms.pdflocation", "0") != "0" && form.geo != null && form.geo != '';

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

    FormPdf.addFields(fields, form);

    var punchs = Query.select("Forms.punchitems", "name;question;status", "formid={form.id}", "date");
    FormPdf.addPunch(punchs);

    var files = Query.select("System.files", "id;name", "linkedtable='Forms.forms' AND linkedrecid={form.id}", "date");
    FormPdf.addImages(R.PHOTOS, files);

    if (template.pdfnohistory == false) {
        var history = Forms.getHistory(form);
        FormPdf.addHistory(history);
    }

    var filename = template.name + " " + form.name;
    if (linkedItem != null && linkedItem.value != null) filename += "-" + linkedItem.value;
    filename += ".pdf";

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
