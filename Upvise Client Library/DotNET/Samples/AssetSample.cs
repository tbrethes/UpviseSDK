/*
 * Copyright (C) 2016 Upvise
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
using System;
using com.upvise.client;

namespace com.upvise.samples {

    public class AssetSample {

        public void run() {
            try {
                // Login
                string token = Query.login("demobiz@upvise.com", "demobiz");
                Query query = new Query(token);

                // 3. Returns all Assets with no geocode
                JSONObject where = new JSONObject();
                where.put("geo", "");
                JSONObject[] assets = query.select("Assets.assets", where);
                foreach (JSONObject obj in assets) {
                    Console.WriteLine(obj.serialize());
                }

                // Update the first asset with a geo location
                JSONObject firstAsset = (assets.Length > 0) ? assets[0] : null;
                if (firstAsset != null) {
                    JSONObject asset = new JSONObject();
                    asset.put("geo", "51.522020,-0.122198");
                    query.updateId("assets.assets", firstAsset.getString("id"), asset);
                }

                // Insert a new Asset
                JSONObject newAsset = new JSONObject();
                newAsset.put("id", "69794");
                newAsset.put("name", "My Assset");
                newAsset.put("model", "Fiat");
                newAsset.put("geo", "48.858238, 2.347918");
                newAsset.put("serialnumber", "69493949658TYH");
                newAsset.putDate("purchasedate", DateTime.Now);
                newAsset.put("purchaseprice", 12.4f);
                newAsset.put("manufacturer", "Foxconn");
                newAsset.put("geo", "48.858238,2.347918");
                query.insert("assets.assets", newAsset);

            } catch (Exception e) {
                Console.WriteLine(e.Message);
            }
        }
	}	
}
