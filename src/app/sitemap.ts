import type { MetadataRoute } from "next";
import site from "@/data/site.json";

// Every route the hub links to. The project galleries are overlays on
// /projects, not routes of their own, so there is nothing deeper to list.
const routes: { path: string; priority: number }[] = [
	{ path: "/", priority: 1 },
	{ path: "/projects", priority: 0.9 },
	{ path: "/about", priority: 0.8 },
	{ path: "/skills", priority: 0.7 },
	{ path: "/contacts", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return routes.map(({ path, priority }) => ({
		url: `${site.url}${path}`,
		lastModified,
		changeFrequency: "monthly",
		priority,
	}));
}
