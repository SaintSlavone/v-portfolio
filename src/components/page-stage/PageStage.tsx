"use client";

import "./PageStage.scss";
import "./Adaptations.scss";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useLayoutEffect, useRef } from "react";
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

	useLayoutEffect(() => {
		// Match the phone adaptations, including a wide but short landscape screen.
		const phone = window.matchMedia(
			"(max-width: 600px), (max-width: 1000px) and (max-height: 600px) and (orientation: landscape)",
		);
		const root = document.documentElement;
		const viewport = window.visualViewport;
		let width = window.innerWidth;
		let frame = 0;

		const resetScroll = () => {
			if (phone.matches && !window.location.hash && (!viewport || viewport.scale === 1)) {
				window.scrollTo({ top: 0, left: 0, behavior: "instant" });
			}
		};

		const updateViewport = () => {
			if (!phone.matches) {
				root.style.removeProperty("--phone-viewport-height");
				return;
			}
			// Zoom must magnify the page, rather than resize the composition.
			if (viewport && viewport.scale !== 1) return;
			root.style.setProperty(
				"--phone-viewport-height",
				`${viewport?.height ?? window.innerHeight}px`,
			);
		};

		const handleResize = () => {
			updateViewport();
			// Rotation changes width; browser chrome and the keyboard change height.
			// Keep normal scrolling intact when either of those appears.
			const nextWidth = window.innerWidth;
			if (Math.abs(nextWidth - width) > 1) {
				width = nextWidth;
				cancelAnimationFrame(frame);
				frame = requestAnimationFrame(resetScroll);
			}
		};

		const handlePageShow = () => {
			updateViewport();
			resetScroll();
		};

		// Next preserves the offset when the destination is already partly visible.
		// Each phone page should instead open with its heading and home link in view.
		updateViewport();
		resetScroll();
		window.addEventListener("resize", handleResize);
		viewport?.addEventListener("resize", handleResize);
		window.addEventListener("pageshow", handlePageShow);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", handleResize);
			viewport?.removeEventListener("resize", handleResize);
			window.removeEventListener("pageshow", handlePageShow);
			root.style.removeProperty("--phone-viewport-height");
		};
	}, [pathname]);

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
