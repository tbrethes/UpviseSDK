

Qhse.viewRisks = function (tab) {
    if (Qhse.hasRight("edit")) {
        Toolbar.addButton("New Risk", "newRisk()", "new");
        Toolbar.addButton(R.IMPORT, "importRisks()", "more");
        Toolbar.addButton(R.EXPORT, "exportRisks()", "download");
    }

    var map = selectRisks();
    Toolbar.addTab("Matrix", "Qhse.viewRisks('matrix')");
    Toolbar.addTab(R.ALL, "Qhse.viewRisks()", "count:" + map.all.length);
    for (var i = 0; i < map.keys.length; i++) {
        var name = map.keys[i];
        Toolbar.addTab(name, "Qhse.viewRisks({name})", "count:" + map.get(name).length);
    }
    if (tab == 'matrix') {
        Qhse.writeRiskMatrix();
    } else {
        List.addTitle("Risks");
        var risks = (tab == null) ? map.all : map.get(tab);
        writeRisks(risks);
    }
    List.show();
}

function writeRisks(risks) {
    List.addHeader([R.NAME, "Probability", "Severity", R.GROUP], ["60%", "100px", "100px", null]);
    for (var i = 0; i < risks.length; i++) {
        var risk = risks[i];
        var onclick = Qhse.hasRight("edit") ? "editRisk({risk.id})" : "";
        List.add([risk.name, Format.options(risk.probability, Qhse.RISK_OPTIONS), Format.options(risk.severity, Qhse.RISK_OPTIONS), risk.type], onclick, "img:warning");
    }
}

function newRisk() {
    var id = Query.insert("risks", {});
    History.replace("editRisk({id})");
}

function editRisk(id) {
    var risk = Query.selectId("risks", id);
    if (risk == null) { History.back(); return; }

    var onchange = "Query.updateId('risks',{id},this.id,this.value)";
    Toolbar.setStyle("edit");   
    Toolbar.setTitle("Edit Risk");
    Toolbar.addButton(R.DELETE, "deleteRisk({id})", "delete");
    List.forceNewLine = true;
    List.addTextBox("name", R.NAME, risk.name, onchange, "longtext");
    List.addTextBox("type", R.GROUP, risk.type, onchange, "text");
    List.addToggleBox('probability', "Probability", risk.probability, onchange, Qhse.RISK_OPTIONS);
    List.addToggleBox('severity', "Severity", risk.severity, onchange, Qhse.RISK_OPTIONS);
    List.addTextBox("measures", "Control Measures", risk.measures, onchange, "textarea2");
    List.addHelp("Separate control measure with a | char");
    List.addComboBox('procedureid', "Procedure", risk.procedureid, onchange, Query.options("procedures"));
    List.show();
}

function deleteRisk(id) {
    Query.deleteId("risks", id);
    History.back();
}

Qhse.writeRiskMatrix = function () {
    var risks = Query.select("risks", "id;name;probability;severity");
    var map = new HashMap();
    for (var i = 0; i < risks.length; i++) {
        var risk = risks[i];
        var key = risk.probability + ":" + risk.severity;
        map.increment(key, 1);
    }
    MatrixChart.onclick = "Qhse.onRisks";
    MatrixChart.show(map);
}

Qhse.onRisks = function (probability, severity) {
    Toolbar.setTitle("")
    var title = "Probability: " + Format.options(probability, Qhse.RISK_OPTIONS) + ", Severity: " + Format.options(severity, Qhse.RISK_OPTIONS);
    List.addTitle(title);
    var risks = Query.select("risks", "id;name;probability;severity;type", "probability={probability} AND severity={severity}", "name");
    writeRisks(risks);
    List.show();
}

//////////////////////////////////////////


Qhse.RISKS_CSV_HEADER = ["id", "name", "type", "measures", "probability", "severity", "procedureid"];

function exportRisks() {
    var risks = Query.select("risks", "*", null, "name");
    var csv = new CsvFile();
    csv.writeLine(Qhse.RISKS_CSV_HEADER);
    for (var i = 0; i < risks.length; i++) {
        var risk = risks[i];
        csv.writeLine([risk.id, risk.name, risk.type, risk.measures, risk.probability, risk.severity, risk.procedureid]);
    }
    csv.download("Risks");
}


function importRisks() {
    Toolbar.setTitle("Import Risks");
    Import.writeFileButton(R.SELECTCSVFILE, onImportRisks);
    Import.writeSampleLink(Qhse.RISKS_CSV_HEADER, "Risks Sample.csv");
    List.show("pane");
}

function onImportRisks(csv) {
    Import.importCsv(csv, mapRiskField, "Qhse.risks");
}

function mapRiskField(param, name, value) {
    if (Qhse.RISKS_CSV_HEADER.contains(name)) {
        param.add(name, value);
    }
}


