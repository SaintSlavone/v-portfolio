import about from "@/data/about.json";
import contacts from "@/data/contacts.json";
import projects from "@/data/projects.json";
import site from "@/data/site.json";
import skills from "@/data/skills.json";

type Schema = Record<string, unknown>;

// Stable @ids so the graphs on different pages describe the same two entities
// instead of five unrelated copies
const PERSON_ID = `${site.url}/#person`;
const WEBSITE_ID = `${site.url}/#website`;

const [addressLocality, addressCountry] = contacts.location.split(", ");

// The bio reads as segments so the design can tone them; search engines want
// one flat sentence per paragraph
function bioText(): string {
	return about.bio
		.map((paragraph) => paragraph.segments.map((segment) => segment.text).join(""))
		.join(" ");
}

// Everything under the "Frontend" / "Backend" / … buckets. Both levels are
// kept: the named technologies sit on the second (React, Next.js), but some of
// the strongest terms only appear as leaves of a generic group
// ("Foundation" → TypeScript, "3D & WebVR" → Three.js, Mapbox GL, krpano).
function knowsAbout(): string[] {
	const names = skills.children.flatMap((branch) =>
		(branch.children ?? []).flatMap((group) => [
			group.name,
			...(group.children ?? []).map((leaf) => leaf.name),
		]),
	);

	return [...new Set(names)];
}

export function personSchema(): Schema {
	return {
		"@type": "Person",
		"@id": PERSON_ID,
		name: site.name,
		url: site.url,
		jobTitle: site.jobTitle,
		description: bioText(),
		email: `mailto:${contacts.email}`,
		address: {
			"@type": "PostalAddress",
			addressLocality,
			addressCountry,
		},
		knowsLanguage: about.languages,
		knowsAbout: knowsAbout(),
		sameAs: contacts.links.map((link) => link.href),
	};
}

export function websiteSchema(): Schema {
	return {
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		url: site.url,
		name: site.title,
		description: site.description,
		inLanguage: site.language,
		publisher: { "@id": PERSON_ID },
	};
}

interface PageGraphOptions {
	path: string;
	name: string;
	// ProfilePage / ContactPage / CollectionPage — plain WebPage otherwise
	type?: string;
	extra?: Schema[];
}

// One @graph per page: the site and the person always ride along, so every
// page resolves the @id references it makes instead of pointing at nothing.
export function pageGraph({
	path,
	name,
	type = "WebPage",
	extra = [],
}: PageGraphOptions): Schema {
	const page: Schema = {
		"@type": type,
		"@id": `${site.url}${path}#page`,
		url: `${site.url}${path}`,
		name,
		isPartOf: { "@id": WEBSITE_ID },
		about: { "@id": PERSON_ID },
		inLanguage: site.language,
	};

	return {
		"@context": "https://schema.org",
		"@graph": [websiteSchema(), personSchema(), page, ...extra],
	};
}

export function projectsSchema(): Schema {
	return {
		"@type": "ItemList",
		name: `Projects by ${site.name}`,
		itemListElement: projects.map((project, index) => ({
			"@type": "ListItem",
			position: index + 1,
			item: {
				"@type": "CreativeWork",
				name: project.name,
				image: `${site.url}${project.thumbnail}`,
				creator: { "@id": PERSON_ID },
				keywords: project.stack.join(", "),
				dateCreated: project.years,
				...(project.links.live ? { url: project.links.live } : {}),
			},
		})),
	};
}
