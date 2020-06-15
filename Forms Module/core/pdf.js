//////////////////////////////////////

function FormsPdf() {}

FormsPdf.export = function (formid, action, email, subject, body) {

    // capture the current form memory state, before generating the Form PDF, because it then calls Forms._getValues() which changes global _valuesObj variable.
    // then retore it at the end of the function
    var state = Forms.GET_STATE();

    var form = Query.selectId("Forms.forms", formid);
    var template = Query.selectId("Forms.templates", form.templateid);
    
    var pdfoptions = FormsPdf.getOptions(template);

    FormsPdf.init(pdfoptions);
    
    var filename = FormsPdf.write(form, template);

    // Download or Email
    Pdf2.setFilename(filename);
    
    if (action == "email") {
        var emails = email ? email : FormsPdf.getEmails(form);
        Pdf2.subject = subject ? subject : FormsPdf.replaceCustom(template.subject, form, template);
        Pdf2.body = body ? body : FormsPdf.replaceCustom(template.body, form, template);
        Pdf2.email(emails);
    } else if (action == "archive") {
        // if fileid is set, pdf email archival will also store PDF file in the Files app in Upvise
        if (AccountSettings.get("forms.archivedb") == "1") Pdf2.setFileid(formid);
        var subject = "Archive: " + User.getName() + " " + Pdf2.filename;
        Pdf2.archiveEmail(email, subject);
    } else if (action == "serveremail") {
        // difference with "email" is that email is sent automatically by the server, there is no UI for the user to validate and click Send
        Pdf2.archiveEmail(email, subject, body);
    }
    else {
        Pdf2.download();
    }

    Forms.RESTORE_STATE(state);
}

FormsPdf.getOptions = function (template) {
    if (template.pdfoptions) {
        return JSON.parse(template.pdfoptions);
    } else {
        var options = {};
        options.columns = AccountSettings.get("forms.columns", "1");
        options.fontsize = AccountSettings.get("forms.fontsize", "1.4em");
        options.hideempty = AccountSettings.get("forms.hideempty", "0");
        options.location = AccountSettings.get("forms.pdflocation", "0");
        options.caption = AccountSettings.get('formcaption', "1");
        options.watermark = AccountSettings.get("forms.watermark", "");
        options.watermarkcolor = AccountSettings.get("forms.watermarkcolor", "#FF000000");
        options.logoid = template.logoid;
        options.columnwidth = template.columnwidth ? template.columnwidth : "500px";
        options.nohistory = template.pdfnohistory;
        options.excelid = "";
        options.photoheight = "300px";
        options.photocaption = true;

        Query.updateId("Forms.templates", template.id, "pdfoptions", JSON.stringify(options));
        return options;
    }
}


/////////////////////

FormsPdf.init = function (options) {
    if (options == null) options = {};

    Pdf2.init(options.fontsize);
    Pdf2.setWatermark(options.watermark, options.watermarkcolor);
    if (options.logoid != "#none") Pdf2.setHeader(options.logoid);
    if (options.footer) Pdf2.setFooter(options.footer);
    if (options.footerid) Pdf2.footerid = options.footerid;
    if (options.orientation) Pdf2.orientation = options.orientation;

    Pdf2.addStyle("TABLE.form", "width:100%;border-collapse:collapse;border:1px solid #AAA;padding:0;margin-top:1em;margin-bottom:1em;");
    Pdf2.addStyle("TABLE.form TD", "padding:0.4em;padding-left:1em;padding-right:1em;vertical-align:top;border:1px solid #AAA;min-width:30px;text-align:left;");
    Pdf2.addStyle("TABLE.form THEAD TR TD", "font-weight:bold;background-color:rgba(204, 204, 204, 0.5)");
    Pdf2.addStyle("TABLE.form TR.punch TD", "width:auto");

    ////////////////

    Pdf2.addStyle("TABLE.form TR.history TD", "width:33%");
    Pdf2.addStyle("TD.checkbox SPAN", "vertical-align:middle");
    Pdf2.addStyle("TD.checkbox SPAN.bigger", "font-size:1.5em;padding-right:0.5em;");
}

