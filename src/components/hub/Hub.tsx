import "./Hub.scss";
import "./Adaptations.scss";
import Link from "next/link";
import site from "@/data/site.json";

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
			{/* The X itself lives in the persistent <XField> (root layout);
			    the hub only overlays the quadrant nav on top of it */}
			{/* The landing screen is wordless by design (just the X and the "V K"
			    wordmark) — the heading and the one-liner live off screen so the
			    page still has an h1 and an indexable summary */}
			<h1 className="visually-hidden">
				{site.name} — {site.jobTitle}
			</h1>
			<p className="visually-hidden">{site.description}</p>
			<span className="hub-wordmark" aria-hidden="true">
				V K
			</span>
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
