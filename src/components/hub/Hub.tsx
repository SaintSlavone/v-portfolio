import "./Hub.scss";
import Link from "next/link";

interface HubSection {
	href: string;
	label: string;
	position: "top" | "left" | "right" | "bottom";
}

const sections: HubSection[] = [
	{ href: "/about", label: "About", position: "top" },
	{ href: "/skills", label: "Skills", position: "left" },
	{ href: "/projects", label: "Projects", position: "right" },
	{ href: "/contacts", label: "Contacts", position: "bottom" },
];

export default function Hub() {
	return (
		<main className="hub">
			<nav className="hub-nav" aria-label="Main navigation">
				{sections.map(({ href, label, position }) => (
					<Link key={href} href={href} className={`hub-quadrant ${position}`}>
						<span className="quadrant-label">{label}</span>
					</Link>
				))}
			</nav>
		</main>
	);
}
