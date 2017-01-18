//////////////////////////////////////////////
// Ideas App
Config.appid = "Qhse";
Config.title = "Knowledge Base";
Config.version = "177";
Config.uses = "Tasks;Files;Forms;Assets";

Config.tables["procedures"] = "id;name;description;type INTEGER;groupid;assetgroupid;owner;date DATE;rank INTEGER;charturl;signature;signuser;signdate DATE;videoid;askedby;roleid;commentcount INTEGER"; 
Config.tables["steps"] = "id;name;description;procedureid;roleid;formid;rank INTEGER;";
Config.tables["revisions"] = "id;name;version;owner;procedureid;date DATE";
Config.tables["groups"] = "id;name;rank INTEGER";
Config.tables["roles"] = "id;name;description";
Config.tables["comments"] = "id;description;procedureid;owner;postedby;date DATE";
Config.tables["risks"] = "id;name;type;severity INTEGER;probability INTEGER;measures;note;procedureid";

Config.include = ["qhse.options.js", "risks.mobile.js", "risks.js", "qhse.assets.js", "qhse.roles.js", "qhse.groups.js",
                   "comments.js", "comments.mobile.js", "qhse.steps.js", "../nfc.js"];

Config.debug = true;
////////////////////////////////////////
function Qhse() { }

Qhse.main = function () {
    main();
}

Qhse.viewArticle = function (id) {
    viewProcedure(id);
}

var SORTBY_KEY = "ideas_sortby";

function main() {
    if (Settings.isTablet()) {
        viewArticleList("type=0"); 
        return; 
    }
    Toolbar.setTitle(KoneisEnabled() ? "QuEST" : "Knowledge Base");
    writeHome();
    List.show();
}

function KoneisEnabled() {
    var name = WEB() ? User.companyName : Settings.get("company");
    name = name.toLowerCase();
    return (name.indexOf('neb ') == 0) || (name.indexOf('seb ') == 0) || (name.indexOf('trb ') == 0) || (name.indexOf('kone ') == 0)
}

function writeHome() {
    var questionCount = Query.count("procedures", "type=1");

    Toolbar.addButton(R.NEW, "newPopup()", "new");
    List.addItem(R.ARTICLES, "viewArticleList('type=0')", "img=note;number=" + Query.count("procedures", "type=0"));
    List.addItem(R.GROUPS, "viewGroups()", "img=folder;number=" + Query.count("groups"));
    List.addItem(R.ROLES, "viewRoleList()", "img=contact;number=" + Query.count("roles"));
    if (questionCount > 0) List.addItem(R.QUESTIONS, "viewUnanswered()", "img=support;number=" + questionCount);
    List.addItem(R.ASSETGROUPS, "Qhse.viewAssetGroups()", "img=product;icon=arrow");
    List.addItem("Risks", "Qhse.viewRisks()", "img:warning;count:" + Query.count("risks"));
    List.addHeader(" ");
    List.addItem("Most Commented", "viewMostCommented()", "img=news;icon=arrow");
    List.addItem(R.RECENT, "viewRecent()", "img=clock;icon=arrow");   
}

function newPopup() {
    if (User.isAdminOrManager()) Popup.add(R.ARTICLE, "newProcedure()", "img=note");
    Popup.add("Question", "newQuestion()", "img=support");
    Popup.show();
}

function newQuestion() {
    var question = App.prompt("Question", '', 'text');
    if (question != null) {
        Query.insert("Qhse.procedures", { askedby: User.getName(), date: Date.now(), name: question, type: 1 });
        History.reload();
    }
}

function leftpane() {
    writeHome();
    List.show("leftpane");
}

function viewMore() {
    Popup.add(R.EDITROLES, "editRoles()");
    Popup.add(R.EDITGROUPS, "editGroups()");
    Popup.show();
}

