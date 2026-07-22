"use client";

import "./PageStage.scss";
import "./Adaptations.scss";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { usePageExit } from "@/components/page-exit/PageExit";

// Skills slides in as one block from the side opposite the X's exit. The other
// interior pages (about / projects / contacts) instead stagger their own
// elements (see each page's SCSS), so they're intentionally left out here.
// Keyed by pathname so the block entrance re-runs on every navigation.
const enterByRoute: Record<string, string> = {
	"/skills": "enter-left",
};

interface PageStageProps {
	children: ReactNode;
}

export default function PageStage({ children }: PageStageProps) {
	const pathname = usePathname();
	const { isLeaving } = usePageExit();
	const enter = enterByRoute[pathname] ?? "";
	// Marks the whole stage so each page's SCSS can reverse its own cascade
	const leaving = isLeaving ? "is-leaving" : "";

	return (
		<div key={pathname} className={`page-stage ${enter} ${leaving}`}>
			{children}
		</div>
	);
}