FormsPdf.addStyle = function (template) {
    var options = FormsPdf.getOptions(template);
    Pdf2.singleline = (options.columns == "1");
    Pdf2.hideempty = (options.hideempty == "1");
    Pdf2.fieldIndex = -1;
    Pdf2.photoheight = options.photoheight ? options.photoheight : "300px";
    Pdf2.photocaption = (options.photocaption == "0") ? false : true;

    if (options.headercolor && options.headercolor != "#000000") {
        var labelbackcolor = Color.opacity(options.headercolor, 0.2);
        Pdf2.addStyle("TABLE.t" + template.id + " THEAD TR TD", "color:white;background-color:" + options.headercolor);
        Pdf2.addStyle("TABLE.t" + template.id + " TD.label", "background-color:" + labelbackcolor);

        Pdf2.addStyle("TABLE.subt" + template.id + " THEAD TR TD", "color:white;background-color:" + options.headercolor);
        Pdf2.addStyle("TABLE.subt" + template.id + " tr:nth-child(even)", "background-color:" + labelbackcolor);
    }

    if (Pdf2.singleline) {
        Pdf2.addStyle("TABLE.t" + template.id + " TD:nth-child(1)", "width:" + options.columnwidth);
    } else {
        Pdf2.addStyle("TABLE.t" + template.id + " TD:nth-child(1)", "width:" + options.columnwidth);
        Pdf2.addStyle("TABLE.t" + template.id + " TD:nth-child(3)", "width:" + options.columnwidth);
    }
    return options;
}

FormsPdf.write = function (form, template, index) {
    var linkedItem = Forms.getLinkedRecord != undefined ? Forms.getLinkedRecord(form) : null;

    var filename = template.name + " " + form.name;
    if (linkedItem && linkedItem.value) filename += "-" + linkedItem.value;
    filename += ".pdf";

    
    var title = index ? index + " " : "";
    if (AccountSettings.get("forms.pdfgroup") == "1") {
        var name = Query.names("Forms.groups", template.groupid);
        if (name) title = name + " - ";
    }
    title += template.name;

    var _CURRENT_VALUES = _valueObj;

    // we need these 2 lines because of dynamic scripting in formulas and options, when we call Forms.getFields() and in writeCustom(
    _valueObj = Forms._getValues(form);
    _formid = form.id;
    var fields = Forms.getFields(form);

    if (template.htmlpdf != "") {
        FormsPdf.writeCustom(form, template);

        _CURRENT_VALUES = _valueObj;
        return filename;
    }
  
    var options = FormsPdf.addStyle(template);

    if (options.pdfid && options.pdfid.length > 0) {
        FormsPdf.writeCustom2(form, options.pdfid);
        return filename;
    }
    Pdf2.add('<span id="', form.id, '" />');
    var headerColor = form.color ? form.color : options.headercolor;
    Pdf2.startTitleBlock(title, headerColor);
    if (options.caption == "1") {
        var creator = Forms.getCreator(form);
        if (form.status == Forms.DRAFT) creator += " [" +  R.DRAFT + "]";
        Pdf2.addRow([R.CREATEDBY, creator, R.DATE, Format.datetime(form.date)]);

        var values = [R.FORMID, form.name];
        if (linkedItem) values.push(linkedItem.label, linkedItem.value)
        else values.push("", "");
        Pdf2.addRow(values);
        var values2 = [];
        if (template.version) values2.push("Version", template.version);
        if (options.location == "1" && form.address) values2.push(R.LOCATION, form.address);
        if (values2.length > 0) {
            if (values2.length == 2) values2.push("", "");
            Pdf2.addRow(values2);
        }
    }
    Pdf2.stopTable();

    FormsPdf.addFields(fields, form);

    var punchs = Query.select("Forms.punchitems", "*", "formid={form.id}", "creationdate");
    if (punchs.length > 0 && typeof (Punch) != "undefined") {
        Pdf2.addHeader(R.PUNCHITEMS, "text-align:center;font-size:20px;margin-top:20px;margin-bottom:20px;");
        for (var i = 0; i < punchs.length; i++) {
            Punch.writePdf(punchs[i], i + 1, {link:false});
        }
    }

    if (options.nohistory == false) {
        var history = Forms.getHistory(form);
        FormsPdf.addHistory(history);
    }

    return filename;
}

////////////////////////////

