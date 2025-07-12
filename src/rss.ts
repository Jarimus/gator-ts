import { XMLParser } from "fast-xml-parser";
import { parse } from "path";
import { exit } from "process";
import { stringify } from "querystring";
import { feeds, users } from "./lib/db/schema";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(url: string) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "gator"
        }
    });
    if (!response.ok) {
        throw new Error("Error fetching feed.");
    }
    const textResp = await response.text();
    const parser = new XMLParser();
    const parsedFeed = await parser.parse(textResp);
    const rssFeed = parsedFeed.rss;

    if (rssFeed.channel === undefined) {
        console.log("RSS response format invalid.");
        process.exit(1);
    }

    if (rssFeed.channel.description === undefined
        || rssFeed.channel.item === undefined
        || rssFeed.channel.link === undefined
        || rssFeed.channel.title === undefined) {
        console.log("RSS response format invalid.");
        process.exit(1);
    }
    
    // Check the feed items exits as an Array (.isArray()). If not, set to an empty array.
    if (!Array.isArray(rssFeed.channel.item)) {
        rssFeed.channel.item = [];
    }

    // Collect rssItems.
    const rssItems: RSSItem[] = [];
    for (const item of rssFeed.channel.item) {
        if (item.title === undefined
            || item.link === undefined
            || item.description === undefined
            || item.pubDate === undefined) {
            continue;
        }
        rssItems.push({
            title: item.title,
            link: item.link,
            description: item.description,
            pubDate: item.pubDate,
        });
    }

    // Build the return rssFeed
    const feed: RSSFeed = {
        channel: {
            title: rssFeed.channel.title,
            link: rssFeed.channel.link,
            description: rssFeed.channel.description,
            item: rssItems,
        }
    };
    return feed;
}

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

export async function printFeed(feed: Feed, user: User) {
    console.log(feed);
    console.log(user);
}