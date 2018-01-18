
// Use this class to get a Query like operations using the predefined Forns.dataitems table structure
// we use the id volumn
// we use the datasetid column to store the "pseudo" table name
// we use the code column to store an external "groupid" for the record
// we use the name column t store the JSON values of the recorcd

function Dataset() { }

Dataset.select = function (table, groupid, orderby) {
    var where = "datasetid=" + esc(table);
    if (linkid) where += " AND code=" + esc(groupid);
    var items = Query.select("Forms.dataitems", "id;name", where);
    var list = [];
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        try {
            var obj = JSON.parse(item.name);
            obj.id = item.id;
            list.push(obj)
        } catch (e) {
        }
    }
    // now do the sorting
    if (orderby) {
        list.sort(function (o1, o2) { return o1[orderby] - o2[orderby]; })
    }
    return list;
}

// Insert a new record the the pseudo table 
Dataset.insert = function (table, obj, groupid) {
    var values = {}
    values.datasetid = table;
    values.name = JSON.stringify(obj);
    values.code = groupid;
    return Query.insert("Forms.dataitems", values);
}

Dataset.deleteId = function (table, id) {
    return Query.delete2("Forms.dataitems", id);
}

Dataset.updateId = function (table, id, name, value) {
    if (name == "groupid") {
        Query.updateId("Forms.dataitems", id, "code", value);
        return;
    }

    var item = Query.selectId("Forms.dataitems", id);
    if (item == null) return;

    var obj = {}
    try {
        obj = JSON.parse(item.name);
    } catch (e) { }
    obj[name] = value;
    Query.updateId("Forms.dataitems", id, "name", JSON.stringify(obj));
}