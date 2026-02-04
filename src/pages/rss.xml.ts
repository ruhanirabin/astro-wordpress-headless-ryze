import rss from "@astrojs/rss";
import { wp } from "../lib/wordpress";
import { siteConfig } from "../lib/site-config";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  if (!context.site) {
    return new Response("Site is not defined on the request context", {
      status: 500,
    });
  }

  const postsResponse = await wp.getPosts({ per_page: 50, status: "publish" });
  const posts = postsResponse.data || [];

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.title.rendered.replace(/<[^>]*>/g, ""),
      description: post.excerpt.rendered.replace(/<[^>]*>/g, "").substring(0, 200),
      pubDate: new Date(post.date),
      link: `/${post.slug}`,
    })),
  });
}
