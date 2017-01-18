
function viewStep(stepid) {
    var step = Query.selectId("steps", stepid);
    var role = Query.selectId("roles", step.roleid);
    var form = Query.selectId("Forms.forms", step.formid);

    Toolbar.setStyle("nextprevious");
    var html = "<h1>" + step.name + "</h1>" + step.description;
    var header = (role != null) ? "Performed By " + role.name : "";
    WebView.showHtml(html, header);
    //List.addItemLabel(R.TITLE, step.name);
    //if (role != null) List.addItemLabel("Performed By", role.name, "viewRole({step.roleid})");
    //List.addItemLabel(R.DESCRIPTION, Format.text(step.description));
    //List.addItemLabel(R.DESCRIPTION, Format.text(step.description), "WebView.showHtml({step.description}, R.DESCRIPTION)");
    //if (form != null) List.addButton(form.name, "Forms.newForm({form.id})");
    //List.show();
}

function editStep(id) {
    var step = Query.selectId("steps", id);
    var onchange = "Query.updateId('steps',{id},this.id,this.value)";
    Toolbar.setTitle(R.EDITSTEP);
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETESTEP, "deleteStep({id})", "delete");
    List.addTextBox('name', R.TITLE, step.name, onchange, "required");
    List.addComboBox('roleid', "Performed By", step.roleid, onchange, Query.options("roles"), "onNewRole({id},this.value)");
    List.addComboBox('formid', R.FORM, step.formid, onchange, ":" + R.NONE + "|" + Query.options("Forms.templates"));
    List.addTextBox('description', R.DESCRIPTION, step.description, onchange, 'textarea');
    List.addTextBox('rank', R.RANK, step.rank, onchange, "numeric");
    List.show();
}

function onNewRole(stepid, name) {
    var roleid = Query.insert("roles", { name: name });
    Query.updateId("steps", stepid, "roleid", roleid);
    History.reload();
}

function newStep(procedureid) {
    var maxRank = 0;
    var steps = Query.select("steps", "rank", "procedureid={procedureid}", "rank");
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.rank > maxRank) maxRank = step.rank;
    }
    maxRank++;
    var stepid = Query.insert("steps", { procedureid: procedureid, rank: maxRank });
    History.replace("editStep({stepid})");
}

function deleteStep(id) {
    Query.deleteId("steps", id);
    History.back();
} 