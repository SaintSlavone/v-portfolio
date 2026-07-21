"use client";

import "./Intro.scss";
import "./Adaptations.scss";
import { useEffect, useRef, useState } from "react";

type Phase = "presents" | "slide" | "rotate" | "draw" | "out";

const SESSION_KEY = "intro-played";

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
		// Already played this session, or reduced motion: skip straight to the
		// hub. The overlay was hidden pre-paint, so just unmount it.
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (sessionStorage.getItem(SESSION_KEY) || reduceMotion) {
			sessionStorage.setItem(SESSION_KEY, "1");
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setDone(true);
			return;
		}

		const finish = () => {
			sessionStorage.setItem(SESSION_KEY, "1");
			setDone(true);
		};

		// Click / keypress fast-forwards to the fade-out (see annotation)
		const skip = () => {
			timers.current.forEach(clearTimeout);
			timers.current = [];
			setPhase("out");
			timers.current.push(window.setTimeout(finish, 400));
		};

		TIMELINE.forEach(({ phase: next, at }) => {
			timers.current.push(window.setTimeout(() => setPhase(next), at));
		});
		timers.current.push(window.setTimeout(finish, TOTAL));

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
			{/* "Kostenko Presents" — the tail that slides away behind the V */}
			<span className="intro-tail">
				<span className="intro-tail-inner">Kostenko Presents</span>
			</span>
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
