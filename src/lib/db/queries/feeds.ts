import { eq } from "drizzle-orm";
import { db } from "..";
import { feeds } from "../schema";

export async function createFeed(name: string, user_id: string, url: string) {
    try {
        const [result] = await db.insert(feeds).values({ name: name, url: url, user_id: user_id }).returning();
        return result;
    } catch (err) {
        console.log(err);
    }
}

export async function getFeed(url: string) {
    const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
    return result;
}