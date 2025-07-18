# gator-ts
A blog aggregator project for a [boot.dev course](https://www.boot.dev/courses/build-blog-aggregator-typescript).

## Description
Gator is a multi-user CLI application for storing and browsing RSS feeds. It is intended for local use only.

## Installation
First of all, you need Postgres and TypeScript installed to use the program. Use 'npm run start <command>' to execute different commands.

## Config file
When you start the program for the first time, it will scan for a '.gatorconfig.json' file in the home directory. The file should have two entries: 'db_url' for the database connection and 'current_user_name' which will get added with commands such as register and login.

## Commands
Here is the list of commands for gator:
- register (registers a new user)
- login (logs in an existing user)
- reset (deletes all users, feeds and posts)
- users (lists all users)
- agg (aggregates posts continuously)
- addfeed (adds a feed to the list of feeds and follows it)
- follow (follow a feed for the current user)
- following (lists feeds followed by the current user)
- unfollow (unfollows a feed)
- browse (lists posts from the feeds)