
//////////////// Templates

// regrouped by groupid
Templates.getTemplateMap = function(groupid) {
    var map = new HashMap();
    var where = "";
    if (groupid != null) where = "groupid={groupid}";
    var templates = Query.select("Forms.templates", "id;name;groupid", where, "name");
    for (var i = 0; i < templates.length; i++) {
        var template = templates[i];
        var obj = map.get(template.groupid);
        if (obj == null) {
            obj = { name: Query.names("Forms.groups", template.groupid), items: [] };
            map.set(template.groupid, obj);
        }
        obj.items.push(template);
    }
    map.keys.sort(function (key1, key2) { return map.get(key1).name < map.get(key2).name; });
    return map;
}

Templates.editTemplates = function(groupid) {
    Toolbar.addButton(R.NEWTEMPLATE, "Templates.newTemplate({groupid})", "new");
    Toolbar.setStyle("search");

    var map = Templates.getTemplateMap(groupid);
    for (var i = 0; i < map.keys.length; i++) {
        var key = map.keys[i];
        var obj = map.get(key);
        Templates.writeItems(obj.items, obj.name);
    }
    List.show();
}

Templates.writeItems = function (templates, title) {
    if (title != "") List.addHeader(title);
    for (var j = 0; j < templates.length; j++) {
        var template = templates[j];
        var fields = Query.select("Forms.fields", "_date", "formid={template.id}", "_date DESC");
        var subtitle = (fields.length > 0) ? Format.datetime(fields[0]._date) : R.NOFIELD;
        var style = "img:form";
        if (fields.length == 0) style += ";priority:" + Color.RED;
        List.addItemSubtitle(template.name, subtitle, "Templates.editTemplate({template.id})", style);
    }
}

Templates.newTemplate = function (groupid) {
    var name = App.prompt(R.NAME, "", "");
    if (name == "") return;

    var values =   {counter: 0, name:name };
    if (groupid != null) values.groupid = groupid;
    var id = Query.insert("Forms.templates", values);
    History.redirect("Templates.editTemplate({id})");
}

Templates.editTemplate = function(id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }
    var fields = Query.select("Forms.fields", "id;label;value;type;seloptions", "formid={id}", "rank");
    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";

    Toolbar.setTitle(R.EDITTEMPLATE);
    Toolbar.addButton(R.NEWFIELD, "Templates.newField({id})", "new");
    Toolbar.addButton(R.EDIT, "Templates.editTemplateInfo({id})", "edit");
    List.addItemTitle(template.name, template.prefix);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var title = "" + (i + 1) + ". " + field.label;
        List.addItemSubtitle(title, field.type, "Templates.editField({field.id})");
    }
    if (fields.length == 0) List.addButton(R.NEWFIELD, "Templates.newField({id})");
    List.show();
}

Templates.editTemplateInfo = function (id) {
    var template = Query.selectId("Forms.templates", id);
    if (template == null) { History.back(); return; }
    var onchange = "Query.updateId('Forms.templates',{id},this.id,this.value)";

    Toolbar.setTitle(R.EDITTEMPLATE);
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETETEMPLATE, "Templates.deleteTemplate({id})", "delete");
    List.addTextBox('name', R.NAME, template.name, onchange, 'required');
    List.addTextBox('prefix', R.PREFIX, template.prefix, onchange, 'text');
    if (Forms.getLinkedOptions != undefined) List.addComboBox('linkedtable', R.LINKEDREC, template.linkedtable, onchange, Forms.getLinkedOptions());
    List.addComboBox('groupid', R.GROUP, template.groupid, onchange, Query.options("Forms.groups"));
    List.addComboBoxMulti('owner', R.OWNER, template.owner, onchange, User.getOptions());
    if (typeof (Nfc) != "undefined") Nfc.addWriteItem("Forms.newForm({id})");
    List.show();
}
  

Templates.newField = function(templateid) {
    var fields = Query.select("Forms.fields", "rank;name", "formid={templateid}");
    var rank = 0;
    var fieldId = 0;
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var aRank = parseInt(field.rank);
        if (aRank > rank) rank = aRank;

        var aId = parseInt(field.name.substring(1)); // format is F[number]
        if (aId > fieldId) fieldId = aId;
    }
    rank++;
    fieldId++;
    var name = "F" + fieldId;
    var id = Query.insert("Forms.fields", {formid: templateid, type:'text', rank: rank, name: name});
    History.redirect("Templates.editField({id})");
}

Templates.editField = function(id) {
    var field = Query.selectId("Forms.fields", id);
    if (field == null) { History.back(); return; }
    var onchange = "Query.updateId('Forms.fields',{id},this.id,this.value)";
    Toolbar.setTitle(R.EDITFIELD);
    Toolbar.addButton(R.DELETEFIELD, "Templates.deleteField({id})", "delete");
    Toolbar.setStyle("edit");
    List.addTextBox('label', R.LABEL, field.label, onchange, 'required');
    List.addComboBox('type', R.TYPE, field.type, onchange + ";History.reload()", Templates.getFieldOptions());
    var type = field.type;
    if (type == 'select' || type == 'selectmulti' || type == 'toggle') List.addTextBox('seloptions', R.OPTIONS, field.seloptions, onchange, 'text');
    else if (type == 'button') List.addComboBox('value', "Action", field.value, onchange, "newtask:New Task|newnote:New Note|newevent:New Event");
    else if (type == 'label') List.addTextBox('value', "Value", field.value, onchange);
    else if (type == 'user') List.addComboBox('value', R.DEFAULTVALUE, field.value, onchange, ":Current user|empty:None");
    else if (type == 'date') List.addComboBox('value', R.DEFAULTVALUE, field.value, onchange, ":Today|empty:None");
    else if (type == 'time') List.addComboBox('value', R.DEFAULTVALUE, field.value, onchange, ":Current Time|empty:None");
    
    var fieldCount = Query.count("Forms.fields", "formid={field.formid}");
    var rankOptions = [];
    for (var i = 0; i < fieldCount; i++) rankOptions.push((i + 1) + ":Position " + (i + 1));
    List.addComboBox('rank', "Position", field.rank, "changeFieldRank({field.formid},{field.id},this.value)", rankOptions.join("|"));
    List.show();
}

function changeFieldRank(formid, fieldid, newrank) {
    var fields = Query.select("Forms.fields", "id;rank", "formid={formid}", "rank");
    // remove the field from the array
    for (var i = 0; i < fields.length; i++) {
        if (fields[i].id == fieldid) {
            var f = fields.splice(i, 1);
            // add it to the new pos
            fields.splice(newrank - 1, 0, f[0]);
            break;
        }
    }

    // recompute all ranks
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var rank = i + 1;
        Query.updateId("Forms.fields", field.id, "rank", rank);
    }
    History.reload();
}

Templates.deleteField = function(id) {
    Query.deleteId("Forms.fields", id);
    History.back();
}