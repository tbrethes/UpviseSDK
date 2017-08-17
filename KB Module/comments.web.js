////////////////////////////////////////////////
////// COMMENTS

function writeCommentSection(comments, onEdit) {
    if (comments.length == 0) return;
    List.addHeader([R.COMMENTS, "", ""], [null, "150px", "150px"], "contact");
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        List.add([Format.text(comment.description), comment.postedby, Format.date(comment.date)], onEdit + "({comment.id})");
    }
}

function editComments(procid) {
    var comments = Query.select("comments", null, "procedureid={procid}");
    writeCommentSection(comments, "editComment");
    List.show();
}

function newComment(procid) {
    Toolbar.setTitle("New Comment");
    Toolbar.addButton(R.SAVE, "onNewComment({procid})", "save");
    List.addTextBox("description", "Comment", "", "", "textarea2");
    List.show("pane");
}

function onNewComment(procid) {
    var description = List.getValue("description");
    if (description == "") return;

    insertComment(procid, description);
    History.reload();
}

function editComment(id) {
    var comment = Query.selectId("Qhse.comments", id);
    if (comment == null) { History.back(); return; }

    Toolbar.setTitle("Edit Comment");
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETE, "deleteComment({id})", "delete");

    var onchange = "Query.updateId('comments',{id},this.id,this.value)";
    List.addTextBox("description", null, comment.description, onchange, "textarea");
    List.show();
}

