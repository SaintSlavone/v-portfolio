import type { Metadata } from "next";
import "./Projects.scss";
import "./Adaptations.scss";
import projects from "@/data/projects.json";
import site from "@/data/site.json";
import ProjectCard from "@/components/project-card/ProjectCard";
import JsonLd from "@/components/json-ld/JsonLd";
import { pageGraph, projectsSchema } from "@/components/json-ld/schemas";

const description =
	"Selected work by Viacheslav Kostenko: interactive masterplan maps, virtual tours and production web platforms built with Next.js, Three.js, Mapbox GL and krpano.";

export const metadata: Metadata = {
	title: "Projects",
	description,
	alternates: { canonical: "/projects" },
	openGraph: {
		url: "/projects",
		title: `Projects · ${site.name}`,
		description,
		images: ["/opengraph-image"],
	},
};

// The Figma "X Projects Page" rhythm — 3 cards / 1 full-width / 2 cards — is a
// repeating cadence, not a six-slot page. Cycling it keeps any number of
// projects on the same visual beat; only the closing row may come up short.
const ROW_PATTERN = [
	{ className: "row-top", size: 3 },
	{ className: "row-wide", size: 1 },
	{ className: "row-bottom", size: 2 },
];

function buildRows<T extends { id: string }>(items: T[]) {
	const rows: { className: string; items: T[] }[] = [];

	for (let index = 0; index < items.length;) {
		const shape = ROW_PATTERN[rows.length % ROW_PATTERN.length];
		rows.push({
			className: shape.className,
			items: items.slice(index, index + shape.size),
		});
		index += shape.size;
	}

	return rows;
}

export default function ProjectsPage() {
	const rows = buildRows(projects);

	return (
		<main className="projects">
			<JsonLd
				data={pageGraph({
					path: "/projects",
					name: `Projects · ${site.name}`,
					type: "CollectionPage",
					extra: [projectsSchema()],
				})}
			/>
			<h1 className="projects-title">Projects</h1>
			<div className="projects-grid">
				{rows.map((row) => (
					<div
						key={row.items[0].id}
						className={`grid-row ${row.className}`}
						data-count={row.items.length}
					>
						{row.items.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
					</div>
				))}
			</div>
		</main>
	);
}
