# Upvise Visual Studio Code Plugin

This plugin enables you to create, debug and deploy Upvise Javascript apps (Android, iOs and web) right with Microsoft open source Visual Studio code text editor.

# System Requirements:
1. Windows 10
2. Microsoft Visual Studio Code.

Note : Macos is not currently supported.

# Installation
Download the Upvise Visual StudioCode Plugin.ZIP file 
Unzip it.

# How to create a new UpviseJS Application
Open  a DOS command prompt
navigate to the folder you want to create your UpviseJS source folder.
Type in : **UpviseDev.exe -create myappid**
Where myappid is the ApplicationID of you app (no white space, just letters in lower case).

This will create a new folder containing your source files and required files to work with Visual Studio Code.

# Edit your UpviseJS App files with Visual Studio
Start Visual Studio Code
Open the newly created folder
Start editing your javascript files! 

# Add multiple source files
Create a new javascript file with Visual studio code
Add the relative path of the javaacript file as a new item to the Config.include global variable of your main javascript files.
For example, if you created 2 additional files named "file2.js" and "lib\utils.js" at thr project root, the Config.include variable should look like this:
Config.include = ["file2.js", "lib\utils.js"]l


# Auto Completion.
You can start typing the beginning of any support UpviseJS API like List.addItem() or Toolbar.addButton() and see all available methods signature

# Ressource Strings localization (optional)
If you want to localize our app in multiple languages, you can use R.XXX javascript variables in your code and define the actual translation in multiple languages in the **strings.xslx** file at the root of your project folder. You need Microsoft Excel to edit the file
To generate the javascript resource files for your app, use **Ctrl+Shift+B** to display Visual Studio Code command palette and select **"Upvise Localize Strings"**

# Debug UpviseJS app
You can debug Upvise JS App using the UpviseDev.exe built-in web server.
Type **Ctrl+Shift+B** to display Visual Studio Code command palette and select **Upvise Web Debug**. This will launch your default web browser. You will first be asked to log in to your Upvise Account then your app will be executed.
You can then use your browser's developer tools (Type **Ctrl+Shit+I** on Chrome) and click on the **Source** tab. You can then set breakpoints and debug your code.
You can make changes to your sources files and just reload the web browser to test your code changes without stopping and relaunching your debug session. 

# Deploy Upvise JS app
Once you tested your app on the you can deploy it on your Upvise account and test it on your mobile app (You need to install the Upvise app for Android  iOs and log in with the same account).
first open the jsconfig.json file and replace the email and password fields your your Upvise account credentials. 


Getting Started Guide:


http://developer.upvise.com/gettingstarted.htm
