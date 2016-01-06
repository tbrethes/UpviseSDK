import java.util.Date;

import com.upvise.client.AuthRequest;
import com.upvise.client.FormQuery;
import com.upvise.client.FormTemplateQuery;

import org.json.JSONObject;
import org.json.JSONArray;

public class FormSample {
	
	
	public static void main(String[] args) {
		try {
			test();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public static void test() throws Exception {
		// Step 1: Login to the correct Customer Database
		String token = 	AuthRequest.Login("compass@upvise.com", "upvise1");
		if (token == null) {
			System.out.println("token null : bad email or password");
			return;
		}
		
		// Step 2: get the Template record and the associated field records.
		FormTemplateQuery templateQuery = new FormTemplateQuery(token);
		JSONObject template = templateQuery.selectByName("Form No -E34");
		if (template == null) {
			System.out.println("Template Name not found");
			return;
		} 
		
		// get the template ID
		String templateId = template.getString("id");
		
		// Get All Fields for the template
		JSONArray fields = templateQuery.selectFields(templateId);
		for(int i = 0; i < fields.length(); i++) {
			JSONObject field = fields.getJSONObject(i);
			String name = field.getString("name");
			String label = field.getString("label");
			String type = field.getString("type");
			System.out.println("Field ID: " + name + "(" + type + "), Label: " + label);
		}
				
		// Step 3: get all forms for this template ID
		FormQuery formQuery = new FormQuery(token);
		JSONArray forms = formQuery.select(templateId);
		
		// Iterate through all form records
		for (int i = 0; i < forms.length(); i++) {
			JSONObject form = forms.getJSONObject(i);
			
			String formid = form.getString("id");
			String owner = form.getString("owner");
			long date = form.getLong("date");
			String address = form.getString("address");
			int status = form.getInt("status"); // 0 : Draft, 1 : Submitted
			
			System.out.println("Form ID: " + formid + ", Date: " + new Date(date).toString() + " owner:" + owner + ", address: " + address);
			
			// The value properties is an JSON Object encoded string containing all form values 
			JSONObject jsonValue = new JSONObject(form.getString("value"));
			JSONArray names = jsonValue.names();
			if (names != null) 
				for(int j = 0; j < names.length(); j++) {
					String name = names.getString(j);
					String value = jsonValue.getString(name);
					
					System.out.println(name + ": " + value);
				}
			}
		}
		
}

