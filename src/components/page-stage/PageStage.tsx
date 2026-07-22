"use client";

import "./PageStage.scss";
import "./Adaptations.scss";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";
import { usePageExit } from "@/components/page-exit/PageExit";

// Skills slides in as one block from the side opposite the X's exit. The other
// interior pages (about / projects / contacts) instead stagger their own
// elements (see each page's SCSS), so they're intentionally left out here.
// Keyed by pathname so the block entrance re-runs on every navigation.
const enterByRoute: Record<string, string> = {
	"/skills": "enter-left",
};

// The keyframes that carry a page off screen — anything else running inside the
// stage (looping decoration, hover tweens) must not hold the navigation up
const exitAnimations = new Set(["element-exit", "page-leave"]);

function isExitAnimation(animation: Animation): boolean {
	return (
		"animationName" in animation &&
		exitAnimations.has((animation as CSSAnimation).animationName)
	);
}

interface PageStageProps {
	children: ReactNode;
}

export default function PageStage({ children }: PageStageProps) {
	const pathname = usePathname();
	const { isLeaving, finishExit } = usePageExit();
	const stageRef = useRef<HTMLDivElement>(null);
	const enter = enterByRoute[pathname] ?? "";
	// Marks the whole stage so each page's SCSS can reverse its own cascade
	const leaving = isLeaving ? "is-leaving" : "";

	// Hand over to the hub the moment the slowest exit animation lands. Waiting
	// a fixed duration instead would leave the page sitting on a finished screen
	// on every route whose cascade is shorter than the guess.
	useEffect(() => {
		const stage = stageRef.current;
		if (!isLeaving || !stage) return;

		let cancelled = false;
		const exits = stage.getAnimations({ subtree: true }).filter(isExitAnimation);

		Promise.all(exits.map((animation) => animation.finished))
			.then(() => {
				if (!cancelled) finishExit();
			})
			// An exit was interrupted — PageExit's timeout still gets us home
			.catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [isLeaving, finishExit]);

	return (
		<div ref={stageRef} key={pathname} className={`page-stage ${enter} ${leaving}`}>
			{children}
		</div>
	);
}
