import java.net.UnknownHostException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.json.JSONArray;
import org.json.JSONObject;

import com.upvise.client.AuthRequest;
import com.upvise.client.FileQuery;
import com.upvise.client.Query;

public class FileSample {
	
	  public static void main(String[] args) {
		  
		// 1. Login to the correct Customer Database
		String token = null;
		try {
			token = AuthRequest.Login("youremail", "yourpassword");
		} catch (UnknownHostException e) {
			System.out.println("No Internet Connection or Upvise Server unavailable");
			return;
		}  catch (Exception e) {
			System.out.println(e.getMessage());
			return;
		}
		
		if (token == null) {
			System.out.println("token null : bad email or password");
			return;
		}
		
		// 2. Create a Query object
		try {
			FileQuery fileQuery = new FileQuery(token);
			
			// Returns all files info linked to the contact record id=contact123
			JSONArray fileList = fileQuery.selectFiles("contacts.contacts", "contact123"); 
						 
			// For each file, get its contents and save it to disk
			for (int i = 0; i < fileList.length(); i++) {
				JSONObject file = fileList.getJSONObject(i);
				String fileid = file.getString("id");
				String name = file.getString("name");
				String owner = file.getString("owner");
				String mime = file.getString("mime");
				long size = file.getLong("size");
				byte[] content = fileQuery.getFileContents(fileid);
					
				Path path = Paths.get("C:\\temp\\" + name);
				Files.write(path, content);
			}
			
			// Create a new Contact and attach one file to it.
			Query query = new Query(token);
			JSONObject contact = new JSONObject();
			contact.put("id", "contact123");
			contact.put("name", "AAAA123");
			contact.put("email", "aaaa123@gmail.com");
			query.insert("contacts.contacts", contact);
			query.execute();			
			
			// Upload a local file to contactid=contact123
			String fileid = "file123";
			String owner = "";
			String linkedtable = "contacts.contacts";
			String linkedid = "contact123";
			fileQuery.insertLocalFile("C:\\temp\\photo.jpg", fileid, linkedtable, linkedid, owner);
						
		} catch (Exception e) {
			System.out.println(e.getMessage());
		}
	}

	
}
