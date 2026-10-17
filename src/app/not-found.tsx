import Link from "next/link";
import "./NotFound.scss";
import "./NotFoundAdaptations.scss";

export default function NotFound() {
	return (
		<main className="not-found">
			<svg className="not-found-cross" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
				<line x1="80" y1="80" x2="920" y2="920" />
				<line x1="920" y1="80" x2="80" y2="920" />
			</svg>
			<div className="not-found-content">
				<h1 className="not-found-code">404</h1>
				<Link className="not-found-home" href="/">Back to home</Link>
			</div>
		</main>
	);
}
