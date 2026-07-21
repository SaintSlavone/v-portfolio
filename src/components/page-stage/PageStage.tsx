"use client";

import "./PageStage.scss";
import "./Adaptations.scss";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

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
	const enter = enterByRoute[pathname] ?? "";

	return (
		<div key={pathname} className={`page-stage ${enter}`}>
			{children}
		</div>
	);
}
