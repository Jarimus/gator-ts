import { RSSItem } from "src/rss";
import { db } from "..";
import { feedFollows, posts, User } from "../schema";
import { eq, desc } from "drizzle-orm";

export async function createPost(item: RSSItem, feedId: string) {
    const pubDate = Date.parse(item.pubDate);
    try {
        const [result] = await db.insert(posts).values({
            url: item.link,
            description: item.description,
            publishedAt: new Date(pubDate),
            title: item.title,
            feedId: feedId,
        });
        return result;
    } catch (err) {
        return undefined;
    }
}

export async function getPostsForUser(user: User, limit: number) {
    // Get posts that the user has in their feed_follows
    const result = db.select({
        publishedAt: posts.publishedAt,
        title: posts.title,
        url: posts.url,
        description: posts.description,
    }).from(posts)
    .innerJoin(feedFollows, eq(feedFollows.feed_id, posts.feedId))
    .where(eq(feedFollows.user_id, user.id)).orderBy(desc(posts.publishedAt)).limit(limit);
    return result
}