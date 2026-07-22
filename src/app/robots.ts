import type { MetadataRoute } from "next";
import site from "@/data/site.json";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			// The contact endpoint has nothing to index and answers POST only
			disallow: "/api/",
		},
		sitemap: `${site.url}/sitemap.xml`,
		host: site.url,
	};
}
