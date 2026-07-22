"use client";

import "./SkillsGraph.scss";
import "./Adaptations.scss";
import { useEffect, useRef, useState } from "react";
import {
	forceCollide,
	forceLink,
	forceManyBody,
	forceSimulation,
	forceX,
	forceY,
	type Simulation,
	type SimulationNodeDatum,
} from "d3-force";
import skills from "@/data/skills.json";

interface SkillTreeNode {
	name: string;
	children?: SkillTreeNode[];
}

interface GraphNode extends SimulationNodeDatum {
	id: string;
	name: string;
	depth: number;
	// Top-level branch this node belongs to — drives hover highlighting
	branch: string | null;
	// Depth-2 ancestor name — drives group anchoring
	group: string | null;
}

interface GraphLink {
	source: GraphNode;
	target: GraphNode;
	branch: string | null;
}

// The whole field transform in one value — the glide loop rewrites all three
// together, so they cannot be separate states without tearing between frames
interface View {
	x: number;
	y: number;
	zoom: number;
}

// Velocity carried after a gesture ends: vx/vy pan the field, vz is log-zoom
// around the origin the gesture last focused on
interface Glide {
	vx: number;
	vy: number;
	vz: number;
	originX: number;
	originY: number;
}

// The node field is 1.5x the viewport — the user pans the whole field
// by dragging anywhere on it; nodes themselves are static (hover only)
const FIELD_SCALE = 1.5;
const viewport = { width: 1920, height: 1080 };
const field = {
	width: viewport.width * FIELD_SCALE,
	height: viewport.height * FIELD_SCALE,
};

// Anchors matching the Figma composition (design coords, scaled to the field):
// Frontend spreads across the top half, Backend right-down, DevOps down,
// Tools left-down
const scaled = ({ x, y }: { x: number; y: number }) => ({
	x: x * FIELD_SCALE,
	y: y * FIELD_SCALE,
});

const branchAnchors: Record<string, { x: number; y: number }> = {
	Frontend: scaled({ x: 950, y: 400 }),
	Backend: scaled({ x: 1165, y: 690 }),
	DevOps: scaled({ x: 830, y: 780 }),
	Tools: scaled({ x: 645, y: 695 }),
};

// Depth-2 groups get their own anchors so clusters fill the field (see Figma)
const groupAnchors: Record<string, { x: number; y: number }> = {
	Foundation: scaled({ x: 430, y: 390 }),
	React: scaled({ x: 700, y: 250 }),
	"Next.js": scaled({ x: 1080, y: 240 }),
	"3D & WebVR": scaled({ x: 1290, y: 330 }),
	"UI / UX": scaled({ x: 1370, y: 430 }),
	Express: scaled({ x: 1400, y: 710 }),
	Databases: scaled({ x: 1340, y: 810 }),
	Integrations: scaled({ x: 1250, y: 870 }),
};

const rootAnchor = scaled({ x: 930, y: 545 });

const anchorFor = (node: GraphNode) => {
	if (node.depth === 0) return rootAnchor;
	if (node.depth === 1) return branchAnchors[node.name] ?? rootAnchor;
	return (
		(node.group ? groupAnchors[node.group] : null) ??
		branchAnchors[node.branch ?? ""] ??
		rootAnchor
	);
};

// Keep every node inside the field regardless of forces
const bounds = { minX: 90, maxX: field.width - 90, minY: 110, maxY: field.height - 110 };

// Zoom limits: min still covers the viewport (2880 * 0.7 > 1920), max 2x
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2;

const clampZoom = (zoom: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));

// The field can be panned until its far edge meets the viewport edge
const clampPan = (x: number, y: number, zoom: number) => ({
	x: Math.max(viewport.width - field.width * zoom, Math.min(0, x)),
	y: Math.max(viewport.height - field.height * zoom, Math.min(0, y)),
});

// Start centered on the field
const initialView: View = {
	...clampPan((viewport.width - field.width) / 2, (viewport.height - field.height) / 2, 1),
	zoom: 1,
};

