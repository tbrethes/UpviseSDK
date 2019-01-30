using com.upvise.client;
using System;
using System.Collections.Generic;

namespace com.upvise.samples {

    class UserSample {

        public void Run() {

            string[] EMAILS = { "testx1@upvise.com", "testx2@upvise.com", "testx3@upvise.com" };
            string[] NAMES = { "Name1 Changed", "Name2", "Name3" };

            Query query = Query.login("email", "password");
           
            Dictionary<string, User> UpviseUsersIndex = new Dictionary<string, User>();
             
            // Select Upvise users and adds them in a Dictionarry
            User[] users = User.selectUsers(query);
            foreach (User user in users) {
                Console.WriteLine(user.email + " " + user.name + " " + user.type);
                UpviseUsersIndex[user.email] = user;
            }
            
            for (int i = 0; i < EMAILS.Length; i++) {
                string email = EMAILS[i];
                string name = NAMES[i];
                if (UpviseUsersIndex.ContainsKey(email) == false) {
                    // user will receive an email to change its Upvise password
                    User.createUser(query, name, email, "randompassword");
                } else {
                    User user = UpviseUsersIndex[email];
                    if (user.active == false) {
                        user.activateUser();
                    }
                    if (user.name != name) {
                        user.changeName(name);
                    }
                }
            }

            // Desativate the first user
            users = User.selectUsers(query);
            foreach (User user in users) {
                if (user.email == EMAILS[0]) {
                    user.deactivateUser();
                    Console.WriteLine("Deactivated : " + user.email + " " + user.name + " ");
                    break;
                }
            }
        }
    }
}
