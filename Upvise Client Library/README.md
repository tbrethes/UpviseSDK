# Upvise Client Library for .NET

The Upvise Client Library for .NET allows you to make direct HTTPS calls to the Upvise Cloud Database, from any client program. runnning on a desktop or server machine. You can query any application table, download and upload files to your Upvise account.

**Current Version: v4.1**, released **March 17th, 2025**

[Programming guide & API Reference](https://www.upvise.com/dev/guide/webservice.htm)

Requirements:
.NET Framework v4.8.1 or higher
or .NET 6 or higher

Runtime Requirements:
Needs full access right to local path **C:\ProgramData\Upvise**  or user **HOME** folder for local cache.

Usage of the Upvise Client Library is suject to our [API Tems of Use](https://www.upvise.com/legal/apitermsofuse.htm)


# Release notes v4.2

1. **Query.downloadArchiveFile()** has been removed, please use Query.downloadFile()
2. **Query.selectSinceLastCall()** has been removed, please use Query.selectSince()
3. **Query.count()** has been removed, please use Query.select().length
4. **Query.enableSyncWhere** property has been removed

