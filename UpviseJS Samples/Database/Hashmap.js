function main() {

    var quoteid = "13344"; // replace by a real quote ID
    // use the Upvise HashMap class, the key is the product name and the value is the amount
    var map = new HashMap();

    // get the total amount accumulated per productname in the map object
    var items = Query.select("Sales.quoteproducts", "*", "quoteid={quoteid}");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        // compute the amount for this entry
        var amount = item.quantity * item.price;
        // add this amount of the entry of the HashMap defined by productname as key
        map.increment(item.productname, amount);
    }

    // Now iterate on each key (product name of the map object and get the value (total amount)
    for (var i = 0; i < map.keys.length; i++) {
        var key = map.keys[i];
        var productname = key;
        var amount = map.get(key);
        List.addItemSubtitle(productname, Format.price(amount));
    }
    List.show();
}