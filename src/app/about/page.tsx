import type { Metadata } from "next";
import "./About.scss";
import "./Adaptations.scss";
import about from "@/data/about.json";
import site from "@/data/site.json";
import JsonLd from "@/components/json-ld/JsonLd";
import { pageGraph } from "@/components/json-ld/schemas";

const description =
	"Viacheslav Kostenko — software developer specializing in interactive masterplan maps and WebVR experiences (Three.js, Mapbox GL, krpano) for real-estate clients. Sole frontend owner of 5+ production projects.";

export const metadata: Metadata = {
	title: "About",
	description,
	alternates: { canonical: "/about" },
	openGraph: {
		type: "profile",
		url: "/about",
		title: `About · ${site.name}`,
		description,
		// A page-level openGraph block replaces the root one, so the shared
		// card has to be named again here
		images: ["/opengraph-image"],
	},
};

export default function AboutPage() {
	return (
		<main className="about">
			<JsonLd
				data={pageGraph({
					path: "/about",
					name: `About · ${site.name}`,
					type: "ProfilePage",
				})}
			/>
			<h1 className="about-name">{about.name}</h1>
			<p className="about-role">{about.role}</p>
			<div className="about-bio">
				{about.bio.map((paragraph) => (
					<p
						key={paragraph.variant}
						className={`about-bio-line about-bio-line--${paragraph.variant}`}
					>
						{paragraph.segments.map((segment, index) => (
							<span
								key={`${paragraph.variant}-${index}`}
								className={`about-bio-part about-bio-part--${segment.tone}`}
							>
								{segment.text}
							</span>
						))}
					</p>
				))}
			</div>
			<p className="about-languages">{about.languages.join(" | ")}</p>
			<a className="about-cv" href={about.cv.href} download>
				{about.cv.label} ↓
			</a>
		</main>
	);
}
