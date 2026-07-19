"use client";

import "./ProjectCard.scss";
import "./Adaptations.scss";
import Image from "next/image";
import { useRef, useState } from "react";

interface ProjectCardProps {
	name: string;
	thumbnail: string;
	video: string;
}

// Card behavior per Figma "X Projects Page" annotation: idle — grey static
// thumbnail with no text (intentional); hover — color + preview video playing
// (muted, loop). Click will open the iframe gallery overlay (next step).
export default function ProjectCard({
	name,
	thumbnail,
	video,
}: ProjectCardProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [active, setActive] = useState(false);

	const handleActivate = () => {
		setActive(true);
		// play() can reject if the user leaves before buffering finishes
		videoRef.current?.play().catch(() => {});
	};

	const handleDeactivate = () => {
		setActive(false);
		const element = videoRef.current;
		if (element) {
			element.pause();
			element.currentTime = 0;
		}
	};

	return (
		<button
			type="button"
			className={`project-card${active ? " is-active" : ""}`}
			aria-label={`Open ${name} gallery`}
			onMouseEnter={handleActivate}
			onMouseLeave={handleDeactivate}
			onFocus={handleActivate}
			onBlur={handleDeactivate}
		>
			<Image
				className="card-thumb"
				src={thumbnail}
				alt=""
				fill
				sizes="(max-width: 600px) 100vw, 89vw"
			/>
			<video
				ref={videoRef}
				className="card-video"
				src={video}
				muted
				loop
				playsInline
				preload="none"
			/>
		</button>
	);
}
