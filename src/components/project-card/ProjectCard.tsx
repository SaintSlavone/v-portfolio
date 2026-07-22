"use client";

import "./ProjectCard.scss";
import "./Adaptations.scss";
import Image from "next/image";
import { useRef, useState } from "react";
import ProjectGallery, { Project } from "@/components/project-gallery/ProjectGallery";

interface ProjectCardProps {
	project: Project;
}

// Card behavior per Figma "X Projects Page" annotation: idle — grey static
// thumbnail with no text (intentional); hover — color + preview video playing
// (muted, loop); click — the iframe gallery overlay.
export default function ProjectCard({ project }: ProjectCardProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [active, setActive] = useState(false);
	const [galleryOpen, setGalleryOpen] = useState(false);

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

	const handleOpen = () => {
		// The preview keeps looping under the overlay otherwise
		handleDeactivate();
		setGalleryOpen(true);
	};

	return (
		<>
			<button
				type="button"
				className={`project-card${active ? " is-active" : ""}`}
				aria-label={`Open ${project.name} gallery`}
				onMouseEnter={handleActivate}
				onMouseLeave={handleDeactivate}
				onFocus={handleActivate}
				onBlur={handleDeactivate}
				onClick={handleOpen}
			>
				<Image
					className="card-thumb"
					src={project.thumbnail}
					alt={`${project.name} — ${project.stack.join(", ")}`}
					fill
					sizes="(max-width: 600px) 100vw, 89vw"
				/>
				{/* The card carries no visible text by design; without this the
				    projects page would be six images and nothing to index */}
				<span className="visually-hidden">
					{project.name} · {project.role} · {project.years} · {project.stack.join(", ")}
				</span>
				<video
					ref={videoRef}
					className="card-video"
					src={project.video}
					muted
					loop
					playsInline
					preload="none"
				/>
			</button>
			{galleryOpen && (
				<ProjectGallery project={project} onClose={() => setGalleryOpen(false)} />
			)}
		</>
	);
}
