import { error } from "console";
import { readConfig, setUser } from "./config";
import { createUser, deleteAllUsers, getAllUsers, getUserByName } from "./lib/db/queries/users";
import { db } from "./lib/db";
import { fetchFeed } from "./rss";
import { createFeed, getFeed } from "./lib/db/queries/feeds";
import { createFeedFollow, getFeedFollowsForUser, getFeeds } from "./lib/db/queries/feed_follows";
import { feedFollows } from "./lib/db/schema";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Map<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry.set(cmdName, handler);
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    const handler = registry.get(cmdName);
    if (handler) {
        try {
            await handler(cmdName, ...args);
        } catch(err) {
            console.log(err);
            process.exit(1);
        }
    } else {
        throw error("Not enough arguments or command not found", 1);
    }
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
    if (args.length < 1) {
        throw error("Login command needs an argument: login <username>", 1)
    }
    const userName = args[0];
    const dbUser = await getUserByName(userName);
    if (dbUser === undefined) {
        throw error(`User "${userName}" is not in the database.`, 1);
    }
    setUser(userName);
    console.log(`Current user set to ${userName}`);
}

export async function handlerRegister(cmdName:string, ...args: string[]) {
    if (args.length < 1) {
        throw error("Register command needs an argument: register <username>", 1);
    }
    const userName = args[0];
    const dbUser = await getUserByName(userName);
    if (dbUser && dbUser.name === userName) {
        throw error(`User ${userName} already exists`, 1);
    }
    const registeredUser = await createUser(userName);
    console.log("New user created:", registeredUser);
    setUser(userName);
}

export async function handlerReset(cmdName: string, ...args: string[]) {
    // Call the database to clear the users
    await deleteAllUsers();
    console.log("All users deleted successfully");
}

export async function handlerListUsers(cmdName: string, ...args: string[]) {
    // Call the database for all users
    const users = await getAllUsers();
    // If there are no users in the database, display a special message
    if (users.length === 0) {
        console.log("No users in the database.");
        process.exit(0);
    }
    // Get current user from config
    const currentUser = readConfig().currentUserName;
    users.forEach((user) => {
        user.name === currentUser? console.log(user.name, "(current)"): console.log(user.name);
    })
}

const testURL = "https://www.wagslane.dev/index.xml";

export async function handlerGetFeeds(cmdName: string, ...args: string[]) {
    const feed = await fetchFeed(testURL);
    console.log(JSON.stringify(feed, null, 2));
}

export async function handlerAddFeed(cmdName: string, ...args: string[]) {
    // Check for feedName and feedUrl args
    if (args.length < 2) {
        console.log("addfeed command needs two arguments: addfeed <feed name> <feed url>");
        process.exit(1);
    }

    // Get all the values
    const cfg = readConfig();
    const feedName = args[0];
    const feedUrl = args[1];
    const currentUser = await getUserByName(cfg.currentUserName);

    // Check whether the feed already exists in the database
    const dbFeed = await getFeed(feedUrl);
    if (!(dbFeed === undefined)) {
        console.log("Feed already exists in the database.");
        process.exit(1);
    }

    // Check for current user to be active
    if (currentUser === undefined) {
        console.log("No user currently active.");
        process.exit(1);
    }

    // Create the feed in the database
    const feed = await createFeed(feedName, currentUser.id, feedUrl);

    // Check that the feed is created successfully
    if (feed === undefined) {
        console.log("Error creating the feed");
        process.exit(1);
    }

    const feedFollow = await createFeedFollow(currentUser.id, feed.id);
    console.log(`Feed "${feedName}" added to the database under username "${currentUser.name}"`)
}

export async function handlerFollow(cmdName: string, ...args: string[]) {
    if (args.length < 1) {
        console.log("Not enough arguments. Usage: follow <url>");
        process.exit(1);
    }
    const url = args[0];
    const dbFeed = await getFeed(url);
    const currentUserName = readConfig().currentUserName;
    const currentUser = await getUserByName(currentUserName);

    // Check for current user to be active
    if (currentUser === undefined) {
        console.log("No user currently active.");
        process.exit(1);
    }

    const newFeedFollow = await createFeedFollow(currentUser.id, dbFeed.id);

    console.log(`Feed follow for feed "${dbFeed.name}" for user ${currentUserName} created.`)
}

export async function handlerFollowing(cmdName:string, ...args: string[]) {
    const currentUserName = readConfig().currentUserName;
    const currentUser = await getUserByName(readConfig().currentUserName);

    // Check for current user to be active
    if (currentUser === undefined) {
        console.log("No user currently active.");
        process.exit(1);
    }

    const feedFollows = await getFeedFollowsForUser(currentUser.id);

    // List feedFollows
    console.log(`User "${currentUser.name}" followings:`)
    feedFollows.forEach( (feedFollow) => {console.log(`${feedFollow.feedName} (${feedFollow.feedUrl})`)});
}

export async function handlerFeeds() {
    const feeds = await getFeeds();
    feeds.forEach((feed) => {
        console.log(`${feed.feedName} (${feed.userName})`);
        console.log(`${feed.feedUrl}`);
        console.log("-----------------------------------------");
    })
}