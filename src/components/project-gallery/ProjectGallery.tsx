"use client";

import "photoswipe/style.css";
import "./ProjectGallery.scss";
import "./Adaptations.scss";
import { useEffect, useRef } from "react";
import PhotoSwipe, { SlideData } from "photoswipe";

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

// Custom payloads ride along in PhotoSwipe's SlideData (which is a loose
// Record) so contentLoad can tell a video / info slide from an image one.
interface GallerySlideData extends SlideData {
	type?: "video" | "info";
	videoSrc?: string;
}

// Thin-stroke icons matching the persistent X (see x-field) — PhotoSwipe
// injects each as the button's inner markup, keyed by the *SVG options below.
const CLOSE_SVG = `<svg class="pswp__icn" viewBox="0 0 40 40" aria-hidden="true"><line x1="7" y1="7" x2="33" y2="33"/><line x1="33" y1="7" x2="7" y2="33"/></svg>`;
const ARROW_PREV_SVG = `<svg class="pswp__icn" viewBox="0 0 24 48" aria-hidden="true"><polyline points="20 5 5 24 20 43"/></svg>`;
const ARROW_NEXT_SVG = `<svg class="pswp__icn" viewBox="0 0 24 48" aria-hidden="true"><polyline points="4 5 19 24 4 43"/></svg>`;

// Builds the final "project info" slide as detached DOM (PhotoSwipe owns the
// lifecycle, so this can't be JSX). Mirrors the old overlay's info card.
function createInfoSlide(project: Project): HTMLDivElement {
	const wrap = document.createElement("div");
	wrap.className = "gallery-custom-slide";

	const info = document.createElement("div");
	info.className = "gallery-info";
	info.innerHTML = `
		<p class="info-label">Project</p>
		<h2 class="info-name"></h2>
		<p class="info-meta"></p>
		<p class="info-stack"></p>
		<hr class="info-divider" />
		<div class="info-links"></div>
	`;

	// textContent (not innerHTML) so project copy can never inject markup
	info.querySelector(".info-name")!.textContent = project.name;
	info.querySelector(".info-meta")!.textContent = [
		project.role,
		project.years,
		project.duration,
	].join(" · ");
	info.querySelector(".info-stack")!.textContent = project.stack.join(" · ");

	const links = info.querySelector(".info-links")!;
	const addLink = (href: string, label: string) => {
		const anchor = document.createElement("a");
		anchor.className = "info-link";
		anchor.href = href;
		anchor.target = "_blank";
		anchor.rel = "noreferrer";
		anchor.textContent = label;
		links.appendChild(anchor);
	};
	if (project.links.live) addLink(project.links.live, "Visit live ↗");
	if (project.links.github) addLink(project.links.github, "GitHub ↗");

	wrap.appendChild(info);
	return wrap;
}

// Longest edge (px) we normalize every screenshot to. Small shots (e.g.
// Ellington's ~860px) get their *declared* size inflated to this baseline so
// PhotoSwipe fits them down to fill the frame instead of showing them tiny.
// Crucially this keeps the resting zoom at "fit" (≤1×): above it PhotoSwipe's
// isPannable() turns a horizontal mouse-drag into a pan instead of a slide.
const NORMALIZED_LONG_EDGE = 2560;

// PhotoSwipe needs each image's real aspect ratio up front (it never reads
// naturalWidth off the loaded <img>) — without it, images render un-fitted and
// non-zoomable. Reading it off a detached Image() also warms the browser cache.
// Dimensions come back normalized to NORMALIZED_LONG_EDGE (never scaled down).
function loadImageSize(src: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve) => {
		const normalize = (width: number, height: number) => {
			const scale = Math.max(1, NORMALIZED_LONG_EDGE / Math.max(width, height));
			return { width: Math.round(width * scale), height: Math.round(height * scale) };
		};
		const img = new window.Image();
		img.onload = () => resolve(normalize(img.naturalWidth, img.naturalHeight));
		img.onerror = () => resolve({ width: 1600, height: 1000 }); // 16:10 fallback
		img.src = src;
	});
}

