import "./Skills.scss";
import "./Adaptations.scss";
import skills from "@/data/skills.json";
import XCorners from "@/components/x-corners/XCorners";

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
			<XCorners position="right" />
			<h1 className="skills-title">Skills</h1>
			<SkillsList branches={skills.children} />
			<p className="skills-hint">drag nodes to explore · hover a branch to highlight it</p>
		</main>
	);
}
