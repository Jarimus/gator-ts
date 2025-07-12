import { eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../schema";

export async function createFeedFollow(user_id: string, feed_id: string) {
    const [result] = await db.insert(feedFollows).values( {user_id: user_id, feed_id: feed_id} ).returning();
    return result;
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