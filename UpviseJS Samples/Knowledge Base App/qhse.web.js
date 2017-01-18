////////////////////////////////////////////////////
Config.appid = "qhse";
Config.include = ["risks.web.js", "risks.js", "qhse.options.js", "qhse.steps.web.js", "qhse.roles.web.js", "qhse.revisions.web.js",
                   "comments.js", "comments.web.js", "qhse.export.web.js", "../rank.js", "../fileutils.js"];

var _sortby = 0;

function Qhse() { }

Qhse.viewArticle = function (id) {
    History.replace("viewProcedure({id},0)");
}

function main() {
    if (AccountSettings.get("qhse.noweb") == "1" && User.isAdmin() == false) {
        leftpane = function () { List.show("leftpane"); }
        List.addItemTitle("Access allowed on Mobile only");
        List.show();
        return;
    }

    Config.onsearch = "Qhse.search";
    leftpane = Qhse.leftpane;
    History.replace("Qhse.viewArticles()");
}

Qhse.search = function(search) {
    var articles = Query.search("procedures", search, "name;description");
    writeArticleList(articles);
    List.show();
}

Qhse.leftpane = function () {
    var groups = Query.select("Qhse.groups", "id;name", null, "rank");
    var procedures = Query.groupby("Qhse.procedures", "groupid", "type=0");

    List.addItem("Articles", "Qhse.viewArticles()", { count: procedures.count(), img: "note" });
    List.addItem(R.ROLES, "Qhse.viewRoleList()", { count: Query.count("Qhse.roles"), img: "contact" });
    List.addItem(R.QUESTIONS, "Qhse.viewQuestions()", { count: Query.count("Qhse.procedures", "type=1"), img: "support" });
    List.addItem("Risks", "Qhse.viewRisks()", "img:warning;count:" + Query.count("risks"));
    if (User.canEditOptions()) {
        List.addHeader("");
        List.addItem(R.OPTIONS, "Qhse.showOptions()", "img:settings");
    }
    
    List.addHeader(R.GROUPS);
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        List.addItem(group.name, "Qhse.viewGroup({group.id})", { count: procedures.count(group.id), img: "folder" });
    }
    List.show();
}

Qhse.viewArticles = function() {
    writeArticles("type=0", R.ARTICLES);
    List.show();
}

Qhse.viewQuestions = function () {
    writeArticles("type=1", R.QUESTIONS);
    List.show();
}

Qhse.viewGroup = function (groupid) {
    if (User.isManager()) Toolbar.addButton(R.EDIT, "editGroup({groupid})", "edit");
    var group = Query.selectId("Qhse.groups", groupid);
    writeArticles("type=0 AND groupid={groupid}", group.name);
    List.show();
}

function writeArticles(where, title) {
    var orderby = "rank";
    if (_sortby == 1) orderby = "name";
    else if (_sortby == 2) orderby = "date DESC";

    var items = Query.select("Qhse.procedures", null, where, orderby);
    writeToolbar();
    if (title == null) title = R.ARTICLES;
    List.addTitle(title);
    writeArticleList(items);
}

////////////////////////////////////////////////////////////////

function writeToolbar(title) {
    Toolbar.addButton(R.NEW, "showNewPopup()", "new");
    Toolbar.addButton(R.SORTBY, 'showSortBy()', "sortby");
    if (User.isManager()) {
        Toolbar.addButton(R.EXPORTPDF, "exportPdfAll()", "download");
    }
}

function showNewPopup() {
    if (User.isAdminOrManager()) {
        Popup.add(R.ARTICLE, "newProcedure()", "img:idea");
        Popup.add(R.ROLE, "newRole()", "img:contact");
    }
    Popup.add("Question", "newQuestion()", "img:support");
    Popup.show();
}

function showSortBy() {
    Popup.add(R.RANK, "onSortby(0)");
    Popup.add(R.NAME, "onSortby(1)");
    Popup.add(R.MOSTRECENT, "onSortby(2)");
    Popup.show();
}

