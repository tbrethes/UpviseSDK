Config.appid = "democard";
Config.version = "1";
Config.title = "Demo Card";
Config.uses = "Forms;Sales;Contacts";

function leftpane() {
  List.show("leftpane");
}

function main() {
    Card.init();
    Card.add("Home Screen", "testHome()", "icon:arrow");
    Card.add("Dashboard Screen", "testDashboard()", "icon:arrow");
    Card.add("Drive Screen", "testDrive()", "icon:arrow");
    Card.add("Tabs Screen", "testTabs()", "icon:arrow");
    Card.add("Button Screen", "testButtons()", "icon:arrow");
    Card.addHeader();
    Card.add("Test All", "testAll()", "icon:arrow");  
    Card.show();
  }
    
  function testHome() {
    Card.init();
    Card.addTitle("Title");
    
    Card.setColumns(2)
    Card.add("Contacts", "test()", "img:contact;color:blue");
    Card.add("Companies", "test()", "img:company;color:green");
    Card.add("Groups", "test()", "img:folder;color:bluegray");
    Card.add("Regions", "test()", "img:pinpoint;color:orange");
    
    Card.addHeader("Secondary Section");
    Card.setColumns(3);
    Card.add("Nearby", "test()", "img:map;");
    Card.add("Settings", "test()", "img:settings");
    Card.add("Recent", "test()", "img:clock");

    Card.addHeader("Action Button Section");
    Card.setColumns(1);
    Card.addButton("Send Email", "test()", "color:blue");
    Card.show();
  }
  
  function testButtons() {
    Card.init();
    Card.addTitle("Title");
    Card.setColumns(1)
    Card.addButton("Send Email", "test()", "color:blue");
    Card.addButton("Attach Photo", "test()", "img:camera;color:green");
    Card.setColumns(2)
    Card.addButton("Send Email", "test()", "img:email;color:blue");
    Card.addButton("Attach Photo", "test()", "img:camera;color:green");
    Card.setColumns(3)
    Card.addButton("", "test()", "img:email;color:blue");
    Card.addButton("", "test()", "img:camera;color:green");
    Card.addButton("", "test()", "img:folder;color:orange");
    Card.show();
  }
  
  function testDashboard() {
    Card.init();
    Card.addTitle("Title");
    Card.setColumns(2)
    Card.add("Overdue", "test()", "img:warning;color:orange;count:123");
    Card.add("Today", "test()", "img:news;color:green;count:5");
    Card.add("Tomorrow", "test()", "img:calendar;color:blue;count:32");
    Card.add("Later", "test()", "img:support;color:bluegray;count:543");
    Card.add("Someday", "test()", "img:support;color:bluegray;count:643");
  
    Card.addHeader("Secondary Section");
    Card.setColumns(1);
    Card.add("Unassigned", "test()", "img:contact;color:teal;count:1234");
    Card.add("Completed", "test()", "img:foldertask;color:bluegray;count:5455");
    
    Card.addHeader("Action Button Section");
    Card.setColumns(2);
    Card.addButton("Send Email", "test()", "img:email;color:blue");
    Card.addButton("Lookup", "test()", "img:search;color:green");
    
    Card.show();
  }
  
  function testDrive() {
    Card.init();
    Card.addTitle("Title");
    Card.setColumns(4);
    Card.add("EWD", "test()", "img:note;grouped:1");
    Card.add("Compliance", "test()", "img:form;grouped:1");
    Card.add("Fault", "test()", "img:job;grouped:1");
    Card.add("Fatigue", "test()", "img:sms;grouped:1");
  
    Card.addHeader("Secondary Section");
    Card.setColumns(1);
    // TODO:
    
    Card.addHeader("Action Button Section");
    Card.addButton("Stop Work", "test()", "color:green");
    Card.show();
  }
  
  function testTabs() {
    Card.init();
    Card.addTitle("Title");
    Card.setColumns(2)
    Card.add("Solo", "test()", "img:contact");
    Card.add("2 Up", "test()", "img:group;backcolor:blue");
  
    Card.addHeader("Action Button Section");
    Card.setColumns(1);
    Card.add("Stop Work", "test()", "backcolor:green");
  
    Card.setColumns(3)
    Card.addButton("Open", "test()", "grouped:1");
    Card.addButton("Closed", "test()", "color:blue;grouped:1");
    Card.addButton("Completed", "test()", "grouped:1");
    
    Card.show();
  }
  
  function testWebUi() {
    
    // Use upvise.call(onclick) API inside the WebView screen to make a call back to upvise app.
    var onclick = "test('Hi guys')";
    onclick = "upvise.call(" + esc(onclick) + ")";
    var html = [];
    html.push('<style>');
    html.push('.button {', 'padding:20px;margin:10px;text-align:center;background-color;green;color;white;font-size:30px', '}');
    htm.push('</style>');
    html.push('<div class="button" onclick="', onclick, '">Callback Upvise</div>');
    html.push('<h1>I can <b>add</b> any <span style="color:blue">HTML</span> here</h1>');
    html.push('<h1>Title 1</h1>');
    html.push('<h2>Title 2</h1>');
    
    var src = "contact";
    if (Settings.getPlatform()== "iphone") src += "@2x";
    src += ".png"
    html.push('<img src="', src, '</>');
    
    var buf = html.join('');
    Web.showUi(html.join(''));  
  }
  
  function test(count) {
      List.addItemTitle("Upvise");
        for (var i = 0; i < 50; i++) {
          List.addItem("Item" + i);
        }
        List.show();
  }
  
  //////
  
  function testAll() {
    Card.init();
    Card.addTitle("Title", "Subtitle");
    Card.addHeader("Label + Icon");
    Card.setColumns(1)
    Card.add("Hello1", "test()", "img:contact;color:blue");
    
    Card.setColumns(2);
    Card.add("Hello1", "test()", "img:contact;color:blue");
    Card.add("Hello2", "test()", "img:contact;backcolor:blue");
    
    Card.setColumns(3);  
    Card.add("Hello1", "test()", "img:contact;color:blue");
    Card.add("Hello2", "test()", "img:contact;color:orange");
    Card.add("Hello3", "test()", "img:contact;backcolor:green");
    
    Card.addHeader("Label + Icon + Count");
    Card.setColumns(1)
    Card.add("Hello1", "test()", "img:contact;color:blue;count:123");
    
    Card.setColumns(2);
    Card.add("Hello1", "test()", "img:contact;color:blue;count:123");
    Card.add("Hello2", "test()", "img:contact;backcolor:blue;count:456");
    
    Card.setColumns(3);  
    Card.add("Hello1", "test()", "img:contact;color:blue;count:123");
    Card.add("Hello2", "test()", "img:contact;color:orange;count:456");
    Card.add("Hello3", "test()", "img:contact;backcolor:green;count:789");
    
    Card.addHeader("Label Only");
    Card.setColumns(1);
    Card.add("Hello1", "test()", "color:blue");
    
    Card.setColumns(2);
    Card.add("Hello1", "test()", "color:blue");
    Card.add("Hello2", "test()", "backcolor:blue");
    
    Card.setColumns(3); 
    Card.add("Hello1", "test()", "color:blue");
    Card.add("Hello2", "test()", "color:orange");
    Card.add("Hello3", "test()", "backcolor:green");
    
    Card.addHeader("Icons only")
    Card.setColumns(1);
    Card.add("", "test()", "img:contact;color:blue");
    
    Card.setColumns(2);
    Card.add("", "test()", "img:contact;color:blue");
    Card.add("", "test()", "img:contact;backcolor:blue");
    
    Card.setColumns(3);  
    Card.add("", "test()", "img:contact;color:blue");
    Card.add("", "test()", "img:contact;color:orange");
    Card.add("", "test()", "img:contact;backcolor:green");
    
    Card.show();
  }