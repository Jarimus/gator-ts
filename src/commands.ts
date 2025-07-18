import { error } from "console";
import { readConfig, setUser } from "./config";
import { createUser, deleteAllUsers, getAllUsers, getUserById, getUserByName } from "./lib/db/queries/users";
import { scrapeFeeds } from "./rss";
import { createFeed, getFeed } from "./lib/db/queries/feeds";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser, getFeeds } from "./lib/db/queries/feed_follows";
import { displayFetchInterval, parseDuration } from "./utils";
import { User } from "./lib/db/schema";
import { getPostsForUser } from "./lib/db/queries/posts";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Map<string, CommandHandler>;

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export function middlewareLoggedIn(handler:UserCommandHandler) {
    // Call the handler with the current user
    return async (cmdName: string, ...args: string[]) => {
        try {
            // Check if the user is logged in
            const currentUserName = readConfig().currentUserName;
            const currentUser = await getUserByName(currentUserName);
            if (!currentUser) {
                console.error("No user currently active. Please login first.", 1);
                process.exit(1);
            }
            await handler(cmdName, currentUser, ...args);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }
}

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

export async function handlerGetFeeds(cmdName: string, user: User, ...args: string[]) {
    if (args.length === 0) {
        console.log("agg command needs an argument: agg <time between requests> (1m | 1s | 1h | 1ms)");
        process.exit(1);
    }
    const timeBetweenString = args[0];
    const timeInMilliseconds = parseDuration(timeBetweenString);
    displayFetchInterval(timeInMilliseconds);

    // Start scraping feeds
    scrapeFeeds().catch( (reason) => {console.error(`Error scraping feeds. ${reason}`)});

    const interval = setInterval(() => {
        scrapeFeeds().catch( (reason) => {console.error(`Error scraping feeds. ${reason}`)});
    }, timeInMilliseconds);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]) {
    // Check for feedName and feedUrl args
    if (args.length < 2) {
        console.log("addfeed command needs two arguments: addfeed <feed name> <feed url>");
        process.exit(1);
    }

    // Get all the values
    const feedName = args[0];
    const feedUrl = args[1];

    // Check whether the feed already exists in the database
    const dbFeed = await getFeed(feedUrl);
    if (!(dbFeed === undefined)) {
        console.log("Feed already exists in the database.");
        process.exit(1);
    }

    // Create the feed in the database
    const feed = await createFeed(feedName, user.id, feedUrl);

    // Check that the feed is created successfully
    if (feed === undefined) {
        console.log("Error creating the feed");
        process.exit(1);
    }

    const feedFollow = await createFeedFollow(user.id, feed.id);
    console.log(`Feed "${feedName}" added to the database under username "${user.name}"`)
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]) {
    if (args.length < 1) {
        console.log("Not enough arguments. Usage: follow <url>");
        process.exit(1);
    }
    const url = args[0];
    const dbFeed = await getFeed(url);
    const newFeedFollow = await createFeedFollow(user.id, dbFeed.id);

    if (!newFeedFollow) {
        console.error("Error creating a feed follow.");
        process.exit(1);
    }

    console.log(`Feed follow for feed "${dbFeed.name}" for user ${user.name} created.`)
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]) {
    if (args.length < 1) {
        console.log("Not enough arguments. Usage: follow <url>");
        process.exit(1);
    }
    const url = args[0];
    const dbFeed = await deleteFeedFollow(url);

    if (!dbFeed) {
        console.error("Failed to delete feed follow.");
        process.exit(1);
    }

    console.log(`Feed follow for feed "${url}" for user ${user.name} deleted.`)
}

export async function handlerFollowing(cmdName:string, user: User, ...args: string[]) {
    const feedFollows = await getFeedFollowsForUser(user.id);

    // List feedFollows
    console.log(`User "${user.name}" followings:`)
    feedFollows.forEach( (feedFollow) => {console.log(`${feedFollow.feedName} (${feedFollow.feedUrl})`)});
}

export async function handlerFeeds() {
    const feeds = await getFeeds();

    if (feeds.length === 0) {
        console.log("No feeds found.");
        return;
    }

    for (let feed of feeds) {
        const user = await getUserById(feed.user_id);
        console.log(`${feed.name} (${user?.name})`);
        console.log(`${feed.url}`);
        console.log("-----------------------------------------");
    }
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]) {
    let limit;
    if (args.length === 0) {
        console.log("Number of posts not provided as argument. Defaulting to 2.")
        limit = 2;
    } else {
        try {
            limit = Number(args[0]);
        } catch (err) {
            console.log("Please provide a valid number for the number of posts.\n")
            process.exit(1);
        }
    }
    const posts = await getPostsForUser(user, limit);

    for (let i = 0; i < limit; i++) {
        const post = posts[i];
        if (post === undefined) {
            process.exit(0);
        }

        // Display post
        console.log(`${post.title} (${post.publishedAt.getDate()}.${post.publishedAt.getMonth()}.${post.publishedAt.getFullYear()})
${post.url}

${post.description}
===================================================================================`)
    }
}