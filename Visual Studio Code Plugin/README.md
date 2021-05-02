# Upvise Visual Studio Code Plugin

This plugin enables you to create, debug and deploy Upvise Javascript apps (Android, iOs and web) right with Microsoft open source Visual Studio code text editor.

# System Requirements:
1. Windows 10 or MacOs
2. [.NET Runtime 5.0.5](https://dotnet.microsoft.com/download/dotnet/5.0)
3. [Microsoft Visual Studio Code](https://code.visualstudio.com/)

# Installation
1. **Download** the Upvise Visual StudioCode Plugin [UpvisePluginVSCode.zip](UpvisePluginVSCode.zip) file 
2. **Unzip it and save it**  into a folder location on your PC.

# How to create a new UpviseJS Application
1. Start Visual Studio Code. Click on **Terminal / New Terminal** on the menu bar
2. navigate to the location where the UpviseJS Plugin was unzipped using the **dir** command
3. Type in : **upvisedev.exe -create [myfolder] [myappid]**
Where **myfolder** is the base folder your want to create your UpviseJS app
and **myappid** is the ApplicationID of you app (no white space, just letters in lower case).

This will create a new folder named myappid containing your source files and required files to work with Visual Studio Code.

# Edit your UpviseJS App files
1. Start Visual Studio Code
2. Open the newly created application folder by clicking on **File / Open Folder** in the menu bar
3. Start editing your javascript files! 

# Add multiple source files
1. **Create a new javascript file** with Visual studio code by clicking on **File / New File** in the menu bar
2. Add the **relative path** of the javascript file as a new string to the **Config.include** global array variable of your main javascript file.

For example, if you created 2 additional files named "file2.js" and "lib\utils.js" at the project root, the Config.include variable should look like this:

Config.include = ["file2.js", "lib\utils.js"]l

# Auto Completion.
Start typing the beginning of any support UpviseJS API like List.addItem() or Toolbar.addButton() and see all available methods signature

# Source Code Control
You can use Microsoft Visual Studio Code support for source code control integration like Git. [More info here](https://code.visualstudio.com/docs/editor/versioncontrol) 

# Ressource Strings localization (optional)
1. If you want to localize our app in multiple languages, you can use **R.XXX** javascript variables in your code
2. Define the actual translation in multiple languages in the **strings.xslx** file at the root of your project folder.
3. You need **Microsoft Excel** to edit the file
4. To generate the javascript resource files for your app, use **Ctrl+Shift+B** to display Visual Studio Code command palette and select **"Upvise Localize Strings"**

# Debug UpviseJS app
You can debug Upvise JS App using the Upvise VS Code plugin **built-in web server**.

1. Type **Ctrl+Shift+B** to display Visual Studio Code **command palette** and select **Upvise Web Debug**. This will launch your default web browser. You will first be asked to log in to your Upvise Account then your app will be executed.
2. Open your **browser's developer tools** (Type **Ctrl+Shit+I** on Chrome) and click on the **Source** tab. You can then set breakpoints and debug your code.
3. Make changes to your sources files and just reload the web browser to test your code changes **without stopping and relaunching** your debug session. 

# Deploy Upvise JS app
1. Once you tested your app on the web, deploy it on your Upvise account and test it on your mobile phone (Android or iPhone)
2. Make sure you **installed the Upvise app** for Android or iOs and **log in** with the same account.
2. Open the **jsconfig.json** file at your project root and replace the email and password fields your your Upvise account credentials. 
3. Use **Ctrl+Shift+B** to display Visual Studio Code **command palette** and select **Upvise Deploy**


# Custom Dashboard
You use can use Visual Studio to manage your custom dashboards screen for different Upvise Web Applications.

**Create**
1. Start Visual Studio Code. Click on **Terminal / New Terminal** on the menu bar
2. navigate to the location where the UpviseJS Plugin was unzipped using the **dir** command or **ls** command on MacOs 
3. Type in : **upvisedev.exe -createdashboard [myfolder] [kind]**

**myfolder** is the base folder your want to create your UpviseJS app

**kind** is the kind of dashboard to create: **projects, project, forms, tools, assets, sales.quote, sales.deal, sales.invoice, sales.po, sales.catalog, sales.contract**

This will create a new folder or add a new dashboard to the existing folder containing your source files and required files to work with Visual Studio Code.

**Deploy**
1. Set your Upvise email / password in the **jsconfig.json** file
2. **Open the file** containing the dashboard main method you want to deploy
3. Type **Ctrl+Shift+B** to display Visual Studio Code **command palette** and select **Upvise Deploy Dashboard**

# Getting Started Guide on UpviseJS API 
https://www.upvise.com/dev/home/gettingstarted.htm
