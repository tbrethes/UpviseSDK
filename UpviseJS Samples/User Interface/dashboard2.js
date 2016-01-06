Config.appid = "dashboard2";
Config.version = "1";
Config.title = "Dashboard2";

function leftpane() { List.show("leftpane");}

function main() {
    var templates = Query.select("Forms.templates", "id", "name='MOBIQUEST'");
    var templateid = templates.length == 1 ? templates[0].id : null;
    writeDashboard(templateid);
    List.show();
}

function writeDashboard(templateid) {
 	  var data = getData(templateid); 
  	List.addItemBox("Approved Requests", data.count, "viewList({templateid})", "color:" + Color.GREEN);
  	List.addItemBox("Total Cost", Format.price(data.cost, "MYR", 0), "", "color:" + Color.BLUE);
  	List.addItemBox("Not Covered by framework Agreement", Math.round(data.notcoveredcount/data.count*100) + "%", "",  "color:" + Color.ORANGE);
  	List.addHeader();
  	Layout.firstColumn();
  	writeSupplierChart(data.supplierMap);
  	Layout.secondColumn();
  	writeSiteChart(data.siteMap);
	Layout.stop();
}

function getData(templateid) {
  var data = { count:0, cost:0, notcoveredcount:0, siteMap: new HashMap(), supplierMap:new HashMap(), items:[] };	
  
  var forms = Query.select("Forms.forms", "*", "templateid={templateid} AND status!=-1");
  data.count = forms.length;
  for (var i = 0; i < forms.length; i++) {
    	var form = forms[i];
    	var values = JSON.parse(form.value);
      var item = {id:form.id, date:form.date, owner:form.owner};
    	item.site = values["F4"];
      item.budget = parseFloat(values["F9"]);
      if (isNaN(item.budget)) item.budget = 0;
    	item.currency = values["F10"];
    	item.supplier = values["F5"];
    	item.covered = values["F14"];
      data.cost += item.budget;
      data.siteMap.increment(item.site, 1);
      data.supplierMap.increment(item.supplier, item.budget);
      if (item.covered != "1") data.notcoveredcount += 1;
      data.items.push(item);
  }
  data.supplierMap.sortDescending();
  data.siteMap.sortDescending();
  return data;
}

function writeSupplierChart(map) {
  Chart.init();
  Chart.setTitle("Cost per supplier");
  Chart.addColumn("string");
  Chart.addColumn("number");
  for (var i = 0; i < map.keys.length; i++) {
   	var supplier = map.keys[i];
    var amount = map.get(supplier);
    Chart.addRow(supplier, amount);
    Chart.addRowClick("writeSupplierList({supplier})");
  }
  Chart.show("horizontalbar");
}

function writeSiteChart(map) {
  Chart.init();
  Chart.setTitle("Number of requests per worksite");
  Chart.addColumn("string");
  Chart.addColumn("number");
  for (var i = 0; i < map.keys.length; i++) {
   	var site = map.keys[i];
    var count = map.get(site);
    Chart.addRow(site, count);
  }
  Chart.show("donut");
}

function viewList(templateid) {
  var data = getData(templateid);
  writeMyList(data.items);
  List.show();
}

function writeMyList(forms) {
  List.addHeader(["Site", "Supplier", "Budget", "Date", "By"], [null, null, "200px", "200px", "200px"]);
  for (var i = 0; i < forms.length; i++) {
    var form = forms[i];
    List.add([form.site, form.supplier, Format.price(form.budget, "RMY", 0), Format.date(form.date), form.owner], "Forms.viewForm({form.id})"); 
  }   
}