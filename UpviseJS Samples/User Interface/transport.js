Config.appid = "transport";
Config.version = "935";
Config.title = "Transport Demo";
Config.uses = "Forms;Contacts";

Config.appRank = 2;
Config.appIcon = "truck";

function leftpane() {
	List.addHeader(Format.datetime(Date.now()));
  	List.add("Driver's Dashboard", "showDriver(0)", "img:truck;color:green");
    List.addHeader("Features");
  	List.add("EWD", "showEWD()", "img:note");
    List.add("Compliance", "allocateAssets()", "img:form");
    List.add("Fault", "showFault(0)", "img:job");
    List.add("Fatigue", "showFatigue()", "img:sms");
  	List.addHeader("");
  	List.add("Change Driver", "selectDriver(0)", "img:settings");
    List.show("leftpane");
}

function main() {
	History.redirect("selectDriver(0)");
}

function selectDriver(tab) {
  	Toolbar.setTitle("Driver Type");
	Card.init();
	initCustom();
  	if (Settings.isTablet() == false) {
      Card.addCss(".card img.icon", "width:60px;height:60px;")
      Card.addCss(".line img.icon", "width:30px;height:30px;")
      Card.addCss(".card .text", "font-size:20px;font-weight:bold");
    }
  	Card.setColumns(2)
    Card.addButton("Solo", "History.reload('selectDriver(0)')", "img:contact;width:60px" + (tab==0 ? ";color:blue" : "") );
  	Card.addButton("2 Up", "History.reload('selectDriver(1)')", "img:group;width:60px" + (tab==1 ? ";color:blue" : "") );
 	Card.addHeader("Select Driver");
  	Card.setColumns(1);
  	Card.add("Search & Select Driver", "showDriverList()", "img:search");
  	Card.addHeader("Recent Drivers");
	let style = "img:contact;color:teal;count:" + Card._icon(tab==0?"next" : "plus");
  	Card.add("Benjamin Franklin", "showDriver()", style); 
    Card.add("Theodore Roosevelt", "showDriver()", style);
    Card.add("John Mc Cartney", "showDriver()", style);
   	Card.show();
}

function showDriverList() {
  	Toolbar.setTitle("");
  	Toolbar.setStyle("search");
  	List.addItemTitle("Select Driver");
  	let contacts = Query.select("Contacts.contacts", "id;name", "", "name");
  	for (contact of contacts) {
    	List.addItem(contact.name, "onDriverSelected({contact.id})", "img:contact");
  	}
  	List.show();
}

function onDriverSelected(driverid) {
  	History.remove(1);
  	History.redirect("showDriver(0)");
}

function showDriver(status) {
	if (!status) status = 0;
  	Toolbar.addButton("Info", "", "info");
  	Card.init();
	initCustom();
  	 
  	if (Settings.isTablet() == false) {
      Card.addTitle(Format.datetime(Date.now()));
      Card.setColumns(4);
      Card.add("EWD", "showEWD()", "img:note;grouped:1");
      Card.add("Compliance", "allocateAssets()", "img:form;grouped:1");
      Card.add("Fault", "showFault(0)", "img:job;grouped:1");
      Card.add("Fatigue", "showFatigue()", "img:sms;grouped:1");
    }
	Card.setColumns(1);
  	
  	let tag = (status == 0) ? Tag.add("&#9679; Resting", "red") : Tag.add("&#9679; Working", "green"); 
    Card.html.push('<div style="float:right;margin-bottom:0">', tag, "</div>");
  	
  	let buttonLabel = (status == 0) ? "Start Drive" : "End Shift"; 
  	let buttonColor =  (status == 0) ? Color.GREEN : Color.BLUE; 
  	let buttonFunc = "History.reload('showDriver(" + (status?0:1) + ")')";
  	
  	let gaugeLabel = (status == 0) ? "04:00" : "57:03";
    let gaugeAngle = (status == 0) ? 300 : 330;
  	
  	Gauge.add(gaugeLabel, 0, gaugeAngle, buttonColor);
  	Card.addButton(buttonLabel, buttonFunc, "color:" + buttonColor);
	Card.show(); 
}

