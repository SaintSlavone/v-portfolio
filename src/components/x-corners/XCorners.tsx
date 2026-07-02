"use client";

import "./XCorners.scss";
import "./Adaptations.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface XCornersProps {
	position?: "top" | "bottom" | "left" | "right";
}

// Which two viewport corners hold the decorative arms for each position
const cornersByPosition = {
	top: ["top-left", "top-right"],
	bottom: ["bottom-left", "bottom-right"],
	left: ["top-left", "bottom-left"],
	right: ["top-right", "bottom-right"],
} as const;

// Return-to-hub affordance for interior pages (see Figma "Hub navigation"
// annotation): the X area BETWEEN the two corner strokes is the hover/click
// zone — hovering it reveals a linear gradient, clicking returns to the hub.
// The strokes themselves are decoration. ESC returns as well.
export default function XCorners({ position = "bottom" }: XCornersProps) {
	const router = useRouter();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") router.push("/");
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [router]);

	return (
		<>
			{cornersByPosition[position].map((corner) => (
				<span key={corner} className={`x-corner ${corner}`} aria-hidden="true">
					<svg viewBox="0 0 400 260" preserveAspectRatio="none">
						<line x1="-40" y1="10" x2="440" y2="290" />
					</svg>
				</span>
			))}
			<Link
				href="/"
				aria-label="Back to home"
				className={`x-return-zone ${position}`}
			/>
			<Link href="/" className="x-corners-wordmark" aria-label="Back to home">
				V K
			</Link>
		</>
	);
}
