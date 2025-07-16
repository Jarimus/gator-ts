import { RSSItem } from "src/rss";
import { db } from "..";
import { posts, User } from "../schema";

export async function createPost(item: RSSItem, feedId: string) {
    const pubDate = Date.parse(item.pubDate);
    const [result] = await db.insert(posts).values({
        url: item.link,
        description: item.description,
        publishedAt: new Date(pubDate),
        title: item.title,
        feedId: feedId,
    });
    return result;
}

export async function getPostsForUser(user: User) {
    
}