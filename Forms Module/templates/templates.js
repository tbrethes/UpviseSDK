
function Templates() { }
Templates.WORKFLOW = true;
Templates.SHARING = true;
Templates.DASHBOARD = true;
Templates.EXPORTPDF = true;

////////////////////////////////

Templates.deleteTemplate = function (id) {
    //Do not allow to delete a template if there are still linked forms
    var count = Query.count("Forms.forms", "templateid={id}");
    if (count == 0) {
        var fields = Query.select("Forms.fields", "id", "formid={id}");
        for (var i = 0; i < fields.length; i++) {
            Query.deleteId("Forms.fields", fields[i].id);
        }
        Query.deleteId("Forms.templates", id);
        History.back();
    } else {
        App.alert('Could not delete: forms still exist for this template!');
    }
}

Templates.getStateOptions = function (templateid) {
    var options = []; 
    options.push("-1:" + R.ALL);
    options.push("0:" + R.DRAFT);
    var states = Query.select("Forms.states", "status;name", "templateid={templateid}", "status");
    for (var i = 0; i < states.length; i++) {
        var state = states[i];
        options.push(state.status + ":" + state.name);
    }
    return options.join("|");
}

/////////////////////////////////////////////////

Templates.getFieldOptions = function () {
    var list = Templates.getFieldTypes();
    var options = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        options.push(item.id + ":" + item.label);
    }
    return options.join("|");
}

Templates.getFieldTypes = function () {
    var list = [];
    list.push({ id: "text", label: R.TEXTBOX });
    list.push({ id: "textarea", label: R.LONGTEXT });
    list.push({ id: "phone", label: R.PHONENUMBER });
    list.push({ id: "email", label: R.EMAIL });
    list.push({ id: "numeric", label: R.NUMERIC });
    list.push({ id: "decimal", label: R.DECIMAL });
    list.push({ id: "link", label: R.WEBLINK });
    list.push({ id: "currency", label: R.CURRENCY });
    list.push({ id: "readonly", label: "Read only" });

    list.push({ id: "select", label: R.COMBOBOX });
    list.push({ id: "selectmulti", label: R.MULTISELECT });
    list.push({ id: "toggle", label: R.QUESTION });
    list.push({ id: "checkbox", label: R.CHECKBOX });
    list.push({ id: "button", label: R.BUTTON });

    list.push({ id: "date", label: R.DATE });
    list.push({ id: "time", label: R.TIME });
    list.push({ id: "datetime", label: R.DATETIME });
    list.push({ id: "duration", label: R.DURATION });

    list.push({ id: "contact", label: R.CONTACT });
    list.push({ id: "company", label: R.COMPANY });
    list.push({ id: "user", label: R.USER });
    list.push({ id: "project", label: R.PROJECT });
    list.push({ id: "product", label: R.PRODUCT });
    list.push({ id: "opp", label: R.OPP });
    list.push({ id: "asset", label: R.ASSET });
    list.push({ id: "tool", label: R.EQUIPMENT });
    list.push({ id: "form", label: R.FORM });

    list.push({ id: "label", label: R.LABEL });
    list.push({ id: "score", label: "Score" });

    list.push({ id: "photo", label: R.PHOTO });
    list.push({ id: "signature", label: R.SIGNATURE });
    list.push({ id: "barcode", label: "Barcode" });
    list.push({ id: "header", label: R.SECTIONHEADER });


    list.push({ id: "formula", label: "Formula" });
    list.push({ id: "risk", label: "Risk" });
    list.push({ id: "drawing", label: "Drawing" });
    list.push({ id: "image", label: "Image" });
    return list;
}
