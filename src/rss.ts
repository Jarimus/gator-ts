import { XMLParser } from "fast-xml-parser";
import { feeds, users } from "./lib/db/schema";
import { getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds";

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

export async function scrapeFeeds() {
    // Get next feed
    const feed = await getNextFeedToFetch();
    if (!feed) {
        throw new Error("Next feed not found.");
    }

    // Mark it fetched
    await markFeedFetched(feed.id);

    // Fetch using url (fetchFeed function)
    const rssFeed = await fetchFeed(feed.url);

    // Iterate over items, print titles
    if (rssFeed.channel.item.length === 0) {
        console.log("No items in rss feed.");
    }

    console.log(`Adding feeds to database from ${rssFeed.channel.title}\n`)
    for (const item of rssFeed.channel.item.slice(0, 5)) {
        console.log(item.title);
        // TODO:
        // Store posts in the database
    }
    console.log();
}