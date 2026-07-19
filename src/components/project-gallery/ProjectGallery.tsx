"use client";

import "./ProjectGallery.scss";
import "./Adaptations.scss";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface Project {
	id: string;
	name: string;
	role: string;
	years: string;
	duration: string;
	stack: string[];
	links: {
		live: string | null;
		github: string | null;
	};
	thumbnail: string;
	video: string;
	gallery: string[];
}

interface ProjectGalleryProps {
	project: Project;
	onClose: () => void;
}

type Slide =
	| { type: "video"; src: string }
	| { type: "image"; src: string }
	| { type: "info" };

// Iframe gallery overlay per Figma "X Iframe Window Page": slide order is
// video first, then images; the LAST slide is the project info card.
// Close via ✕ or ESC; chevrons hide at the ends (no wrap-around).
export default function ProjectGallery({
	project,
	onClose,
}: ProjectGalleryProps) {
	const [index, setIndex] = useState(0);
	const closeRef = useRef<HTMLButtonElement>(null);

	const slides: Slide[] = [
		{ type: "video", src: project.video },
		...project.gallery.map((src): Slide => ({ type: "image", src })),
		{ type: "info" },
	];
	const slide = slides[index];
	const lastIndex = slides.length - 1;

	// Only mounted client-side (after a card click), so matchMedia is safe
	const reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				// Capture phase + stopPropagation: the overlay swallows ESC
				// before the XCorners return-to-hub listener sees it
				event.stopPropagation();
				onClose();
			}
			if (event.key === "ArrowRight") {
				setIndex((current) => Math.min(current + 1, lastIndex));
			}
			if (event.key === "ArrowLeft") {
				setIndex((current) => Math.max(current - 1, 0));
			}
		};
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [onClose, lastIndex]);

	// Lock page scroll behind the overlay while it is open
	useEffect(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		closeRef.current?.focus();
		return () => {
			document.body.style.overflow = previous;
		};
	}, []);

	return (
		<div
			className="project-gallery"
			role="dialog"
			aria-modal="true"
			aria-label={`${project.name} gallery`}
			onClick={(event) => {
				// Backdrop only — ignore clicks bubbling from the window/controls
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<div className="gallery-window">
				{slide.type === "video" && (
					<video
						className="slide-video"
						src={slide.src}
						autoPlay={!reduceMotion}
						controls={reduceMotion}
						muted
						loop
						playsInline
					/>
				)}
				{slide.type === "image" && (
					<Image
						className="slide-image"
						src={slide.src}
						alt={`${project.name} screenshot ${index + 1}`}
						fill
						sizes="88vw"
					/>
				)}
				{slide.type === "info" && (
					<div className="gallery-info">
						<p className="info-label">Project</p>
						<h2 className="info-name">{project.name}</h2>
						<p className="info-meta">
							{[project.role, project.years, project.duration].join(" · ")}
						</p>
						<p className="info-stack">{project.stack.join(" · ")}</p>
						<hr className="info-divider" />
						<div className="info-links">
							{project.links.live && (
								<a
									className="info-link"
									href={project.links.live}
									target="_blank"
									rel="noreferrer"
								>
									Visit live ↗
								</a>
							)}
							{project.links.github && (
								<a
									className="info-link"
									href={project.links.github}
									target="_blank"
									rel="noreferrer"
								>
									GitHub ↗
								</a>
							)}
						</div>
					</div>
				)}
			</div>
			<button
				ref={closeRef}
				type="button"
				className="gallery-close"
				aria-label="Close gallery"
				onClick={onClose}
			>
				<svg viewBox="0 0 40 40" aria-hidden="true">
					<line x1="4" y1="4" x2="36" y2="36" />
					<line x1="36" y1="4" x2="4" y2="36" />
				</svg>
			</button>
			{index > 0 && (
				<button
					type="button"
					className="gallery-prev"
					aria-label="Previous slide"
					onClick={() => setIndex(index - 1)}
				>
					<svg viewBox="0 0 24 48" aria-hidden="true">
						<polyline points="20 4 4 24 20 44" />
					</svg>
				</button>
			)}
			{index < lastIndex && (
				<button
					type="button"
					className="gallery-next"
					aria-label="Next slide"
					onClick={() => setIndex(index + 1)}
				>
					<svg viewBox="0 0 24 48" aria-hidden="true">
						<polyline points="4 4 20 24 4 44" />
					</svg>
				</button>
			)}
		</div>
	);
}
