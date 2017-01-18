///////////// EDIT STEPS

function writeStepSection(steps, onEdit) {
    List.addHeader([R.STEPS, "", ""], null, "product");
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        var left = (i + 1) + ". " + step.name;
        var by = Query.names("roles", step.roleid);
        List.add([left, by, ""], onEdit + "({step.id})");
    }
}

function editSteps(procid) {
    Toolbar.addButton(R.NEWSTEP, "newStep({procid})");
    var steps = Query.select("Qhse.steps", null, "procedureid={procid}", "rank");
    writeStepSection(steps, "editStep");
    List.show();
}

function viewStep(id) {
    var step = Query.selectId("Qhse.steps", id);
    if (step == null) { History.back(); return; }
    var proc = Query.selectId("Qhse.procedures", step.procedureid);

    if (User.canEdit(step.owner)) Toolbar.addButton(R.EDIT, "editStep({id})");
    
    Toolbar.setTitle(proc.name);
    List.addItemTitle(step.rank + ". " + step.name);
    List.addItemLabel("Performed By: ", Query.names("roles", step.roleid));
    List.addItemLabel(R.DESCRIPTION, step.description);
    List.show();
}

function newStep(procid) {
    var steps = Query.select("Qhse.steps", null, "procedureid={procid}", "rank");
    var rank = 0;
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.rank > rank) rank = step.rank;
    }
    rank++;
    var id = Query.insert("steps", {procedureid:procid, rank:rank});
    History.replace("editStep({id})");
}

function editStep(id) {
    var item = Query.selectId("Qhse.steps", id);
    if (item == null) { History.back(); return; }

    var onchange = "Query.updateId('steps',{id},this.id,this.value)";

    Toolbar.setTitle(R.EDITSTEP);
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteStep({id})", "delete");
    
    List.addTextBox("name", R.NAME, item.name, onchange, "longtext");
    List.addComboBoxMulti('roleid', "Performed By", item.roleid, onchange, Query.options("roles"));
    List.addTextBox("rank", R.RANK, item.rank, onchange);
    List.addComboBox("formid", R.FORM, item.formid, onchange, Query.options("Forms.templates"));
    List.addTextBox("description", "", item.description, onchange, "textarea");
    List.show();
}

function deleteStep(id) {
    Query.deleteId("steps", id);
    History.back();
}