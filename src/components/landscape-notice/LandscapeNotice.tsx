import "./LandscapeNotice.scss";
import "./Adaptations.scss";

export default function LandscapeNotice() {
	return (
		<div className="landscape-notice" role="status" aria-live="polite">
			<svg
				className="landscape-notice-icon"
				viewBox="0 0 88 88"
				fill="none"
				aria-hidden="true"
			>
				<rect x="32" y="15" width="24" height="48" rx="4" />
				<path d="M40 57h8" />
				<path d="M65 25a26 26 0 0 1 5 35" />
				<path d="m63 57 7 3 3-7" />
			</svg>
			<h2 className="landscape-notice-title">Please rotate your phone</h2>
			<p className="landscape-notice-copy">Turn your screen upright to view the site.</p>
		</div>
	);
}
