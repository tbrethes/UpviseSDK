using System;
using System.Diagnostics;

using UpviseClient;

class CacheSample {

    // Sample code to compare performance and amount of records exchanged over the network with new
    // cache mechanism for UpviseClient DLL version 2.0 
    public void Run() {
        
        try {
            // 1. obtain a client connection to a given Upvise Database.
            // Give admin email/password
            Console.WriteLine("Enter Email: ");
            var email = Console.ReadLine();

            Console.WriteLine("Enter password: ");
            var password = Console.ReadLine();
            
            var query = Query.login(email, password);

            // First disable cache
            query.cacheEnabled = false;
            runSelect(query);

            // Second Try : enable cache
            query.cacheEnabled = true;
            query.cacheHours = 24; // cache will be deleted after 24 hours (default is 24 hours)
            runSelect(query);
       
        } catch (Exception e) {
            Console.WriteLine("ERROR: " + e.Message);
        }
    }

    private void runSelect(Query query) {
        var watch = new Stopwatch();
        var records = query.select("Jobs.jobs", "");
        watch.Stop();
        Console.WriteLine("------- cache is " + (query.cacheEnabled ? "ENABLED" : "DISABLED"));
        Console.WriteLine("Records returned by API: " + records.Length);
        Console.WriteLine("Records Returned by server over HTTPS: " + query.lastServerRecordCount);
        Console.WriteLine("Records size retuned by server over HTTPS: " + query.lastServerResponseSize + "bytes");
        Console.WriteLine("API Duration: " + watch.ElapsedMilliseconds + "ms");  
    }

}


