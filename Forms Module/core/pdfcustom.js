
//////////////

FormsPdf.MYNAME = "#MyName#";
FormsPdf.FORMNAME = "#FormName#";
FormsPdf.LINKEDNAME = "#LinkedName#";

FormsPdf.writeCustom2 = function (form, pdfid) {
    Pdf2.addTag("templateid", pdfid);

    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.formatValue(field.value, field.type, field.options);
        Pdf2.addTag(field.id, value);
    }
}

FormsPdf.writeCustom = function (form, template) {
    var html = FormsPdf.replaceCustom(template.htmlpdf, form, template);
    Pdf2.add(html);
}

FormsPdf.replaceCustom = function (content, form, template) {
    if (!content) return "";

    var output = content;
    // My Name
    output = output.replace(new RegExp(FormsPdf.MYNAME, 'g'), User.getName());
    // Form Name
    output = output.replace(new RegExp(FormsPdf.FORMNAME, 'g'), template.name + " " + form.name);
    // Linked Name
    var linkedItem = Forms.getLinkedRecord(form);
    var linkedvalue = (linkedItem != null && linkedItem.value != null) ? linkedItem.value : "";
    output = output.replace(new RegExp(FormsPdf.LINKEDNAME, 'g'), linkedvalue);

    var fields = Forms.getFields(form);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = CustomFields.formatValue(field.value, field.type, field.options);
        output = output.replace(new RegExp("#" + field.id + "#", 'g'), value);
    }

    // We may have remaining #XXX# ids left because some fields were hidden and not replaced, remove them from the output.
    output = output.replace(new RegExp("#([^#]+)#", 'g'), "");

    return output;
}

/// Custom Email that replaces the default email when sending a Form by PDF
FormsPdf.getCustomEmail = function (form, template) {
    var custom = { subject: "", body: "" };

    if (template.subject != "") custom.subject = FormsPdf.replaceCustom(template.subject, form, template);
    if (template.body != "") custom.body = FormsPdf.replaceCustom(template.body, form, template);
    return custom;
}