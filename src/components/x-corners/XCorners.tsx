"use client";

import "./XCorners.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface XCornersProps {
	position?: "top" | "bottom";
}

// Return-to-hub affordance for interior pages (see Figma "Hub navigation"
// annotation): cropped X arms in two corners; hovering shows a linear
// gradient, clicking returns to the hub. ESC returns as well.
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
			{(["left", "right"] as const).map((side) => (
				<Link
					key={side}
					href="/"
					aria-label="Back to home"
					className={`x-corner ${position}-${side}`}
				>
					<svg viewBox="0 0 400 260" preserveAspectRatio="none" aria-hidden="true">
						<line x1="-40" y1="10" x2="440" y2="290" />
					</svg>
				</Link>
			))}
			<Link href="/" className="x-corners-wordmark" aria-label="Back to home">
				V K
			</Link>
		</>
	);
}
