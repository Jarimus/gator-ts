import { asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "..";
import { feeds } from "../schema";
import { date } from "drizzle-orm/mysql-core";
import { PgDate } from "drizzle-orm/pg-core";
import { readConfig } from "src/config";
import { getUserByName } from "./users";

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

export async function markFeedFetched(id: string) {
    // Update the lastFetchedAt and updatedAt fields of the feed
    try {
        const [result] = await db.update(feeds)
            .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
            .where(eq(feeds.id, id))
            .returning();
        return result;
    } catch (err) {
        console.log(err);
    }
}

export async function getNextFeedToFetch() {
    const userName = readConfig().currentUserName;
    const user = await getUserByName(userName);
    if (!user) {
        console.error("No current user.");
        return;
    }

    // Fetch the next feed that needs to be fetched. Nulls first, then order by lastFetchedAt
    const [result] = await db.select().from(feeds)
        .where(eq(feeds.user_id, user.id))
        .orderBy(
            sql`CASE WHEN ${feeds.lastFetchedAt} IS NULL THEN 0 ELSE 1 END`,
            asc(feeds.lastFetchedAt),
        )
    return result;
}