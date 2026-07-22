import { ImageResponse } from "next/og";
import site from "@/data/site.json";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.jobTitle}`;

// Corner-to-corner diagonals of the 1200×630 frame: the hub X, rebuilt with
// rotated divs because ImageResponse renders a flexbox subset only (no SVG
// stroke geometry, no grid).
const DIAGONAL_LENGTH = Math.round(Math.hypot(size.width, size.height));
const DIAGONAL_ANGLE = (Math.atan2(size.height, size.width) * 180) / Math.PI;

function Diagonal({ angle }: { angle: number }) {
	return (
		<div
			style={{
				position: "absolute",
				left: "50%",
				top: "50%",
				width: DIAGONAL_LENGTH,
				height: 2,
				background: "rgba(255, 255, 255, 0.55)",
				transform: `translate(-50%, -50%) rotate(${angle}deg)`,
			}}
		/>
	);
}

export default function OpenGraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "flex-end",
				position: "relative",
				background: "#1f1f1f",
				padding: 72,
				color: "#ffffff",
			}}
		>
			<Diagonal angle={DIAGONAL_ANGLE} />
			<Diagonal angle={-DIAGONAL_ANGLE} />
			<div style={{ display: "flex", flexDirection: "column" }}>
				<div
					style={{
						fontSize: 78,
						letterSpacing: 6,
						textTransform: "uppercase",
					}}
				>
					{site.name}
				</div>
				<div
					style={{
						marginTop: 18,
						fontSize: 32,
						letterSpacing: 4,
						textTransform: "uppercase",
						color: "#cfcfcf",
					}}
				>
					{site.jobTitle}
				</div>
				<div style={{ marginTop: 28, fontSize: 24, color: "#9a9a9a" }}>
					Next.js · Three.js · Mapbox GL · krpano
				</div>
			</div>
		</div>,
		size,
	);
}
