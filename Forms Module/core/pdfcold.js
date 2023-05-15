
FormsPdf.exportCold = function(formid) {
    // capture the current form memory state, before generating the Form PDF, because it then calls Forms._getValues() which changes global _valuesObj variable.
    // then retore it at the end of the function
    var state = Forms.GET_STATE();

    // form object used in optional eval() below
    var form = Query.selectId("Forms.forms", formid);
    var template = Query.selectId("Forms.templates", form.templateid);
    if (template == null) {
        return; // ERROR : nothing to do...
    }
    
    var options = FormsPdf.getOptions(template);
    // We do not support custom pdf function for cold storage
    
    FormsPdf.init(options, form);
    FormsPdf.write(form, template);

    FormsPdf.setFilePath(form, template);
    Pdf2.setFileid(form.id);
    Pdf2.addTag("archive", "1");   
    
    // implemented on server only
    Pdf2.save();

    Forms.RESTORE_STATE(state);
}

FormsPdf.setFilePath = function(form, template) {  
    // Set Cold Stoage Path
    let linkedItem = Forms.getLinkedRecord(form, true);
    let parts = [];
    if (linkedItem && linkedItem.label) {
        parts.push(linkedItem.label);
        let value = linkedItem.value;
        if (!value) value = "NONE";
        parts.push(value); 
    } else {
        parts.push(R.FORM);
    }
    parts.push(template.name);
    parts.push(form.name);

    Pdf2.setFilePath(parts);
}