import { ImageResponse } from "next/og";

// Apple touch icons can't be SVG (see the app-icons file convention), so the
// same X mark as icon.svg is rasterized here instead.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same proportions as icon.svg (359 / 51 bars on a 512 canvas) so the touch
// icon reads as the raster twin of the favicon
const BAR_LENGTH = Math.round((size.width * 359) / 512);
const BAR_WIDTH = Math.round((size.width * 51) / 512);

function Diagonal({ angle }: { angle: number }) {
	return (
		<div
			style={{
				position: "absolute",
				left: "50%",
				top: "50%",
				width: BAR_LENGTH,
				height: BAR_WIDTH,
				background: "#ffffff",
				transform: `translate(-50%, -50%) rotate(${angle}deg)`,
			}}
		/>
	);
}

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				position: "relative",
				background: "#1f1f1f",
			}}
		>
			<Diagonal angle={45} />
			<Diagonal angle={-45} />
		</div>,
		size,
	);
}
