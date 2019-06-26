Config.appid = "newformtest";
Config.version = "1";
Config.title = "New Form Test";
Config.uses = "Forms"; // essential to be able to call the Upvise Forms App functions

function main() {
  var templateName = "Meeting"; // change it to your template name

  // Get the templateId from the templateName
  var templates = Query.select("Forms.templates", "id", "name={templateName}");
  var templateId = templates[0].id;

  // Add a button to create a new form
  List.addButton("New Form", "Forms.newForm({templateId})");
  
  // Add the list of created forms
  List.addHeader(templateName);
  var forms = Query.select("Forms.forms", "id;name;date", "templateid={templateId}", "date");
  for (var i = 0; i < forms.length; i++) {
  	var form = forms[i];
    List.addItemSubtitle(form.name, Format.date(form.date), "Forms.viewForm({form.id})", "img:form");
  }
  List.show();
}  