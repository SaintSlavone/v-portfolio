"use client";

import "./Intro.scss";
import "./Adaptations.scss";
import { useEffect, useRef, useState } from "react";

type Phase = "presents" | "chevron" | "draw" | "out";

const SESSION_KEY = "intro-played";

// Cumulative timeline (ms). Full sequence is 3s per the Figma "X Welcoming
// Page" annotation: Presents → ">" transition → X draw-in, then reveal hub.
const TIMELINE: { phase: Phase; at: number }[] = [
	{ phase: "presents", at: 0 },
	{ phase: "chevron", at: 1300 },
	{ phase: "draw", at: 1750 },
	{ phase: "out", at: 2600 },
];
const TOTAL = 3000;

// Overlays the hub and plays once per browser session, then unmounts to
// reveal the hub underneath. Reduced-motion users skip straight to the hub.
export default function Intro() {
	const [play, setPlay] = useState(false);
	const [phase, setPhase] = useState<Phase>("presents");
	const timers = useRef<number[]>([]);

	// Gate: only the first visit of a session animates
	useEffect(() => {
		if (sessionStorage.getItem(SESSION_KEY)) return;
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduceMotion) {
			sessionStorage.setItem(SESSION_KEY, "1");
			return;
		}
		// One-time client-only gate: sessionStorage/matchMedia are unavailable
		// during SSR, so the play decision must happen here after mount
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPlay(true);
	}, []);

	useEffect(() => {
		if (!play) return;

		const finish = () => {
			sessionStorage.setItem(SESSION_KEY, "1");
			setPlay(false);
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
	}, [play]);

	if (!play) return null;

	return (
		<div className={`intro intro-phase-${phase}`} aria-hidden="true">
			<div className="intro-grid" />
			<p className="intro-presents">V Kostenko Presents</p>
			<span className="intro-chevron">&gt;</span>
			<svg
				className="intro-x"
				viewBox="0 0 1920 1080"
				preserveAspectRatio="none"
			>
				<line x1="0" y1="0" x2="1920" y2="1080" pathLength={1} />
				<line x1="1920" y1="0" x2="0" y2="1080" pathLength={1} />
			</svg>
		</div>
	);
}
