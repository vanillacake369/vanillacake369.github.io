import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { filterPublished, sortPostsByDate, entryToPost } from "../domain/post";
import { SITE_CONFIG } from "../config";

export async function GET(context: APIContext) {
    const rawEntries = await getCollection("posts");

    const posts = sortPostsByDate(
        filterPublished(rawEntries.map(entryToPost)),
    );

    if (!context.site) {
        throw new Error('site must be configured in astro.config.mjs for RSS feed generation');
    }

    return rss({
        title: SITE_CONFIG.title,
        description: SITE_CONFIG.description,
        site: context.site,
        items: posts.map((post) => ({
            title: post.title,
            description: post.description,
            pubDate: post.date,
            link: `/posts/${post.slug}/`,
        })),
        customData: `<language>ko</language>`,
    });
}