function viewArticleList(where) {
    Toolbar.setStyle("search");
    Toolbar.addButton(R.SORTBY, "showSortBy()", "sortby");
    
    var sortby = Settings.get(SORTBY_KEY);
    if (sortby == null) sortby = "0";

    var orderby = "";
    if (sortby == "0") orderby = "rank";
    else if (sortby == "1") orderby = "name";
    else if (sortby == "2") orderby = "date DESC";

    writeProcedureList(where, orderby);
    List.show();
}

function viewRecent() {
    Toolbar.setStyle("search");
    writeProcedureList("type=0", "date DESC");
    List.show();
}

function viewUnanswered() {
    Toolbar.setStyle("search");
    writeProcedureList("type=1", "date DESC");
    List.show();
}

function viewMostCommented() {
    Toolbar.setStyle("search");
    var procedures = Query.select("procedures", "id;name;commentcount", "commentcount>0", "commentcount DESC");
    for (var i = 0; i < procedures.length; i++) {
        var procedure = procedures[i];
        var style = "";
        List.addItem(procedure.name, "viewProcedure({procedure.id})", "number=" + procedure.commentcount);
    }
    List.show();
}

function writeProcedureList(where, orderby) {
    var procedures = Query.selectFormat("procedures", "id;name;Format.date(date) AS date;groupid;commentcount", where, orderby);
    for (var i = 0; i < procedures.length; i++) {
        var procedure = procedures[i];
        List.addItemSubtitle(procedure.name, procedure.date, "viewProcedure({procedure.id})", "img:note");
    }
}

function showSortBy() {
    Popup.add(R.RANK, "onSortBy('0')");
    Popup.add(R.NAME, "onSortBy('1')");
    Popup.add(R.DATE, "onSortBy('2')");
    Popup.show();
}

function onSortBy(value) {
    Settings.set(SORTBY_KEY, value);
    History.reload();
}

/////////////// View / Edit / Delete / New Procedure

function writeProcedureToolbar(procedure, tab) {
    if (tab == null) tab = 0;

    var id = procedure.id;
    var fileCount = Query.count("System.files", "linkedtable='Qhse.procedures' AND linkedrecid={id}");
    if (procedure.charturl != '') fileCount++;
    if (procedure.videoid != '') fileCount++;
    var commentCount = Query.count("Qhse.comments", "procedureid={id} AND description!=''");

    var fileLabel = R.FILES;
    if (fileCount > 0) fileLabel += " (" + fileCount + ")";
    var commentLabel = R.COMMENTS;
    if (commentCount > 0) commentLabel += " (" + commentCount + ")";

    Toolbar.setTitle(R.PROCEDURE);
    Toolbar.setStyle("nextprevious");
    Toolbar.addTab(R.INFO, tab == 0 ? "" : "viewProcedure({id})");
    Toolbar.addTab(fileLabel, tab == 1 ? "" : "viewProcedureFiles({id})");
    Toolbar.addTab(commentLabel, tab == 2 ? "" : "viewProcedureComments({id})");

    Toolbar.addButton(R.NEW, "showNewActivity({id})", "new");
    if (User.isAdminOrManager()) {
        Toolbar.addButton(R.SHARE, "shareProcedure({id})", "share");
        Toolbar.addButton(R.EDIT, "editProcedure({id})", "edit");
        Nfc.addWriteButton("Qhse.viewArticle({id})");
    }
}

