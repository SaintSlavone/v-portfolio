import "./Projects.scss";
import "./Adaptations.scss";
import projects from "@/data/projects.json";
import XCorners from "@/components/x-corners/XCorners";
import ProjectCard from "@/components/project-card/ProjectCard";

// Fixed 6-slot layout from Figma "X Projects Page" — 3 cards / 1 full-width /
// 2 cards; the non-standard rhythm is intentional (see design annotation)
export default function ProjectsPage() {
	const rows = [projects.slice(0, 3), projects.slice(3, 4), projects.slice(4, 6)];
	const rowClasses = ["row-top", "row-wide", "row-bottom"];

	return (
		<main className="projects">
			<XCorners position="left" />
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
