///////////////////

Qhse.setPdfStyle = function () {
    
    Pdf2.addStyle(".table THEAD TR TD", "background-color:#F1F1F1;");
    Pdf2.addStyle(".table", "border-collapse:collapse;border:1px solid #CCC;");
    Pdf2.addStyle(".table TR TD", "padding:0.8em;padding-left:1em;padding-right:1em;border:1px solid #CCC;");

    Pdf2.addStyle(".table", "margin-top:3em;");
}

function exportPdfAll() {
    Pdf2.init();
    Qhse.setPdfStyle();
    Pdf2.addStyle(".table TR TD:last-child", "text-align:left;");
    Pdf2.setHeader();
    var title = "Knowledge Base" + " - " + Format.date(Date.today());
    Pdf2.addTitle(title);
    Pdf2.setFooter(title);
    Pdf2.setFilename(title);

    var groups = [];
    groups.push({ name: R.NOGROUP, id: "" });
    groups = groups.concat(Query.select("Qhse.groups", null, null, "name"));
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        var articles = Query.select("Qhse.procedures", null, "type = 0 AND groupid=" + esc(group.id), "rank");
        if (articles.length > 0) {
            Pdf2.startTable([group.name]);
            for (var j = 0; j < articles.length; j++) {
                var article = articles[j];
                var name = String(j + 1) + ". " + article.name;
                Pdf2.addRow([name]);
            }
            Pdf2.stopTable();
        }
    }
    Pdf2.download();
}

function exportPdf(id) {
    var item = Query.selectId("Qhse.procedures", id);
    var steps = Query.select("Qhse.steps", "*", "procedureid={id}", "rank");
    var comments = Query.select("Qhse.comments", "*", "procedureid={id}");
    var revisions = Query.select("Qhse.revisions", "*", "procedureid={id}", "date");
    var files = FileUtils.select("Qhse.procedures", id);

    Pdf2.init();
    Qhse.setPdfStyle();
    Pdf2.addStyle(".table TR TD:last-child", "text-align:right;");

    Pdf2.setFilename(item.name);
    Pdf2.setFooter(item.name);
    Pdf2.setHeader();
    Pdf2.startTitleBlock(item.name);
    Pdf2.addRow([R.GROUP, Query.names("groups", item.groupid), R.ASSETGROUPS, Query.names("Assets.groups", item.assetgroupid)]);
    Pdf2.addRow(["Performed By", Query.names("roles", item.roleid), R.DATE, Format.date(item.date)]);
    Pdf2.stopTable();

    Pdf2.add("<p>", item.description, "</p>");

    if (item.charturl != "") Pdf2.add('<p align=center><img src="', item.charturl, '" /></p>');

    if (steps.length > 0) {
        Pdf2.startTable(["Steps", R.ROLE], [null, "150px"]);
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var label = "<b>" + String(i + 1) + ". " + step.name + "</b>";
            if (step.note != "") label += "<br><small>" + step.description + "</small>";
            var role = Query.names("roles", step.roleid);
            Pdf2.addRow([label, role]);
        }
        Pdf2.stopTable();
    }

    if (revisions.length > 0) {
        Pdf2.startTable([R.REVISIONS, "", "", ""], ["100px", null, "100px", "100px"]);
        for (var i = 0; i < revisions.length; i++) {
            var revision = revisions[i];
            Pdf2.addRow([revision.version, revision.name, Format.date(revision.date), revision.owner]);
        }
        Pdf2.stopTable();
    }

    if (files.length > 0) {
        Pdf2.startTable([R.FILES, ""], [null, "100px"]);
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            Pdf2.addRow([file.name, Format.date(file.date)]);
        }
        Pdf2.stopTable();
    }

    if (item.signature) {
        Pdf2.addHeader(R.SIGNATURE);
        Pdf2.addSignature(item.signuser + " (" + Format.datetime(item.signdate) + ")", item.signature);
    }
    
    Pdf2.download();
}