function viewProcedure(id) {
    var procedure = Query.selectId("procedures", id);
    if (procedure == null) { History.back(); return; }
    
    var revisions = Query.select("revisions", "id;version;name;owner;date", "procedureid={id}", "date DESC");
    var revision = revisions.length > 0 ? revisions[0] : null;

    writeProcedureToolbar(procedure, 0);
    
    var steps = Query.select("steps", "id;name;rank", "procedureid={id}", "rank");
    if (steps.length == 0) {
        var content = "<h2>" + procedure.name + "</h2>";
        if (procedure.type == 1 && procedure.askedby != '') content += "<i>Asked by: " + procedure.askedby + "</i><br/>";
        content += procedure.description;
        if (revision != null) {
            content += "<hr><b>" + R.REVISION + "</b><br/>";
            content += revision.version + " " + revision.name;
            content += "<br/>" + Format.date(revision.date) + " by " + revision.owner;
        }
        var header = "";
        if (procedure.groupid != '') header = Query.names("groups", procedure.groupid);
        else if (procedure.assetgroupid != '') header = Query.names("Assets.groups", procedure.assetgroupid);
        WebView.showHtml(content, header);
    } else {
        List.addItemTitle(procedure.name);
        if (procedure.description != '') List.addItem("View Description", "WebView.showHtml({procedure.description})", "img=note;icon=arrow");
        List.addHeader(R.STEPS + " (" + steps.length + ")");
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            List.addItem(step.rank + ". " + step.name, "viewStep({step.id})");
        }

        if (revision != null) {
            List.addHeader(R.REVISION);
            var title = revision.version + " " + revision.name;
            var subtitle = Format.date(revision.date) + " by " + revision.owner;
            List.addItemSubtitle(title, subtitle);
        }
        List.show();
    }
}

function shareProcedure(id) {
    var procedure = Query.selectId("procedures", id);
    var buffer = [];
    buffer.push('<b>', procedure.name, '</b>', procedure.description);
    App.share(buffer.join(""));
}


function viewProcedureFiles(id) {
    var procedure = Query.selectId("procedures", id);
    if (procedure == null) { Historyt.back(); return; }
    writeProcedureToolbar(procedure, 1);
    if (procedure.charturl != '') List.addItem("View Chart", "viewChart({procedure.id})", "icon=arrow");
    if (procedure.videoid != '') List.addItem("View Video", "App.video({procedure.videoid})", "icon=camera");
    var where = "linkedtable='Qhse.procedures' AND linkedrecid={id}";
    List.bindItemSubtitles("System.files", "name;date", where, "date DESC", "Files.viewFile(this.id)");
    List.show();
}

function viewProcedureComments(id) {
    var procedure = Query.selectId("procedures", id);
    if (procedure == null) { History.back(); return; }
    writeProcedureToolbar(procedure, 2);
    List.bindItemSubtitles("comments", "description;date;postedby", "procedureid={id}", "date DESC", "viewComment(this.id)");
    List.show();
}

function viewChart(id) {
    var procedure = Query.selectId("procedures", id);
    Toolbar.setTitle(procedure.name);
    Toolbar.addButton(R.SHARE, "shareChart({id})", "share");
    Toolbar.setStyle("edit");
    WebView.showImage(procedure.charturl);
}

function shareChart(id) {
    var procedure = Query.selectId("procedures", id);
    var url = procedure.charturl;
    var filename = url.replace(/^.*[\\\/]/, '');

    var useCache = 0;
    var filepath = App.downloadFile(url, null, filename, useCache);
    if (filepath != null) App.share(procedure.name, filepath);
}

function showNewActivity(id) {
    Popup.add(R.COMMENT, "newComment({id})");
    Popup.add(R.TAKEPICTURE, "App.takePicture('Qhse.procedures',{id})");
    Popup.show();
}

//////////////////////// EDIT 

function newProcedure() {
    var values = { owner: User.getName(), date: Date.now() };
    var id = Query.insert("procedures", values);
    History.replace("editProcedure({id})");
}