function showEWD() {
  	Toolbar.setTitle("EWD");
	Toolbar.addButton("Info", "", "info");
  	Toolbar.setStyle("nextprevious");
 	Card.init();
  	initCustom();
    Card.setColumns(2);
  	if (Settings.isTablet()) {
     	Card.add("Total Work", "", "img:truck;color:teal;count:" +  duration1(8, 5));
  		Card.add("Total Rest", "", "img:clock;color:red;count:" + duration1(0, 25));
    } else {
		Card.addTitle(Format.datetime(Date.now()));
  		Card.addLabel("Total Work", duration1(8, 5), "", "img:truck;color:teal;align:left");
  		Card.addLabel("Total Rest", duration1(0, 25), "", "img:clock;color:red;align:left");
    }

	Card.setColumns(1);
  	Card.html.push('<div class="card">');
  	addEntry("7:30AM", "Work", "Renmark", "first:1");
  	addEntry("12:30PM", "Rest", "Mildura", "color:blue");
  	addEntry("12:47PM", "Work", "Mildura", "color:blue");
  	addEntry("04:05PM", "Rest", "Paris", "color:blue");
  	Card.html.push('</div>');
    Card.show();
}

function showFatigue() {
  	Toolbar.setTitle("Fatique Overview");
	Toolbar.addButton("Info", "", "info");
  	Card.init();
	initCustom();
  	Card.setColumns(Settings.isTablet() ? 3 : 2);
  	Card.addHeader("BFM Fatique Scheme");
  	Card.addLabel("144h Rest in", duration2(124, 12));
    Card.addLabel("72h Rest in", duration2(67, 21));
    Card.addLabel("24h Rest in", duration2(2, 21));
    Card.addLabel("Night Rests taken", "2");
  	Card.addLabel("Night &amp; long hours remaining", duration2(7, 21), ""); 
  	Card.addHeader("Since Last Major Break");
  	Card.addLabel("Worked", duration2(7, 19));
    Card.addLabel("Rested", duration2(4, 23)); 
    Card.show();
}

// Base 64 encoded images

var truckSrc = "data:image/jpeg;base64,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";
var trailer1Src = "data:image/jpeg;base64,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";
var trailer2Src = "data:image/jpeg;base64,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";
var tesla1Src = "data:image/jpeg;base64,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";

function showFault(status) {
	if (!status) status = 0;
  	Toolbar.setTitle("DMR")
	Toolbar.addButton("New", "", "new");
	Card.init();
  	initCustom();	
  	Card.setColumns(1);
  	Card.addImage(truckSrc, text("ZCD 933"), "", "width:100;align:right");
    Card.addHeader("Driver Maintenance Request");
    Card.setColumns(2);
  	Card.addButton("Open","History.reload('showFault(0)')", "grouped:1" + (status==0 ? ";color:blue" : "") );
  	Card.addButton("Closed", "History.reload('showFault(1)')", "grouped:1" + (status==1 ? ";color:blue" : "") );
      
    Card.setColumns(1);
  	if (status == 0) {
      Card.add(text("#7709", "Faulty Brakes", Color.RED), "", "img:warning;color:red;align:right");
      Card.add(text("#8810", "Deflated Tires"), "", "img:warning;color:yellow;align:right");
      Card.add(text("#7706", "Dashcam Faulty"), "", "img:warning;color:yellow;align:right");
    } else if (status == 1) {
        Card.add(text("#8814", "Deflated Tires"), "", "img:warning;color:blue;align:right");
    }
  	Card.show();
}

function allocateAssets() {
  	Toolbar.setTitle("Assets");
	Toolbar.addButton("Info", "", "info");
	Card.init();
  	initCustom();
  	if (!Settings.isTablet()) Card.addHeader("Allocated Assets");
	
  	Card.setColumns(2);
   	Card.addButton("Lookup", "", "img:search");
  	Card.addButton("Scan", "", "img:camera");
  	Card.addHeader();
  	Card.addImage(truckSrc, text("ZCD 933", "aaa"), "", "width:100;align:center");
  	Card.addImage(trailer1Src, text("V2064", "AMD 291"), "", "width:100;align:center");
  	Card.addImage(trailer2Src, text("A7199", "AB2 399"), "", "width:100;align:center");
  	Card.addImage(tesla1Src, text("TELSA SEMI", "SN 2"), "", "width:100;align:center");
  	Card.show();
}

//////////////// Card Customization 

function addEntry(time, type, location, style) {
  	style = Card._style(style);
  	const icon = Card._icon("pinpoint", style.first ? Color.TEAL : Color.BLUE);
  	const borderRight = style.first ? "" : "border-right:4px solid " + Color.BLUE;
    Card.html.push('<div style="width:127px;padding-top:10px;', borderRight, '"><b>', time, '</b></div>');
  	Card.html.push('<div class=line>');
  	Card.html.push(Tag.add(type, (type == "Work") ? "green" : "red"));
  	Card.html.push(icon);
  	Card.html.push(Tag.add(location, "gray"));
  	Card.html.push('</div>'); 
}

