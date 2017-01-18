
//////////////// Comments

function viewComment(id) {
    var comment = Query.selectId("comments", id);
    Toolbar.setTitle(R.COMMENT);
    Toolbar.setStyle("nextprevious");
    if (User.isAdminOrManager()) Toolbar.addButton(R.DELETE, "deleteComment({id})", "delete");
    var label = Format.datetime(comment.date) + " by " + comment.postedby;
    WebView.showHtml(comment.description, label);
}

function newComment(procedureid) {
    var description = App.prompt(R.DESCRIPTION, '', 'textarea');
    if (description == null) return;

    insertComment(procedureid, description);
    History.reload();
}

