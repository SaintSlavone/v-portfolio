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

// Longest element exit on any interior page (see the per-page SCSS cascades).
// The push to "/" is held back this long so the elements finish sliding off
// before the hub replaces them.
const EXIT_DURATION = 700;

interface PageExitContextValue {
	isLeaving: boolean;
	leaveToHub: () => void;
}

const PageExitContext = createContext<PageExitContextValue>({
	isLeaving: false,
	leaveToHub: () => {},
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

	const leaveToHub = useCallback(() => {
		// Already on the hub, or an exit is mid-flight — nothing to play
		if (pathname === "/" || timeoutRef.current !== null) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			router.push("/");
			return;
		}

		setLeavingFrom(pathname);
		timeoutRef.current = window.setTimeout(() => {
			timeoutRef.current = null;
			router.push("/");
		}, EXIT_DURATION);
	}, [pathname, router]);

	return (
		<PageExitContext.Provider value={{ isLeaving, leaveToHub }}>
			{children}
		</PageExitContext.Provider>
	);
}
