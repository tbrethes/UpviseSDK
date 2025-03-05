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

//////////////////////////////////
// Add one persistant left pane item to the jobs appid      
var LeftPaneJobExtension = class {
    static {
        Extension.addLeftPane(this, "jobs");
    }

    // NEEDED BY Upvise Extension framework
    static style(id) {
        return "label:My Extension;img:news;";
    }

    // NEEDED BY Upvise Extension framework
    static async run(id) {
        // id is always null for left pane extension
        alert("Left Pane Jpb Extension");
    }
}

//////////////////////////////////
// Add one toolbar button in the Jobs.viewJob() screen
var ViewJobToolbarExtension = class {
    static {
      Extension.addToolbar(this,  "jobs", "Jobs.viewJob");
    }
    
    static style(id) {
        // Note if you want to show the toolbar icon only for some job ids, you can use the id variable and return "" not to show the icon
        return "img:news;label:My Extension";
    }

    static async run(id) {
        alert("jobid: " + id);
    }
}

//////////////////////////////////
// Add one menu item in more popup menu in the Jobs.viewJob() screen
var ViewJobToolbarMoreExtension = class {
    static {
      Extension.addToolbar(this, "jobs", "Jobs.viewJob");
    }
    
    static style(id) {
        // use more:1 to add the extension to the more oppu menu
        return "more:1;img:news;color:blue;label:My Extension";
    }

    static async run(id) {
        alert("jobid: " + id);
    }
}

//////////////////////////////////
// Add one button in the Jobs.viewJob() screen for the appid: jobs app
var ViewJobButtonExtension = class {
    static {
      Extension.addButton(this,  "jobs", "Jobs.viewJob");
    }
    
    static style(id) {
        return "img:news;backcolor:orange;compact:1;label:My Extension";
    }

    static async run(id) {
        alert("jobid: " + id);
    }
}