//////////// EDIT REVISIONS

function writeRevisionSection(revisions, onEdit) {
    List.addHeader([R.REVISIONS, "", ""]);
    for (var i = 0; i < revisions.length; i++) {
        var revision = revisions[i];
        List.add([revision.version + " " + revision.name, Format.date(revision.date), revision.owner], onEdit + "({revision.id})");
    }
}

function editRevisions(procid) {
    Toolbar.addButton(R.NEWREVISION, "newRevision({procid})");
    
    var revisions = Query.select("revisions", null, "procedureid={procid}", "date DESC");
    writeRevisionSection(revisions, "editRevision");
    List.show();
}

function newRevision(procid) {
    var id = Query.insert("revisions", {procedureid: procid, owner:User.getName(), date:Date.now()});
    History.replace("editRevision({id})");
}

function editRevision(id) {
    var item = Query.selectId("revisions", id);

    Toolbar.setTitle(R.EDITREVISION);
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteRevision({id})", "delete");

    var onchange = "Query.updateId('revisions',{id},this.id,this.value)";
    List.addTextBox("name", R.NAME, item.name, onchange);
    List.addTextBox("version", R.VERSION, item.version, onchange);
    List.addTextBox("date", R.DATE, item.date, onchange, "date");
    List.show();
}

function deleteRevision(id) {
    Query.deleteId("revisions", id);
    History.back();
}
