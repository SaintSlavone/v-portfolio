"use client";

import "./XField.scss";
import "./Adaptations.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MouseEvent, useEffect } from "react";
import { usePageExit } from "@/components/page-exit/PageExit";

// Each interior route occupies one hub quadrant. The persistent X slides
// toward that quadrant on navigation, leaving the opposite arms on screen as
// the return-to-hub affordance — this replaces the old XCorners component.
// `arms-*` marks which side stays visible (where the return zone sits).
const routeState: Record<string, { exit: string; arms: string }> = {
	"/about": { exit: "exit-top", arms: "arms-bottom" },
	"/skills": { exit: "exit-left", arms: "arms-right" },
	"/projects": { exit: "exit-right", arms: "arms-left" },
	"/contacts": { exit: "exit-bottom", arms: "arms-top" },
};

// One persistent X for the whole app, rendered in the root layout so it never
// unmounts. Navigation only swaps a class, and CSS transitions the transform.
export default function XField() {
	const pathname = usePathname();
	const { isLeaving, leaveToHub } = usePageExit();
	// While the page slides out the X is already on its way home, so it drops
	// back to the hub state the moment the exit starts rather than on arrival
	const state = isLeaving ? undefined : routeState[pathname];
	const isHub = !state;

	// ESC returns to the hub from any interior page. The gallery overlay
	// swallows ESC in the capture phase, so it won't fire underneath one.
	useEffect(() => {
		if (isHub) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") leaveToHub();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isHub, leaveToHub]);

	// The links keep their href (prefetch, middle-click, crawlers) but the
	// plain click is intercepted so the exit animation can play first
	const handleReturn = (event: MouseEvent<HTMLAnchorElement>) => {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
		event.preventDefault();
		leaveToHub();
	};

	const exitClass = state ? state.exit : "";
	const stateClass = isHub ? "is-hub" : `is-interior ${state.exit} ${state.arms}`;

	return (
		<>
			{/* The grid sits behind page content and carries the same --exit
			    transform as the X, so the two slide together on navigation */}
			<div className={`grid-backdrop ${exitClass}`} aria-hidden="true" />
			<div className={`x-field ${stateClass}`}>
				<svg
					className="x-field-x"
					viewBox="0 0 1920 1080"
					preserveAspectRatio="none"
					aria-hidden="true"
				>
					{/* Lines run far past the viewBox (with overflow visible) so
					    their ends stay off-screen even after the exit translate */}
					<line x1="-3840" y1="-2160" x2="5760" y2="3240" />
					<line x1="5760" y1="-2160" x2="-3840" y2="3240" />
				</svg>
				{!isHub && (
					<>
						<Link
							href="/"
							aria-label="Back to home"
							className="x-field-return"
							onClick={handleReturn}
						/>
						<Link
							href="/"
							aria-label="Back to home"
							className="x-field-wordmark"
							onClick={handleReturn}
						>
							V K
						</Link>
					</>
				)}
			</div>
		</>
	);
}