// PhotoSwipe-powered gallery. Slide order follows Figma "X Iframe Window
// Page": preview video first, then screenshots, then the info card last.
// This component renders nothing itself — it just drives a PhotoSwipe
// instance mounted on <body>, which layers above the persistent X frame.
export default function ProjectGallery({ project, onClose }: ProjectGalleryProps) {
	// Keep the latest onClose reachable without re-running the effect (which
	// would tear down and rebuild the whole gallery on a parent re-render)
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		let pswp: PhotoSwipe | null = null;
		// StrictMode mounts → unmounts → mounts effects in dev; the async preload
		// below defers init, and this guard drops the throwaway first pass so we
		// never build two stacked instances
		let cancelled = false;

		// Capture phase + stopPropagation: the gallery swallows ESC before the
		// XField return-to-hub listener (bubble phase, window) can see it.
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.stopPropagation();
				pswp?.close();
			}
		};

		// Fired on every close path (✕ / ESC / backdrop / swipe-down) and by our
		// own cleanup. Only tell the parent when the user closed it — during an
		// unmount (cancelled) the parent is already tearing this component down.
		const handleDestroy = () => {
			pswp = null;
			if (!cancelled) onCloseRef.current();
		};

		const open = async () => {
			const sizes = await Promise.all(project.gallery.map(loadImageSize));
			if (cancelled) return;

			const dataSource: GallerySlideData[] = [
				{ type: "video", videoSrc: project.video },
				...project.gallery.map((src, i): GallerySlideData => ({
					src,
					width: sizes[i].width,
					height: sizes[i].height,
					alt: `${project.name} screenshot`,
				})),
				{ type: "info" },
			];

			pswp = new PhotoSwipe({
				dataSource,
				index: 0,
				bgOpacity: 0.8,
				loop: false, // no wrap-around; end arrows disable (hidden via CSS)
				counter: false,
				zoom: false, // no zoom button — scroll / double-tap still zoom images
				escKey: false, // handled below so ESC never reaches XField's listener
				clickToCloseNonZoomable: false, // clicking the video / info won't close
				mainClass: "project-gallery-pswp",
				closeSVG: CLOSE_SVG,
				arrowPrevSVG: ARROW_PREV_SVG,
				arrowNextSVG: ARROW_NEXT_SVG,
				showHideAnimationType: "fade",
				appendToEl: document.body,
			});

			// Swap in the custom (non-image) slides. Their content element is left
			// unsized, so PhotoSwipe stretches it to the full viewport for us.
			pswp.on("contentLoad", (event) => {
				const { content } = event;
				const data = content.data as GallerySlideData;
				if (data.type === "video") {
					event.preventDefault();
					const wrap = document.createElement("div");
					wrap.className = "gallery-custom-slide";
					const video = document.createElement("video");
					video.className = "slide-video";
					video.src = data.videoSrc ?? "";
					video.muted = true;
					video.loop = true;
					video.playsInline = true;
					video.controls = reduceMotion; // give a manual play affordance
					wrap.appendChild(video);
					content.element = wrap;
				} else if (data.type === "info") {
					event.preventDefault();
					content.element = createInfoSlide(project);
				}
			});

			// Only the visible video plays; reset it once its slide leaves view
			pswp.on("contentActivate", ({ content }) => {
				const video = content.element?.querySelector<HTMLVideoElement>(".slide-video");
				if (video && !reduceMotion) video.play().catch(() => {});
			});
			pswp.on("contentDeactivate", ({ content }) => {
				const video = content.element?.querySelector<HTMLVideoElement>(".slide-video");
				if (video) {
					video.pause();
					video.currentTime = 0;
				}
			});

			pswp.on("destroy", handleDestroy);
			window.addEventListener("keydown", handleEscape, true);
			pswp.init();
		};
		open();

		return () => {
			cancelled = true;
			window.removeEventListener("keydown", handleEscape, true);
			// destroy() re-enters handleDestroy, which nulls pswp; cancelled keeps
			// it from bouncing onClose back at an already-unmounting parent
			pswp?.destroy();
		};
		// project is a stable JSON import, so this effect runs once per open
	}, [project]);

	return null;
}
