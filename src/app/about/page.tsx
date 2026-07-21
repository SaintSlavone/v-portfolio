import "./About.scss";
import "./Adaptations.scss";
import about from "@/data/about.json";

export default function AboutPage() {
	return (
		<main className="about">
			<h1 className="about-name">{about.name}</h1>
			<p className="about-role">{about.role}</p>
			<div className="about-bio">
				{about.bio.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</div>
			<p className="about-languages">{about.languages.join(" | ")}</p>
			<a className="about-cv" href={about.cv.href} download>
				{about.cv.label} ↓
			</a>
		</main>
	);
}