function text(title, subtitle, color) {
 	let buf = '<b>' + title + '</b>';
  	if (subtitle) {
    	if (color) subtitle = '<span style="color:' + color + '">' + subtitle + '</span>';
		buf += '<br/>' + subtitle;
    }
  	return buf;
}

function duration1(hours, minutes) {
	let buf = "";
  	if (hours > 0) buf += hours +  "hrs&nbsp;";  
  	if (minutes > 0) {
		if (minutes < 10) hours = "0" + minutes;
    	buf += minutes +  "&nbsp;min";
    }
    return buf;
}

function duration2(hours, minutes) {
	if (hours < 10) hours = "0" + hours;
  	return hours + "h&nbsp;<small>" + minutes + '&nbsp;min</small>';
}

function initCustom() {
     // Override default background color
	 Card.addCss("body", "background-color:#F4F1F9;");
 	 Card.addCss(".card", "box-shadow:2px 2px 2px 1px rgba(0, 0, 0, 0.2);");
  
  	// make icon bakground round
  	Card.addCss("img.icon", "border-radius:30px;padding:10px");
    
  	// override header style
  	Card.addCss('.header', 'text-transform:capitalize;color:#555;font-size:26px;margin-top:20px;margin-bottom:20px;');
  
  	// override the card value style
  	Card.addCss(".card .value", "font-size:32px;font-weight:bold;margin-top:5px");
  	Card.addCss(".card .value small", "font-size:18px;color:gray;");

  	Card.addCss(".tag", "display:inline-block;padding:5px;border:2px solid;border-radius:20px;min-width:80px;text-align:center;margin-right:10px;");
	Card.addCss(".green", "color:#4AC4AF;border-color:#4AC4AF;background-color:#EFFFFE;");
 	Card.addCss(".red", "color:red;border-color:#FC524B;background-color:#FFF6F5;");
  	Card.addCss(".gray", "border-radius:10px;border-color:lightgray;flex:auto;margin-right:0px;");
     
  	// Override colors
    Color.GREEN = "#5DC468";
  	Color.RED  ="#FC524B";
	Color.TEAL = "#4AC4AF";
	Color.BLUE = "#0AA5FD";
  	
  	Gauge.THICKNESS = 10;
	Gauge.HMARGIN = Settings.isTablet() ? 140 : 20;
}

/////////////////////////////////

class Tag {
	static add(title, color) {
  		var buf = [];
  		buf.push('<span class="tag ', color, '">', title, '</span>');
  		return buf.join(''); 
  	}
}

///////////////////////////////

 class Gauge {
        static _polarToCartesian(cx, cy, radius, degrees) {
            const radians = (degrees-90) * Math.PI / 180.0;
                return {
                    x: cx + (radius * Math.cos(radians)),
                    y: cy + (radius * Math.sin(radians))
                };
        }

        static _describeArc(cx, cy, radius, startAngle, endAngle){
            const start = Gauge._polarToCartesian(cx, cy, radius, endAngle);
            const end = Gauge._polarToCartesian(cx, cy, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            const d = [
                "M", start.x, start.y, 
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
            ].join(" ");
            return d;       
        }

        static add(value, startAngle, endAngle, color) {  
            const cx = 50;
            const cy = 50;
            const radius = 40;
            const backColor = "#F1F1F1";
            let dBack = Gauge._describeArc(cx, cy, radius, 1, 360);
            let d = Gauge._describeArc(cx, cy, radius, startAngle, endAngle);
            let buf = [];
          	let style = "margin-left:" + Gauge.HMARGIN + "px;margin-right:" + Gauge.HMARGIN + "px";
            buf.push('<svg viewBox="0 0 100 100" style="', style, '">');
            buf.push('<path fill="none" stroke="', backColor, '" stroke-width="', Gauge.THICKNESS, '" d="', dBack, '" />');
            buf.push('<path fill="none" stroke="', color, '" stroke-linecap="round" stroke-width="', Gauge.THICKNESS, '" d="', d, '" />');   
            buf.push('<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="', color, '">', value, '</text>');
            buf.push('</svg>');
          
          	Card.html.push( buf.join(''));
        }  
    }  
    Gauge.HMARGIN = 20;
    Gauge.THICKNESS = 5;

