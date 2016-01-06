
import java.net.UnknownHostException;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONObject;

import com.upvise.client.AuthRequest;
import com.upvise.client.Query;

public class Assets {
	
	  public static void main(String[] args) {
		  
		// 1. Login to the correct Customer Database
		String token = null;
		try {
			// replace email and password with valid Upvise accoutn credentials
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
			Query query = new Query(token);
		
			// 3. Returns all Assets with no geocode
			// SQL Equivalent: SELECT * FROM [assets.assets] WHERE geo=''
			JSONObject where = new JSONObject();
			where.put("geo", "");
			JSONArray assetList = query.select("assets.assets", where);
			for (int i = 0; i < assetList.length(); i++) {
				JSONObject asset = assetList.getJSONObject(i);
				System.out.println(asset.toString());
			}
						
			// Update the first asset with a geo location
			// SQL Equivalent: UPDATE [assets.assets] SET geo='lat,long' WHERE id='recordid'
			JSONObject firstAsset = assetList.length() > 0 ? assetList.getJSONObject(0) : null;
			if (firstAsset != null) {
				JSONObject asset = new JSONObject();
				asset.put("geo", "51.522020,-0.122198");
				query.updateId("assets.assets", firstAsset.getString("id"), asset);
			}
			query.execute();
			
			// Insert a new Asset
			// Asset column names are id;name;model;serialnumber;description;groupid;location;geo;locationid;owner;purchasedate DATE;purchaseprice REAL;
			// depreciation REAL;companyid;contactid;relatedid;manufacturer;custom;regionid";
			JSONObject newAsset = new JSONObject();
			newAsset.put("id", "69794");
			newAsset.put("name", "My Assset");
			newAsset.put("model", "Fiat");
			newAsset.put("geo", "48.858238, 2.347918");
			newAsset.put("serialnumber", "69493949658TYH");
			newAsset.put("purchasedate", new Date().getTime());
			newAsset.put("purchaseprice", 12.4f);
			newAsset.put("manufacturer", "Foxconn");
			newAsset.put("geo", "48.858238,2.347918");
			query.insert("assets.assets", newAsset);
			query.execute();
			
		} catch (Exception e) {
			System.out.println(e.getMessage());
		}
	}	
}
