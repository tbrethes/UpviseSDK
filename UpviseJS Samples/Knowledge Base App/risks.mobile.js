///////////// EDIT STEPS

Qhse.viewRisks = function (tab) {
    Toolbar.addButton(R.FILTER, "Qhse.popupRiskGroups()", "sortby");
    var map = selectRisks();
    var risks = (tab != null) ? map.get(tab) : map.all;
    var subtitle = (tab != null) ? tab : R.ALL;
    List.addItemTitle("Risks", subtitle);
    for (var i = 0; i < risks.length; i++) {
        var risk = risks[i];
        List.add([risk.name, risk.type], "Qhse.viewRisk({risk.id})", "img:warning");
    }
    List.show();
}

Qhse.popupRiskGroups = function () {
    var map = selectRisks();
    Popup.add(R.ALL, "Qhse.onRiskGroup()", "img:folder");
    for (var i = 0; i < map.keys.length; i++) {
        var type = map.keys[i];
        Popup.add(type, "Qhse.onRiskGroup({type})", "img:folder");
    }
    Popup.show();
}

Qhse.onRiskGroup = function (type) {
    History.reload("Qhse.viewRisks({type})");
}

Qhse.viewRisk = function (id) {
    var risk = Query.selectId("risks", id);
    if (risk == null) { History.back(); return; }
    var procedure = Query.selectId("procedures", risk.procedureid);

    Toolbar.setTitle("Risk");
    Toolbar.setStyle("nextprevious");
    List.addItemTitle(risk.name, risk.type);
    List.addItemLabel("Probability", Format.options(risk.probability, Qhse.RISK_OPTIONS));
    List.addItemLabel("Severity", Format.options(risk.severity, Qhse.RISK_OPTIONS));
    List.addHeader("Control Measures");
    var measures = risk.measures.split("|");
    for (var i = 0; i < measures.length; i++) {
        var label = (i + 1) + ". " + measures[i];
        List.add(label);
    }
    if (procedure != null) {
        List.addHeader("Article");
        List.addItem(procedure.name, "viewProcedure({procedure.id})", "img:note;icon:arrow");
    }
    List.show();
}