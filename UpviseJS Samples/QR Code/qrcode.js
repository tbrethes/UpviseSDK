Config.appid = "qrcode";
Config.version = "10";
Config.title = "QR Code Sample";
Config.tables["products"] = "id;name;code";

function main() {
    if (WEB()) History.redirect("mainWeb()");
    else History.redirect("mainMobile()");
}

function mainMobile() {
    Toolbar.addButton("New", "newProduct()", "new");
    List.addItemTitle("QR Code Sample");
  	var onscan = "onScan(this.value)";
    List.addButton("Scan Code", "App.scanCode({onscan})");
  	var info = [];
  	info.push("1. Tap + to add a new a product.");
  	info.push("2. Fill in the code field.");
  	info.push("3. On Web, click Generate QR Code & print");
  	info.push("4. Scan the QR Code from the mobile app");
  	List.addItemLabel("How to use", info.join("\n"));
  	List.addHeader("Products");
    List.bindItemSubtitles("products", "name;code", null, "name", "viewProduct(this.id)");
    List.show();
}

function mainWeb() {
    Toolbar.addButton("New", "newProduct()", "new");
    Toolbar.addButton("Generate QR Code", "exportQRCodes()");    
    
    var products = Query.select("products", "*", null, "name");
    List.addHeader(["Name", "Code", ""]);
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        List.add([product.name, product.code, ""], "viewProduct({product.id})");
    }
    List.show();
}

function exportPopup() {
    Popup.add("QR Code", "exportQRCodes()", "img:qrcode");
    Popup.show();
}

function exportQRCodes(productid) {
  	var where = (productid != null) ? "id={productid}" : null;
    var qrcode = new QRCode();
    var products = Query.select("products", "name,code", where, "name");
    for (var i = 0; i < products.length; i++) {
        var product = products[i];
        qrcode.add(product.code, product.name);
    }
    qrcode.download("QRCode");
}

function leftpane() {
    
}

function onScan(value) {
    var products = Query.select("products", "id;name;code", "code={value}");
    if (products.length == 0) {
        List.addItemTitle("No Product found", "for code: " + value);
        List.show();
    } else {
        var product = products[0];
        History.redirect("viewProduct({product.id})");
    }
}

function viewProducts() {
    var where = null;
    var orderby = "name";
    List.bindItemSubtitles("products", "name;code", where, orderby, "viewProduct(this.id)");
    List.show();    
}

function viewProduct(id) {
    var product = Query.selectId("products", id);
    if (product == null) {History.back(); return;}
    Toolbar.setTitle("Product");
    Toolbar.addButton("Edit", "editProduct({id})", "edit");
  	if (WEB()) Toolbar.addButton("Generate QR Code", "exportQRCodes({id})");
    List.addItemTitle(product.name);
    List.addItemLabel("Code", product.code);
    List.show();
}

function newProduct() {
  var id = Query.insert("products", {});
  History.redirect("editProduct({id})");
}

function editProduct(id) {
     var product = Query.selectId("products", id);
    if (product == null) {History.back(); return;}
    var onchange = "Query.updateId('products',{id},this.id,this.value)";
    Toolbar.setStyle("edit");
    Toolbar.addButton("Delete", "deleteProduct({id})", "delete");
    List.addTextBox("name", "Name", product.name, onchange);
    List.addTextBox("code", "Code", product.code, onchange);
    List.show();
}

function deleteProduct(id) {
  	Query.deleteId("products", id);
  	History.back();
}