// Inertia tuning. Decays are per-millisecond factors so the glide feels the
// same on any refresh rate; speeds are viewBox units per millisecond.
const PAN_DECAY = 0.996;
const PAN_MIN_SPEED = 0.015;
const PAN_MAX_SPEED = 4;
const ZOOM_DECAY = 0.99;
const ZOOM_MIN_SPEED = 0.00002;
const ZOOM_MAX_SPEED = 0.005;
// One wheel notch coasts out to the same 1.12x step the instant zoom used
const WHEEL_IMPULSE = 0.00115;
// A pause before releasing means the user parked the field — no fling
const FLING_IDLE_MS = 80;
// A backgrounded tab must not come back and apply one huge frame
const MAX_FRAME_MS = 64;
// d3-force advances one tick per frame, so per-ms velocity scales by a frame
const TICK_MS = 16;
const NODE_FLING_SCALE = 2;
const NODE_FLING_MAX = 30;

const clampSpeed = (value: number, max: number) => Math.max(-max, Math.min(max, value));

function buildGraph(tree: SkillTreeNode) {
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];

	const walk = (
		item: SkillTreeNode,
		depth: number,
		branch: string | null,
		group: string | null,
		parent: GraphNode | null,
	) => {
		const node: GraphNode = {
			id: parent ? `${parent.id}/${item.name}` : item.name,
			name: item.name,
			depth,
			branch: depth === 0 ? null : (branch ?? item.name),
			group: depth < 2 ? null : (group ?? item.name),
		};
		// Deterministic golden-angle jitter: spreads siblings around the anchor
		// without Math.random(), so SSR and client render the same markup
		const anchor = anchorFor(node);
		const angle = nodes.length * 2.39996;
		const radius = 30 + (nodes.length % 6) * 30;
		node.x = anchor.x + Math.cos(angle) * radius;
		node.y = anchor.y + Math.sin(angle) * radius;
		nodes.push(node);
		if (parent) links.push({ source: parent, target: node, branch: node.branch });
		item.children?.forEach((child) =>
			walk(child, depth + 1, node.branch, node.group, node),
		);
	};

	walk(tree, 0, null, null, null);
	return { nodes, links };
}

// Module-level singleton: d3-force mutates node objects in place, which the
// React Compiler forbids for render-scoped values. The data is static JSON,
// so the graph lives outside the component; rendering reads position
// SNAPSHOTS from state (the compiler memoizes JSX by dependencies, so
// reading mutated fields directly would render stale frames).
const { nodes, links } = buildGraph(skills);

type PositionMap = Record<string, { x: number; y: number }>;

const snapshotPositions = (): PositionMap =>
	Object.fromEntries(nodes.map((node) => [node.id, { x: node.x ?? 0, y: node.y ?? 0 }]));

const dotRadius = (depth: number) => [6, 5, 4, 2.5][depth] ?? 2.5;
const linkDistance = (depth: number) => ([170, 135, 75][depth - 1] ?? 75) * FIELD_SCALE;

// Branch heads and anchored groups hold their Figma positions firmly;
// leaves only drift toward their group
const anchorStrength = (node: GraphNode) => {
	if (node.depth === 0) return 1;
	if (node.depth === 1) return 0.5;
	if (node.depth === 2 && node.group && groupAnchors[node.group]) return 0.3;
	return 0.05;
};

