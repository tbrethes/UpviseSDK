Config.appid = "mydashboard";
Config.version = "1";
Config.title = "Dashboard";
Config.uses = "Projects;Forms;Tools;Contacts;Time;Qhse";
Config.debug = true;

function leftpane() {
    List.addItem("Dashboard App");
    List.show("leftpane");
}

function main() {
    if (WEB() == false) {
        List.addItemTitle("Welcome", User.getName());

        List.addButton("Alert", "test()", "color:red");
        List.addItem("My Team", "Contacts.viewMyTeam()", "img:group;icon:arrow");
        List.addItem("Timesheets", "Time.main()", "img:clock;icon:arrow");
        List.addItem("Nearby Projects", "Projects.showNearby()", "img:project;icon:arrow");
        List.addItem("Forms", "Forms.main()", "img:form;icon:arrow");
        List.addItem("Equipment", "Tools.main()", "img:job;icon:arrow");
        List.addItem("Quest", "Qhse.main()", "img:support;icon:arrow");
        List.show();
    } else {
        List.addItemTitle("Welcome", User.getName());
        Layout.firstColumn();
        Grid.add("Timesheets", "AppLoader.openApp('time')", "img:clock");
        Grid.add("Contacts", "AppLoader.openApp('contacts')", "img:contact");
        Grid.add("Projects", "AppLoader.openApp('projects')", "img:project");
        Grid.add("Equipment", "AppLoader.openApp('tools')", "img:job");
        Grid.add("Forms", "AppLoader.openApp('forms')", "img:form");
        Grid.add("Knowledge Base", "AppLoader.openApp('qhse')", "img:app");

        Layout.secondColumn();
        var IMGURL = "https://www.upvise.com/jobs/img/mobilejob2.png";
        List.addImage(IMGURL);
        
        Layout.stop();
        Grid.show();
    }
}