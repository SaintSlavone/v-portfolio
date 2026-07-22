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

// Fixed 6-slot layout from Figma "X Projects Page" — 3 cards / 1 full-width /
// 2 cards; the non-standard rhythm is intentional (see design annotation)
export default function ProjectsPage() {
	const rows = [projects.slice(0, 3), projects.slice(3, 4), projects.slice(4, 6)];
	const rowClasses = ["row-top", "row-wide", "row-bottom"];

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
				{rows.map((row, index) => (
					<div key={rowClasses[index]} className={`grid-row ${rowClasses[index]}`}>
						{row.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
					</div>
				))}
			</div>
		</main>
	);
}
