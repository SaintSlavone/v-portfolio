import "./Hub.scss";
import "./Adaptations.scss";
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
			<svg
				className="hub-x"
				viewBox="0 0 1920 1080"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<line x1="0" y1="0" x2="1920" y2="1080" />
				<line x1="1920" y1="0" x2="0" y2="1080" />
			</svg>
			<span className="hub-wordmark">V K</span>
			<nav className="hub-nav" aria-label="Main navigation">
				{sections.map(({ href, label, position }) => (
					<Link key={href} href={href} className={`hub-quadrant ${position}`}>
						<span className="quadrant-label">{label}</span>
					</Link>
				))}
			</nav>
			<a className="hub-footer-mail" href="mailto:viakostee@gmail.com">
				viakostee@gmail.com
			</a>
		</main>
	);
}