function onSortby(index) {
    _sortby = index;
    History.reload();
}

function writeArticleList(items) {
    List.addHeader(["Article", R.DATE], null, "checkbox");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var oncontext = "popupArticleMenu({item.id},{item.groupid})";
        List.add([item.name, Format.date(item.date)], "viewProcedure({item.id})", "img:note;oncontext:" + oncontext);
    }
}

function popupArticleMenu(id, groupid) {
    var where = "groupid={groupid}";
    Popup.add("Change Position", "Rank.changeRank('procedures',{where},{id})");
    Popup.add("Edit", "editProcedure({id})");
    Popup.show();
}

/////////////////// Procedures

function viewProcedure(id, tab) {
    if (tab == null) tab = 0;
    var item = Query.selectId("procedures", id);
    if (item == null) { History.back(); return;  }

    var steps = Query.select("steps", null, "procedureid={id}", "rank");
    var comments = Query.select("comments", null, "procedureid={id}", "date DESC");
    var files = FileUtils.select("Qhse.procedures", id);
    var revisions = Query.select("revisions", null, "procedureid={id}", "date DESC");
    
    var title = item.title;
    var description = item.description;
    var creator = item.creator;
    var creationdate = Format.datetime(item.creationdate); // convert to local time

    if (User.canEdit(item.owner)) Toolbar.addButton(R.EDIT, "showEditPopup({id})", "edit");
    Toolbar.addButton(R.NEWCOMMENT, "newComment({id})", "new");
    if (User.isAdminOrManager()) Toolbar.addButton(R.EXPORT, "exportPdf({id})", "download");
    
    Toolbar.addTab(R.ALL, "viewProcedure({id})");
    if (steps.length > 0) Toolbar.addTab(R.STEPS, "viewProcedure({id},1)", "count:" + steps.length);
    if (files.length > 0) Toolbar.addTab(R.FILES, "viewProcedure({id},2)", "count:" + files.length);
    if (comments.length > 0) Toolbar.addTab(R.COMMENTS, "viewProcedure({id},3)", "count:" + comments.length);
    if (revisions.length > 0) Toolbar.addTab(R.REVISIONS, "viewProcedure({id},4)", "count:" + revisions.length);
    if (item.signature != '') Toolbar.addTab("Approval", "viewProcedure({id},5)");
    if (item.videoid != '') Toolbar.addTab("Video", "viewProcedure({id},6)");

    var subtitle = (item.type == 1) ? R.QUESTION : "";
    List.addItemTitle(item.name, subtitle);

    if (tab == 0) {
        List.addItemLabel("Asked By", item.askedby);
        List.addItemLabel("Applicable To", Format.owner(item.owner), "", "img:contact");
        List.addItemLabel(R.GROUP, Query.names("Qhse.groups", item.groupid), "", "img:folder");
        List.addItemLabel(R.ASSETGROUPS, Query.names("Assets.groups", item.assetgroupid), "", "img:product");
        List.addItemLabel("Performed By", Query.names("Qhse.roles", item.roleid), "", "img:contact");
        List.addItemLabel(item.description, " "); // for full width
        List.addImage(item.charturl);
    }
    if (tab == 1 || tab == 0) {
        if (steps.length > 0) writeStepSection(steps, "viewStep");
    }
    if (tab == 2 || tab == 0) {
        writeFileListNew(files);
    }
    if (tab == 3 || tab == 0) {
        var onCommentClick = User.isAdminOrManager() ? "editComment" : null;
        if (comments.length > 0) writeCommentSection(comments, onCommentClick);
    }
    if (tab == 4 || tab == 0) {
        var onRevisionClick = User.isAdminOrManager() ? "editRevision" : null;
        if (revisions.length > 0) writeRevisionSection(revisions, onRevisionClick);
    }
    if (tab == 5 || tab == 0) {
        List.addItemLabel(R.NAME, item.signuser, "", "img:contact");
        List.addItemLabel(R.SIGNATURE, Format.image64(item.signature), "", "img:edit");
        List.addItemLabel(R.DATE, Format.datetime(item.signdate), "", "img:calendar");
    }
    if (tab == 6 || tab == 0) {
         List.addItemLabel(null, Format.video(item.videoid));
    }
    List.show();
}


