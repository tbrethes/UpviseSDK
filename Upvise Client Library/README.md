# Upvise Client Library for .NET

The Upvise Client Library for .NET allows you to make direct HTTPS calls to the Upvise Cloud Database, from any client program. runnning on a desktop or server machine. You can query any application table, download and upload files to your Upvise account.

**Current Version: v4.4**, released **May 7th, 2025**

[Programming guide & API Reference](https://www.upvise.com/dev/guide/webservice.htm)

Requirements:
.NET Framework v4.8.1 or higher
or .NET 6 or higher

Runtime Requirements:
Needs full access right to local path **C:\ProgramData\Upvise**  or user **HOME** folder for local cache.

Usage of the Upvise Client Library is suject to our [API Tems of Use](https://www.upvise.com/legal/apitermsofuse.htm)


# Release notes v4.6
1. Local File Cache optimization to reduce lock duration
2. new optional **Query.enableMemoryCache = true** static property to use memory cache in addition to file cache

# Release notes v4.4

1. Fixed bug with table with no record in Query.select()

# Release notes v4.3

1. **Query.selectArchived(table, where, offset=0)** has a new optional **offset** param and returns only Query.MAX_ARCHIVE_COUNT records each time
2. **Query.MAX_ARCHIVE_COUNT** property

How to use the new offset and pagination for Query.selectArchived();
```
var where = ""; 
JSONObject[] forms;
int offset = 0;
do {
   forms = query.selectArchived(Form.TABLE, where, offset);
   offset += forms.Length;
   Console.WriteLine("record count:"  + forms.Length + " offset: " + offset);
} while (forms.Length == Query.MAX_ARCHIVE_COUNT)
```

# Release notes v4.2

1. **Query.downloadArchiveFile()** has been removed, please use Query.downloadFile()
2. **Query.selectSinceLastCall()** has been removed, please use Query.selectSince()
3. **Query.count()** has been removed, please use Query.select().length
4. **Query.enableSyncWhere** property has been removed

