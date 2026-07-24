"use client";

import "./Intro.scss";
import "./Adaptations.scss";
import { useEffect, useRef, useState } from "react";

type Phase = "presents" | "slide" | "rotate" | "draw" | "spin" | "out";

const SESSION_KEY = "intro-played";

// The full-viewport X-morph is a landscape-desktop composition; on the project's
// phone breakpoints (see Adaptations.scss) a compact column variant plays
// instead (MOBILE_TIMELINE). Kept in sync with the pre-paint script in layout.
const PHONE_QUERY =
	"(max-width: 600px) and (max-height: 1000px) and (orientation: portrait)," +
	"(max-width: 1000px) and (max-height: 600px) and (orientation: landscape)";

// Cumulative timeline (ms) for the beats described from the Figma frames:
//  presents — "V Kostenko Presents" (V is the SVG chevron, rest is text)
//  slide    — "Kostenko Presents" slides left and hides behind the V
//  rotate   — the lone V (SVG chevron) rotates 90° into a ">"
//  draw     — the chevron's arms extend into the X's legs and the remaining
//             legs draw in; the finished X lands exactly on the hub X
//  out      — the overlay fades to reveal the hub underneath
const TIMELINE: { phase: Phase; at: number }[] = [
	{ phase: "presents", at: 0 },
	{ phase: "slide", at: 1000 },
	{ phase: "rotate", at: 1750 },
	{ phase: "draw", at: 2350 },
	{ phase: "out", at: 3200 },
];
const TOTAL = 3600;

// Phone variant — a compact column ("V" chevron over the word "Presents") that
// resolves into a small X spinning like a loading spinner (see Adaptations.scss):
//  presents — "V" chevron above the word "Presents"
//  slide    — "Presents" fades out
//  rotate   — the chevron rotates 90°
//  draw     — the chevron's legs draw into a small X as the mark shrinks
//  spin     — the finished X spins in place like a loading spinner
//  out      — the overlay fades to reveal the hub
const MOBILE_TIMELINE: { phase: Phase; at: number }[] = [
	{ phase: "presents", at: 0 },
	{ phase: "slide", at: 1000 },
	{ phase: "rotate", at: 1700 },
	{ phase: "draw", at: 2300 },
	{ phase: "spin", at: 2900 },
	{ phase: "out", at: 3750 },
];
const MOBILE_TOTAL = 4150;

// Overlays the hub and plays once per browser session, then unmounts to reveal
// the hub underneath. The overlay is rendered from the first paint (server +
// pre-hydration) so it covers the hub with no flash on the first visit; the
// layout's pre-paint script hides it for returning / reduced-motion visitors,
// who then have it unmounted here once hydration runs.
export default function Intro() {
	const [done, setDone] = useState(false);
	const [phase, setPhase] = useState<Phase>("presents");
	const timers = useRef<number[]>([]);

	useEffect(() => {
		// Returning-this-session or reduced-motion visitors skip straight to the
		// hub; the overlay was hidden pre-paint, so just unmount it. Phones now
		// play a compact variant (MOBILE_TIMELINE), so they are NOT skipped here.
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (sessionStorage.getItem(SESSION_KEY) || reduceMotion) {
			sessionStorage.setItem(SESSION_KEY, "1");
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setDone(true);
			return;
		}

		// Phones run the column "V Presents" → spinning-X beats; desktop runs the
		// full-viewport morph that lands on the hub X.
		const isPhone = window.matchMedia(PHONE_QUERY).matches;
		const timeline = isPhone ? MOBILE_TIMELINE : TIMELINE;
		const total = isPhone ? MOBILE_TOTAL : TOTAL;

		const finish = () => {
			sessionStorage.setItem(SESSION_KEY, "1");
			setDone(true);
		};

		// Entering the fade-out beat. Flag the document here (not at finish) so the
		// hub's reveal (Hub Adaptations) zooms up from the centre while the black
		// overlay is still dissipating, and the film-grain (Main.scss) fades in.
		const enterOut = () => {
			document.documentElement.dataset.introDone = "1";
			setPhase("out");
		};

		// Click / keypress fast-forwards to the fade-out (see annotation)
		const skip = () => {
			timers.current.forEach(clearTimeout);
			timers.current = [];
			enterOut();
			// timers.current.push(window.setTimeout(finish, 400));
		};

		timeline.forEach(({ phase: next, at }) => {
			timers.current.push(
				window.setTimeout(next === "out" ? enterOut : () => setPhase(next), at),
			);
		});
		// timers.current.push(window.setTimeout(finish, total));

		window.addEventListener("click", skip);
		window.addEventListener("keydown", skip);
		return () => {
			timers.current.forEach(clearTimeout);
			timers.current = [];
			window.removeEventListener("click", skip);
			window.removeEventListener("keydown", skip);
		};
	}, []);

	if (done) return null;

	return (
		<div className={`intro intro-phase-${phase}`} aria-hidden="true">
			<div className="intro-grid" />
			{/* "Kostenko Presents" — the tail that slides away behind the V.
			    Phones drop "Kostenko" and stack the remaining word under the V. */}
			<span className="intro-tail">
				<span className="intro-tail-inner">
					<span className="intro-tail-kostenko">Kostenko </span>Presents
				</span>
			</span>
			{/* Mobile only: a compact square X. The chevron rotates and its legs
			    draw into a small X that then spins like a loading spinner. Own
			    square viewBox so the spin stays crisp on portrait viewports —
			    the desktop svg below stretches (preserveAspectRatio="none"). */}
			<svg className="intro-mx" viewBox="0 0 100 100" aria-hidden="true">
				<g className="intro-mvee">
					<line x1="50" y1="60" x2="37" y2="30" />
					<line x1="50" y1="60" x2="63" y2="30" />
					<circle className="intro-mdot" cx="50" cy="60" r="2" fill="#fff" />
				</g>
				<line className="intro-mleg" x1="50" y1="50" x2="8" y2="8" pathLength={1} />
				<line className="intro-mleg" x1="50" y1="50" x2="8" y2="92" pathLength={1} />
				<line className="intro-mleg" x1="50" y1="50" x2="92" y2="8" pathLength={1} />
				<line className="intro-mleg" x1="50" y1="50" x2="92" y2="92" pathLength={1} />
			</svg>
			{/* The V and the X are the SAME svg. The .intro-vee chevron is two
			    short legs that rotate in place; on draw they extend into the X
			    while the remaining legs draw in. Full X == Hub.scss geometry. */}
			<svg className="intro-x" viewBox="0 0 1920 1080" preserveAspectRatio="none">
				<g className="intro-vee">
					<line x1="960.5" y1="558" x2="946" y2="524" pathLength={1} />
					<line x1="959.5" y1="558" x2="973" y2="524" pathLength={1} />
				</g>
				<line className="leg leg-tl" x1="960" y1="540" x2="0" y2="0" pathLength={1} />
				<line className="leg leg-bl" x1="960" y1="540" x2="0" y2="1080" pathLength={1} />
				<line className="leg leg-tr" x1="960" y1="540" x2="1920" y2="0" pathLength={1} />
				<line className="leg leg-br" x1="960" y1="540" x2="1920" y2="1080" pathLength={1} />
			</svg>
		</div>
	);
}
