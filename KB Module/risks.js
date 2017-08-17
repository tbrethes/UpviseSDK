
///////////// EDIT STEPS
Qhse.RISK_OPTIONS = "1:Very Low|2:Low|3:Medium|4:High|5:Very High";

function selectRisks() {
    var items = Query.select("risks", "id;name;probability;severity;type", null, "name");
    var map = new HashMap();
    map.all = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        map.all.push(item);
        var list = map.get(item.type);
        if (list == null) {
            list = [];
            map.set(item.type, list);
        }
        list.push(item);
    }
    return map;
}
