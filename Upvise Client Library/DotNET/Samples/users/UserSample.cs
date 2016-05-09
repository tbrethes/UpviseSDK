using com.upvise.client;
using System;
using System.Collections.Generic;

namespace UpviseClientTest {
    class UserSample {

        public void run() {

            string[] EMAILS = { "testx1@upvise.com", "testx2@upvise.com", "testx3@upvise.com" };
            string[] NAMES = { "Name1 Changed", "Name2", "Name3" };
            
            string token = Query.login("email", "password");
            Query query = new Query(token);

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
        }
    }
}