export default function SkillsGraph() {
	const [positions, setPositions] = useState<PositionMap>(snapshotPositions);
	// Hover highlights the hovered node's subtree only (ids are path-based)
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [view, setView] = useState<View>(initialView);
	const svgRef = useRef<SVGSVGElement>(null);
	const simRef = useRef<Simulation<GraphNode, undefined> | null>(null);
	// The glide loop runs between renders, so the live transform lives in a ref
	// and state only mirrors it for rendering
	const viewRef = useRef<View>(initialView);
	const glideRef = useRef<Glide | null>(null);
	const frameRef = useRef<number | null>(null);
	const frameTimeRef = useRef<number | null>(null);
	const panRef = useRef<{
		startX: number;
		startY: number;
		panX: number;
		panY: number;
		lastX: number;
		lastY: number;
		lastTime: number;
		vx: number;
		vy: number;
	} | null>(null);
	const nodeDragRef = useRef<{
		node: GraphNode;
		lastX: number;
		lastY: number;
		lastTime: number;
		vx: number;
		vy: number;
	} | null>(null);
	// Active pointers for pinch-zoom detection
	const pointersRef = useRef(new Map<number, { x: number; y: number }>());
	const pinchRef = useRef<{
		dist: number;
		zoom: number;
		midX: number;
		midY: number;
		panX: number;
		panY: number;
		lastZoom: number;
		lastTime: number;
		vz: number;
	} | null>(null);

	useEffect(() => {
		const simulation = forceSimulation(nodes)
			.force(
				"link",
				forceLink<GraphNode, GraphLink>(links)
					.distance(({ target }) => linkDistance(target.depth))
					.strength(0.9),
			)
			.force("charge", forceManyBody().strength(-180))
			.force(
				"collide",
				forceCollide<GraphNode>((node) => (node.depth <= 1 ? 56 : 40)).strength(0.9),
			)
			.force("x", forceX<GraphNode>((node) => anchorFor(node).x).strength(anchorStrength))
			.force("y", forceY<GraphNode>((node) => anchorFor(node).y).strength(anchorStrength))
			.on("tick", () => {
				for (const node of nodes) {
					node.x = Math.max(bounds.minX, Math.min(bounds.maxX, node.x ?? 0));
					node.y = Math.max(bounds.minY, Math.min(bounds.maxY, node.y ?? 0));
				}
				setPositions(snapshotPositions());
			});

		// The root stays pinned like in the Figma composition
		const root = nodes[0];
		root.fx = rootAnchor.x;
		root.fy = rootAnchor.y;

		simRef.current = simulation;
		return () => {
			simulation.stop();
		};
	}, []);

	useEffect(
		() => () => {
			if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
		},
		[],
	);

	const applyView = (next: View) => {
		viewRef.current = next;
		setView(next);
	};

	const stopGlide = () => {
		glideRef.current = null;
		frameTimeRef.current = null;
		if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
		frameRef.current = null;
	};

	const step = (time: number) => {
		const glide = glideRef.current;
		if (!glide) {
			frameRef.current = null;
			return;
		}
		// The first frame only establishes the clock
		const previous = frameTimeRef.current;
		frameTimeRef.current = time;
		if (previous === null) {
			frameRef.current = requestAnimationFrame(step);
			return;
		}
		const dt = Math.min(time - previous, MAX_FRAME_MS);

		let { x, y, zoom } = viewRef.current;

		if (glide.vz !== 0) {
			const nextZoom = clampZoom(zoom * Math.exp(glide.vz * dt));
			// Keep the field point under the gesture origin pinned while coasting
			x = glide.originX - ((glide.originX - x) / zoom) * nextZoom;
			y = glide.originY - ((glide.originY - y) / zoom) * nextZoom;
			// A zoom limit absorbs the rest of the impulse
			if (nextZoom === zoom) glide.vz = 0;
			zoom = nextZoom;
			glide.vz *= Math.pow(ZOOM_DECAY, dt);
			if (Math.abs(glide.vz) < ZOOM_MIN_SPEED) glide.vz = 0;
		}

		x += glide.vx * dt;
		y += glide.vy * dt;
		const panned = clampPan(x, y, zoom);
		// The field edge absorbs the momentum instead of the glide grinding on it
		if (panned.x !== x) glide.vx = 0;
		if (panned.y !== y) glide.vy = 0;
		glide.vx *= Math.pow(PAN_DECAY, dt);
		glide.vy *= Math.pow(PAN_DECAY, dt);
		if (Math.hypot(glide.vx, glide.vy) < PAN_MIN_SPEED) {
			glide.vx = 0;
			glide.vy = 0;
		}

		applyView({ ...panned, zoom });

		if (glide.vx === 0 && glide.vy === 0 && glide.vz === 0) {
			stopGlide();
			return;
		}
		frameRef.current = requestAnimationFrame(step);
	};

	const startGlide = (glide: Glide) => {
		glideRef.current = glide;
		if (frameRef.current === null) {
			frameTimeRef.current = null;
			frameRef.current = requestAnimationFrame(step);
		}
	};

	// Screen px -> viewBox coordinates (accounts for the meet scaling)
	const toViewBoxCoords = (event: { clientX: number; clientY: number }) => {
		const svg = svgRef.current;
		if (!svg) return null;
		const matrix = svg.getScreenCTM();
		if (!matrix) return null;
		const point = new DOMPoint(event.clientX, event.clientY);
		const { x, y } = point.matrixTransform(matrix.inverse());
		return { x, y };
	};

	// A node lights up when the hovered node is itself or one of its ancestors
	const inHoveredSubtree = (id: string) =>
		hoveredId !== null && (id === hoveredId || id.startsWith(`${hoveredId}/`));

	const highlightClass = (id: string) =>
		hoveredId ? (inHoveredSubtree(id) ? " active" : " dimmed") : "";

	// ViewBox -> field coordinates (undo the pan/zoom transform)
	const toFieldCoords = ({ x, y }: { x: number; y: number }) => {
		const { x: panX, y: panY, zoom } = viewRef.current;
		return { x: (x - panX) / zoom, y: (y - panY) / zoom };
	};

	// Exponential smoothing so one jittery sample cannot define the whole fling
	const sampleSpeed = (previous: number, delta: number, dt: number) =>
		previous * 0.4 + (delta / dt) * 0.6;

	const handleNodePointerDown = (node: GraphNode) => (event: React.PointerEvent) => {
		// The pinned root is not draggable
		if (node.depth === 0) return;
		// Keep the svg from starting a field pan
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		stopGlide();
		nodeDragRef.current = {
			node,
			lastX: node.x ?? 0,
			lastY: node.y ?? 0,
			lastTime: event.timeStamp,
			vx: 0,
			vy: 0,
		};
		node.fx = node.x;
		node.fy = node.y;
		simRef.current?.alphaTarget(0.3).restart();
	};

	const handleWheel = (event: React.WheelEvent) => {
		const coords = toViewBoxCoords(event);
		if (!coords) return;
		// Notches stack into one impulse; the loop spends it and coasts out
		const glide = glideRef.current;
		startGlide({
			vx: glide?.vx ?? 0,
			vy: glide?.vy ?? 0,
			vz: clampSpeed(
				(glide?.vz ?? 0) + (event.deltaY < 0 ? WHEEL_IMPULSE : -WHEEL_IMPULSE),
				ZOOM_MAX_SPEED,
			),
			originX: coords.x,
			originY: coords.y,
		});
	};

	const handlePointerDown = (event: React.PointerEvent) => {
		const coords = toViewBoxCoords(event);
		if (!coords) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		// Grabbing the field catches it mid-glide
		stopGlide();
		pointersRef.current.set(event.pointerId, coords);
		const { x: panX, y: panY, zoom } = viewRef.current;

		if (pointersRef.current.size === 2) {
			// Second finger down: switch from panning to pinching
			panRef.current = null;
			const [a, b] = [...pointersRef.current.values()];
			pinchRef.current = {
				dist: Math.hypot(b.x - a.x, b.y - a.y),
				zoom,
				midX: (a.x + b.x) / 2,
				midY: (a.y + b.y) / 2,
				panX,
				panY,
				lastZoom: zoom,
				lastTime: event.timeStamp,
				vz: 0,
			};
		} else {
			panRef.current = {
				startX: coords.x,
				startY: coords.y,
				panX,
				panY,
				lastX: coords.x,
				lastY: coords.y,
				lastTime: event.timeStamp,
				vx: 0,
				vy: 0,
			};
		}
	};

	const handlePointerMove = (event: React.PointerEvent) => {
		const coords = toViewBoxCoords(event);
		if (!coords) return;

		const dragged = nodeDragRef.current;
		if (dragged) {
			const fieldCoords = toFieldCoords(coords);
			const nextX = Math.max(bounds.minX, Math.min(bounds.maxX, fieldCoords.x));
			const nextY = Math.max(bounds.minY, Math.min(bounds.maxY, fieldCoords.y));
			const now = event.timeStamp;
			const dt = now - dragged.lastTime;
			if (dt > 0) {
				dragged.vx = sampleSpeed(dragged.vx, nextX - dragged.lastX, dt);
				dragged.vy = sampleSpeed(dragged.vy, nextY - dragged.lastY, dt);
				dragged.lastX = nextX;
				dragged.lastY = nextY;
				dragged.lastTime = now;
			}
			dragged.node.fx = nextX;
			dragged.node.fy = nextY;
			return;
		}

		if (pointersRef.current.has(event.pointerId)) {
			pointersRef.current.set(event.pointerId, coords);
		}

		const pinch = pinchRef.current;
		if (pinch && pointersRef.current.size === 2) {
			const [a, b] = [...pointersRef.current.values()];
			const dist = Math.hypot(b.x - a.x, b.y - a.y);
			if (dist === 0 || pinch.dist === 0) return;
			const nextZoom = clampZoom(pinch.zoom * (dist / pinch.dist));
			// Keep the field point under the initial pinch midpoint stable
			const fieldX = (pinch.midX - pinch.panX) / pinch.zoom;
			const fieldY = (pinch.midY - pinch.panY) / pinch.zoom;
			const now = event.timeStamp;
			const dt = now - pinch.lastTime;
			if (dt > 0) {
				// Log-scale rate, the same unit the glide loop spends
				pinch.vz = sampleSpeed(pinch.vz, Math.log(nextZoom / pinch.lastZoom), dt);
				pinch.lastZoom = nextZoom;
				pinch.lastTime = now;
			}
			applyView({
				...clampPan(pinch.midX - fieldX * nextZoom, pinch.midY - fieldY * nextZoom, nextZoom),
				zoom: nextZoom,
			});
			return;
		}

		const start = panRef.current;
		if (!start) return;
		const now = event.timeStamp;
		const dt = now - start.lastTime;
		if (dt > 0) {
			start.vx = sampleSpeed(start.vx, coords.x - start.lastX, dt);
			start.vy = sampleSpeed(start.vy, coords.y - start.lastY, dt);
			start.lastX = coords.x;
			start.lastY = coords.y;
			start.lastTime = now;
		}
		applyView({
			...clampPan(
				start.panX + (coords.x - start.startX),
				start.panY + (coords.y - start.startY),
				viewRef.current.zoom,
			),
			zoom: viewRef.current.zoom,
		});
	};

	const handlePointerUp = (event: React.PointerEvent) => {
		const now = event.timeStamp;
		const dragged = nodeDragRef.current;
		if (dragged) {
			const { node, vx, vy } = dragged;
			node.fx = null;
			node.fy = null;
			nodeDragRef.current = null;
			// Let go mid-swipe and the node flies on before the forces reel it in
			if (now - dragged.lastTime < FLING_IDLE_MS) {
				node.vx = clampSpeed(vx * TICK_MS * NODE_FLING_SCALE, NODE_FLING_MAX);
				node.vy = clampSpeed(vy * TICK_MS * NODE_FLING_SCALE, NODE_FLING_MAX);
			}
			simRef.current?.alphaTarget(0).alpha(0.3).restart();
		}

		const pinch = pinchRef.current;
		const start = panRef.current;
		// A fling carries on; a pause before release parks the field where it is
		if (pinch && now - pinch.lastTime < FLING_IDLE_MS && pinch.vz !== 0) {
			startGlide({
				vx: 0,
				vy: 0,
				vz: clampSpeed(pinch.vz, ZOOM_MAX_SPEED),
				originX: pinch.midX,
				originY: pinch.midY,
			});
		} else if (start && now - start.lastTime < FLING_IDLE_MS) {
			startGlide({
				vx: clampSpeed(start.vx, PAN_MAX_SPEED),
				vy: clampSpeed(start.vy, PAN_MAX_SPEED),
				vz: 0,
				originX: start.lastX,
				originY: start.lastY,
			});
		}

		pointersRef.current.delete(event.pointerId);
		pinchRef.current = null;
		panRef.current = null;
	};

	return (
		<svg
			ref={svgRef}
			className="skills-graph"
			viewBox="0 0 1920 1080"
			preserveAspectRatio="xMidYMid meet"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
			onWheel={handleWheel}
		>
			<g
				className="graph-field"
				transform={`translate(${view.x}, ${view.y}) scale(${view.zoom})`}
			>
				{links.map((link) => (
					<line
						key={`${link.source.id}-${link.target.id}`}
						className={`graph-link${highlightClass(link.source.id)}`}
						x1={positions[link.source.id]?.x}
						y1={positions[link.source.id]?.y}
						x2={positions[link.target.id]?.x}
						y2={positions[link.target.id]?.y}
					/>
				))}
				{nodes.map((node) => (
					<g
						key={node.id}
						className={`graph-node depth-${node.depth}${highlightClass(node.id)}`}
						transform={`translate(${positions[node.id]?.x ?? 0}, ${positions[node.id]?.y ?? 0})`}
						onMouseEnter={() => setHoveredId(node.id)}
						onMouseLeave={() => setHoveredId(null)}
						onPointerDown={handleNodePointerDown(node)}
					>
						<circle className="node-dot" r={dotRadius(node.depth)} />
						<text className="node-label" y={node.depth <= 1 ? -14 : -10}>
							{node.name}
						</text>
					</g>
				))}
			</g>
		</svg>
	);
}
