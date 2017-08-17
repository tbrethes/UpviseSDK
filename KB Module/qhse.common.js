
Qhse.hasRight = function (value) {
    if (User.isAdmin()) return true;
    if (value == "edit") {
        return User.isManager() && AccountSettings.get("qhse.edit.admin") != "1";
    } else {
        return false;
    }
}