writeFileListNew = function (items) {
    if (items.length == 0) return;
    List.addHeader([R.FILE, R.FOLDER, R.DATE], null, "folder");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        List.add([item.name, Query.names("Files.folders", item.folderid), Format.date(item.date)], "Files.viewFile({item.id})");
    }
}

function showEditPopup(id) {
    Popup.add("Edit Procedure", "editProcedure({id})");
    Popup.add(R.NEWSTEP, "newStep({id})");
    Popup.add(R.NEWREVISION, "newRevision({id})");
    Popup.add(R.ATTACHFILE, "App.takePicture('Qhse.procedures',{id})");
    Popup.show();
}

function newQuestion() {
    Toolbar.setTitle("New Question");
    Toolbar.addButton(R.SAVE, "onSaveQuestion()"); 
    _html.push('<textarea id=_note rows=3 style="width:90%" onkeydown="if(event.keyCode==13) this.rows++;"></textarea> ');
    List.show("pane");
}

function onSaveQuestion() {
    var text = _get('_note').value;
    if (text == null || text == "") return;

    // Chrome and Safari only add \n and not \r\n
    text = text.replace(/\n/g, '<BR>');
    text = text.replace(/\r/g, '');

    // type = 1 for question
    var values = {type:1, name:text,askedby:User.getName(), date: Date.now()};
    Query.insert("procedures", values);
    History.reload();
}

function newProcedure(procid) {
    var values = {name:'', owner:User.getName(), date: Date.now(), rank:9999};
    var id = Query.insert("procedures", values);
    History.replace("editProcedure({id})");
}

function editProcedure(id) {
    var item = Query.selectId("procedures", id);
    if (item == null) {History.back();return;}
    
    Toolbar.setStyle("edit");
    Toolbar.setTitle(R.EDITPROCEDURE);
    Toolbar.addButton(R.DELETE, "deleteProcedure({id})", "delete");
    
    var onchange = "Query.updateId('procedures',{id},this.id,this.value)";
    var where = "groupid={item.groupid}";
    var onchangerank = "Rank.onchange('procedures',{where},{id},this.value)";

    List.addTextBox("name", R.NAME, item.name, onchange, "longtext");
    List.addComboBox("groupid", R.GROUP, item.groupid, onchange, Query.options("groups"));
    List.addComboBoxMulti('assetgroupid', R.ASSETGROUP, item.assetgroupid, onchange, Query.options("Assets.groups"));

    //List.addTextBox("rank", R.RANK, item.rank, onchangerank);
    List.addComboBox("rank", "Position", item.rank, onchangerank, Rank.getOptions('procedures', where));

    List.addComboBoxMulti("roleid", R.ROLES, item.roleid, onchange, Query.options("roles"));
    List.addComboBoxMulti("owner", R.OWNER, item.owner, onchange, User.getOptions());
    List.addCheckBox("type", R.QUESTION, item.type == 1, onchange);
    List.addHeader(" ");
    List.addTextBox("charturl", "Chart URL", item.charturl, onchange, "url");
    List.addTextBox("videoid", "Video ID", item.videoid, onchange);
    List.addTextBox('description', R.DESCRIPTION, item.description, onchange, 'textarea');
    List.show();
}

function writeVideoLink(videoid) {
    var url = "http://youtu.be/" + videoid;
    return '<a target=_blank href="' + url + '"> View Video</a>';
}

function deleteProcedure(id) {
    Query.deleteId("procedures", id);
    Query.deleteWhere("comments", "procedureid={id}");
    Query.deleteWhere("revisions", "procedureid={id}");
    Query.deleteWhere("steps", "procedureid={id}");
    History.back();
}
 