import { eq, and } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../schema";
import { getFeed } from "./feeds";
import { getUserByName } from "./users";
import { readConfig } from "src/config";

export async function createFeedFollow(user_id: string, feed_id: string) {
    const [result] = await db.insert(feedFollows).values( {user_id: user_id, feed_id: feed_id} ).returning();
    return result;
}

export async function deleteFeedFollow(url:string) {
    // Get the feed
    const dbFeed = await getFeed(url);
    if (!dbFeed) {
        console.log(`No feed found with URL: ${url}`);
        return;
    }
    const feedId = dbFeed.id;
    const user = await getUserByName(readConfig().currentUserName);
    if (!user) {
        console.error("No current user.");
        return;
    }
    const [feedFollow] = await db.select().from(feedFollows).where(
        and(
            eq(feedFollows.feed_id, feedId),
            eq(feedFollows.user_id, user.id),
        )
            
    );

    if (!feedFollow) {
        console.log(`No feed follow found for feed with URL: ${url}`);
        return;
    }
    // Delete the feed follow
    await db.delete(feedFollows).where(eq(feedFollows.id, feedFollow.id));
    console.log(`Feed follow for feed with URL "${url}" deleted successfully.`);
    return feedFollow;
}

export async function getFeedFollowsForUser(user_id:string) {
    const result = await db.select({
        id: feedFollows.id,
        createdAt: feedFollows.createdAt,
        updatedAt: feedFollows.updatedAt,
        feedName: feeds.name,
        feedUrl: feeds.url,
    }).from(feedFollows).where(eq(feedFollows.user_id, user_id))
    .innerJoin(feeds, eq(feeds.id, feedFollows.feed_id));
    return result;
}

export async function getFeeds() {
    const result = await db.select({
        feedName: feeds.name,
        feedUrl: feeds.url,
        userName: users.name
    }).from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, feedFollows.feed_id))
    .innerJoin(users, eq(users.id, feedFollows.user_id));
    return result;
}