"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

// Safety net only. The hub normally takes over the moment the last exit
// animation lands (PageStage reports it) — this just guarantees the navigation
// still happens if an animation is cancelled or never starts.
const EXIT_TIMEOUT = 1000;

interface PageExitContextValue {
	isLeaving: boolean;
	leaveToHub: () => void;
	finishExit: () => void;
}

const PageExitContext = createContext<PageExitContextValue>({
	isLeaving: false,
	leaveToHub: () => {},
	finishExit: () => {},
});

export function usePageExit() {
	return useContext(PageExitContext);
}

interface PageExitProps {
	children: ReactNode;
}

// The router swaps routes instantly, so an exit animation only exists if the
// navigation is deferred: leaveToHub flags the current page as leaving, lets
// its elements slide back out the way they came in, and only then pushes "/".
// Sits above XField and PageStage so the X returns to centre in the same beat.
export default function PageExit({ children }: PageExitProps) {
	const pathname = usePathname();
	const router = useRouter();
	// Holds the route being left rather than a bare boolean, so the flag can be
	// matched against the current pathname and retired the instant the hub takes
	// over — a stale one would make the next visit to that page play its exit.
	const [leavingFrom, setLeavingFrom] = useState<string | null>(null);
	const timeoutRef = useRef<number | null>(null);

	// The destination has mounted, so the exit is over. Adjusted during render
	// (React's documented alternative to a syncing effect) — no extra pass, and
	// the arriving page is never painted with the leaving flag still on.
	if (leavingFrom !== null && leavingFrom !== pathname) {
		setLeavingFrom(null);
	}

	const isLeaving = leavingFrom !== null;

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
		};
	}, []);

	const goHome = useCallback(() => {
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		router.push("/");
	}, [router]);

	const leaveToHub = useCallback(() => {
		// Already on the hub, or an exit is mid-flight — nothing to play
		if (pathname === "/" || isLeaving) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			router.push("/");
			return;
		}

		setLeavingFrom(pathname);
		timeoutRef.current = window.setTimeout(goHome, EXIT_TIMEOUT);
	}, [pathname, isLeaving, router, goHome]);

	// Called by PageStage when the slowest exit animation has landed
	const finishExit = useCallback(() => {
		if (!isLeaving) return;
		goHome();
	}, [isLeaving, goHome]);

	return (
		<PageExitContext.Provider value={{ isLeaving, leaveToHub, finishExit }}>
			{children}
		</PageExitContext.Provider>
	);
}