function editProcedure(id, tab) {
    var procedure = Query.selectId("procedures", id);
    var onchange = "Query.updateId('procedures',{id},this.id,this.value)";
    Toolbar.setStyle("edit");
    Toolbar.addTab(R.ARTICLE, "editProcedure({id})");
    Toolbar.addTab(R.STEPS, "editProcedure({id},1)");
    Toolbar.addTab(R.REVISIONS, "editProcedure({id},2)");

    if (tab == null) {
        Toolbar.addButton(R.DELETE, "deleteProcedure({id})", "delete");
        List.addTextBox('name', R.TITLE, procedure.name, onchange, "required");
        List.addTextBox('description', R.DESCRIPTION, procedure.description, onchange, 'textarea');
        List.addComboBoxMulti('groupid', R.GROUP, procedure.groupid, onchange, Query.options("groups"), "onNewGroup({id},this.value)");
        List.addComboBoxMulti('assetgroupid', R.ASSETGROUP, procedure.assetgroupid, onchange, Query.options("Assets.groups"));
        List.addTextBox('rank', R.RANK, procedure.rank, onchange, "numeric");
        List.addComboBoxMulti('roleid', R.ROLES, procedure.roleid, onchange, Query.options('roles'));
        List.addComboBoxMulti('owner', R.OWNER, procedure.owner, onchange, Query.options('System.users'));
        List.addCheckBox('type', R.QUESTION, procedure.type == 1, onchange);

        if (procedure.signature == '') {
            List.addHeader("Approval");
            List.addSignatureBox("signature", R.SIGNATURE, "", "onSignatureChange({procedure.id},this.value)");
        } else {
            List.addSignatureBox("signature", "Approval: " + " " + procedure.signuse, procedure.signature, "");
            List.addButton("Clear Signature", "clearSignature({procedure.id})");
        }    
    } else if (tab == 1) {
        //List.addHeader(R.STEPS);
        List.addButton(R.NEWSTEP, "newStep({id})");
        var steps = Query.select("steps", "id;name;rank", "procedureid={id}", "rank");
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            List.addItem(step.rank + ". " + step.name, "editStep({step.id})");
        }
    } else if (tab == 2) {
        List.addHeader(R.REVISIONS);
        List.addButton(R.NEWREVISION, "newRevision({id})");
        var revisions = Query.select("revisions", "id;version;name;owner;date", "procedureid={id}", "date");
        for (var i = 0; i < revisions.length; i++) {
            var revision = revisions[i];
            List.addItemSubtitle(revision.version + " " + revision.name, Format.date(revision.date) + " " + revision.owner, "editRevision({revision.id})");
        }
    }
    List.show();
}

function onSignatureChange(procedureid, value) {
    Query.updateId("procedures", procedureid, "signature", value);
    Query.updateId("procedures", procedureid, "signuser", User.getName());
    Query.updateId("procedures", procedureid, "signdate", now());
    History.reload();
}

function clearSignature(procedureid) {
    Query.updateId("procedures", procedureid, "signature", "");
    Query.updateId("procedures", procedureid, "signuser", "");
    Query.updateId("procedures", procedureid, "signdate", "");
    History.reload();
}

function onNewGroup(procedureid, name) {
    var groupid = Query.insert("groups", { name: name });
    Query.updateId("procedures", procedureid, "groupid", groupid);
    History.reload();
}

function deleteProcedure(id) {
    // TODO FILES
    Query.deleteWhere("steps", "procedureid={id}");
    Query.deleteWhere("revisions", "procedureid={id}");
    Query.deleteId("procedures", id);
    History.back();
}



///////////// Edit Revisions
function newRevision(procedureid) {
    var id = Query.insert("revisions", { procedureid: procedureid, owner: User.getName(), date: Date.now() });
    History.replace("editRevision({id})");
}

function editRevision(id) {
    var revision = Query.selectId("revisions", id);
    var onchange = "Query.updateId('revisions',{id},this.id,this.value)";
    Toolbar.setTitle(R.EDITREVISION);
    Toolbar.setStyle("edit");
    Toolbar.addButton(R.DELETEREVISION, "deleteRevision({id})", "delete");
    List.addTextBox('name', R.TITLE, revision.name, onchange, "required");
    List.addTextBox('version', R.VERSION, revision.version, onchange);
    List.show();
}

function deleteRevision(id) {
    Query.deleteId("revisions", id);
    History.back();
}

