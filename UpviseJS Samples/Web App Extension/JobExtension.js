/*
 * Copyright (C) 2025 Upvise
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

class JobExtension1 extends Extension {

    static {
        super.register();
    }
    
    static style(id) {
        // Note if you want to show the toolbar icon only for some job ids, you can use the id variable and return "" not to show the icon
        return "img:news;color:bluelabel:My Extension";
    }

    static async run(id) {
        alert("jobid: " + id);
    }
}