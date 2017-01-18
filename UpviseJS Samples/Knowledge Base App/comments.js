
function insertComment(procedureid, description) {
    Query.insert("comments", { procedureid: procedureid, description: description, date: Date.now(), postedby: User.getName() });

    // update comment count
    var procedure = Query.selectId("procedures", procedureid);
    var commentcount = 1 + procedure.commentcount;
    Query.updateId("procedures", procedureid, "commentcount", commentcount);

    // Send notification to all managers.
    var msg = { title: "New Comment by " + User.getName(), body: "For Article: " + procedure.name };
    msg.onclick = "Qhse.viewArticle({procedure.id})";
    var emails = null;
    Notif.sendNow(msg, emails);
}

//////////////////

function deleteComment(id) {
    Query.deleteId("comments", id);
    History.back();
}