// try to find emails for the linked record of this form in contactid or custom fields
FormsPdf.getEmails = function (form) {
    var emails = [];
    var map = new HashMap(); // key = email, to avoid duplicates
    var link = Forms._getLink(form);
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

FormsPdf.addFields = function (fields, form) {
    var headerToWrite = null;

    for (var j = 0; j < fields.length; j++) {
        var field = fields[j];

        // hidden fields not belonging to the form workflow state
        if (form.status < field.status && form.status != -1) continue;

        if (FormsPdf.isFieldHidden(field) == true) continue;
        if (field.type == "header") {
            FormsPdf.stop();
            if (field.value == "1") Pdf2.addPageBreak();
            headerToWrite = field.label;
            if (headerToWrite == "") headerToWrite = "&nbsp;";
        } else {
            if (headerToWrite != null) {
                // delayed header write only if there are fields below....
                Pdf2.add('<table class="form t', form.templateid, '"><thead><tr><td colspan=4>', headerToWrite, '</td></tr></thead>');
                Pdf2.fieldIndex = 0;
                headerToWrite = null;
            }

            if (field.type == "drawing" || field.type == "image") {
                FormsPdf.stop();
                Pdf2.add('<table class="form t', form.templateid, '"><thead><tr><td colspan=4>', field.label, '</td></tr></thead></table>');
                //Pdf2.addHeader(field.label);
                Pdf2.addImage(field.value, null);
            } else if (field.type == "button" && field.value == "newsubform") {
                FormsPdf.stop();
                var linkedid = form.id + ":" + field.id;
                var subTemplate = Query.selectId("Forms.templates", field.options);
                var sortby = (subTemplate != null && subTemplate.sortby) ? subTemplate.sortby : "date";
                var subforms = Query.select("Forms.forms", "*", "linkedtable='Forms.forms' AND linkedid=" + esc(linkedid), sortby);
                FormsPdf.addSubFormsTable(subforms, form.templateid);
            } else if (field.type != "label" || (field.type == "label" && field.value == "1")) {
                FormsPdf.addField(field, form);
            }
        }
    }
    FormsPdf.stop();
}

FormsPdf.addSubFormsTable = function (subforms, parentTemplateid) {
    if (subforms.length == 0) return;

    var asList = false;
    if (subforms.length > 0) {
        var subtemplate = Query.selectId("Forms.templates", subforms[0].templateid);
        var subpdfoptions = FormsPdf.getOptions(subtemplate);
        var asList = (subpdfoptions.subformlist == "1");
    }
    if (asList == true) {
        for (var i = 0; i < subforms.length; i++) {
            var subform = subforms[i];
            var template = Query.selectId("Forms.templates", subform.templateid);
            Pdf2.addPageBreak();
            FormsPdf.write(subform, template, (i+1));
        }
        return;
    }

    var photos = [];

    // remember the current form state (coming from +valueObj ....)
    // we can then use Forms.getFields() and we restore the state at the end of this function
    var state = Forms.GET_STATE();
 
    for (var i = 0; i < subforms.length; i++) {
        var subform = subforms[i];
        _valueObj = Forms._getValues(subform);
        _formid = subform.id;
        var fields = Forms.getFields(subform);

        var header = [];
        var values = [];
        for (var j = 0; j < fields.length; j++) {
            var field = fields[j];
            if (field.type == "photo") {
                var files = Query.select("System.files", "id;name;mime", "linkedtable='Forms.forms' AND linkedrecid=" + esc(field.value), "date");
                photos = photos.concat(files);
            } else if (field.type != "button" && field.type != "label" && field.type != "header") {
                var value = CustomFields.formatValue(field.value, field.type, field.options, true); // isWeb=true
                if (field.type == "longtext") value = Format.text(value);
                header.push(field.label);
                values.push(value);
            }
        }
        if (i == 0) Pdf2.startTable(header, null, "form subt" + parentTemplateid);
        Pdf2.addRow(values);
    }
    Pdf2.stopTable();

    // Add subform photos
    if (photos.length > 0) Pdf2.addImages(null, photos, Pdf2.photoheight);

    // restore the current form state (we changed it with valueObj = xxx)
    Forms.RESTORE_STATE(state);
}

FormsPdf.isFieldHidden = function (field) {
    // buttons are hidden except for subforms
    if (field.type == "button" && field.value != "newsubform") return true;

    return (Pdf2.hideempty == true && field.type != "header" && field.value == "");
}

FormsPdf.ensureNewLine = function () {
    if (Pdf2.fieldIndex % 2 == 1) {
        Pdf2.add('<td class=label></td><td></td></tr><tr>');
        Pdf2.fieldIndex++;
    }
}

FormsPdf.stop = function () {
    if (Pdf2.fieldIndex == -1) return;
    if (Pdf2.fieldIndex % 2 == 1) Pdf2.add('<td class=label></td><td></td>');
    Pdf2.add('</table>');
    Pdf2.fieldIndex = -1;
}

FormsPdf.addField = function (field, form) {
    if (Pdf2.fieldIndex == -1) {
        Pdf2.add('<table class="form t', form.templateid, '"><tr>');
        Pdf2.fieldIndex = 0;
    } else if (Pdf2.fieldIndex % 2 == 0) Pdf2.add('</tr><tr>');

    if (field.type == "label") {
        var label = field.label.split("\n").join("<br/>");
        if (Pdf2.singleline == true) {
            Pdf2.add('<td class="label" colspan=2>', label, '</td>');
        } else {
            FormsPdf.ensureNewLine();
            Pdf2.add('<td class="label" colspan=4>', label, '</td>');
            Pdf2.fieldIndex++;
        }
    } else if (field.type == "photo") {
        var files = Query.select("System.files", "*", "linkedtable='Forms.forms' AND linkedrecid=" + esc(field.value), "date");
        if (files.length == 0) return;

        if (Pdf2.singleline == true) {
            Pdf2.add('<td colspan=2>');
        } else {
            FormsPdf.ensureNewLine();
            Pdf2.add('<td colspan=4>');
        }

        var height = (field.options == "scan") ? null : Pdf2.photoheight;
        Pdf2.addImages(field.label, files, height);
        Pdf2.add('</td>');
        if (Pdf2.singleline == false) Pdf2.fieldIndex++;
    } else if (field.type == "textarea") {
        if (Pdf2.singleline == true) {
            Pdf2.add('<td class="label">', field.label, '</td><td>', field.value, '</td>');
        } else {
            FormsPdf.ensureNewLine();
            Pdf2.add('<td class="label">', field.label, '</td><td colspan=3>', field.value, '</td>');
            Pdf2.fieldIndex++;
        }
    } else if (field.type == "signature") {
        Pdf2.add('<td colspan=2>');
        Pdf2.addSignature(field.label, field.value);
        Pdf2.add('</td>');
    } else if (field.type == "risk") {
        var values = JSON.parse(form.value);
        var valueP = values[field.id + "P"];
        var valueS = values[field.id + "S"];
        var proba = "Probability: " + Risk.format(valueP);
        var sev = "Severity: " + Risk.format(valueS);
        var measures = (Format.options != null) ? Format.options(field.value, field.value) : field.value;
        Pdf2.add('<td>Risk: ', field.label, '</td><td>Control Measures:', measures, '<br/>');
        Pdf2.add('<span style="', Risk.getColorStyle(valueP), '">', proba, '</span> <span style="', Risk.getColorStyle(valueS), '">', sev, '</span></td>');
    } else if (field.type == "checkbox") {
        var c = (field.value == "1") ? '&#9745;' : '&#9744;';
        Pdf2.add('<td colspan=2 class="checkbox"><span class="bigger">', c, '</span><span>', field.label, '</span></td>');
    } else {
        var value = CustomFields.formatValue(field.value, field.type, field.options, true); // isWeb=true
        Pdf2.add('<td class="label">', field.label, '</td><td>', value, '</td>');
    }

    var increment = (Pdf2.singleline == true) ? 2 : 1;
    Pdf2.fieldIndex += increment;
}

FormsPdf.formatToggle = function (value, label) {
    value = value ? String(value) : "";
    var color = "";
    if (value == "1") color = Color.GREEN;
    else if (value == "11") color = Color.BLUE;
    else if (value == "2" || value == "3") color = Color.YELLOW;
    else if (value == "4" || value == "P") color = Color.ORANGE;
    else if (value == "0" || value == "5") color = Color.RED;
    else if (value.startsWith("#")) color = value;
    else color = Color.BLUE;
    return '<span style="padding:4px;border-radius:5px;font-weight:bold;color:white;background-color:' + color + '">' + value + '</span>';
}

FormsPdf.addHistory = function (history) {
    for (var i = 0; i < history.length; i++) {
        var item = history[i];
        var signature = "";
        if (item.signature != "") signature = '<img height="50" src="data:image/png;base64,' + item.signature + '" />';

        Pdf2.add("<table class=form>");
        Pdf2.add("<tr><td colspan=3 class=header>", item.name, "</td></tr>");
        if (item.note != "") Pdf2.add('<tr><td class="label" colspan=3>', item.note, "</td></tr>");
        Pdf2.add("<tr class=history><td>", R.NAME, ":<br><b>", item.staff, "</b></td><td>", R.DATE, ":<br/><b>", Format.datetime(item.date), "</b></td><td>", R.SIGNATURE, ": ", signature, '</td></tr>');
        Pdf2.add("</table>");
    }
}

FormsPdf.addPunch = function (items) {
    if (items.length == 0) return;

    Pdf2.addPageBreak();
    Pdf2.addHeader(R.PUNCHITEMS);
    Pdf2.startTable([R.PUNCHITEM, R.ASSET, R.DATE, R.STATUS, R.ASSIGNEDTO], [null, null, null, null]);
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var asset = Query.selectId("assets", item.assetid);
        var assetname = (asset != null) ? asset.model + " " + asset.name : "";
        var name = item.name;
        if (item.question != "") name += "<br/><small>" + "Related to:" + item.question + "</small>";
        var status = Punch.formatStatus(item.status);
        Pdf2.addRow([name, assetname, Punch.formatDate(item), status, item.owner]);
    }
    Pdf2.stopTable();
}


