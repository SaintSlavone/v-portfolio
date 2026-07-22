import type { Metadata } from "next";
import "./Skills.scss";
import "./Adaptations.scss";
import skills from "@/data/skills.json";
import site from "@/data/site.json";
import SkillsGraph from "@/components/skills-graph/SkillsGraph";
import JsonLd from "@/components/json-ld/JsonLd";
import { pageGraph } from "@/components/json-ld/schemas";

const description =
	"The stack Viacheslav Kostenko works in — frontend, 3D and WebVR, backend and tooling — as an interactive skills graph.";

export const metadata: Metadata = {
	title: "Skills",
	description,
	alternates: { canonical: "/skills" },
	openGraph: {
		url: "/skills",
		title: `Skills · ${site.name}`,
		description,
		images: ["/opengraph-image"],
	},
};

interface SkillTreeNode {
	name: string;
	children?: SkillTreeNode[];
}

// Plain grouped list — replaces the graph on mobile portrait and for
// prefers-reduced-motion users (visibility handled in CSS)
function SkillsList({ branches }: { branches: SkillTreeNode[] }) {
	return (
		<div className="skills-list">
			{branches.map((branch) => (
				<section key={branch.name} className="list-branch">
					<h2 className="branch-name">{branch.name}</h2>
					{branch.children?.map((child) =>
						child.children ? (
							<div key={child.name} className="branch-group">
								<h3 className="group-name">{child.name}</h3>
								<p className="group-items">
									{child.children.map(({ name }) => name).join(" · ")}
								</p>
							</div>
						) : (
							<p key={child.name} className="branch-item">
								{child.name}
							</p>
						),
					)}
				</section>
			))}
		</div>
	);
}

export default function SkillsPage() {
	return (
		<main className="skills">
			<JsonLd data={pageGraph({ path: "/skills", name: `Skills · ${site.name}` })} />
			<h1 className="skills-title">Skills</h1>
			<SkillsGraph />
			<SkillsList branches={skills.children} />
			<p className="skills-hint">
				drag nodes or the field · scroll to zoom · hover to highlight
			</p>
		</main>
	);
}
