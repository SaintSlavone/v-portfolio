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
const initialPan = clampPan(
	(viewport.width - field.width) / 2,
	(viewport.height - field.height) / 2,
	1,
);

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
		item.children?.forEach((child) => walk(child, depth + 1, node.branch, node.group, node));
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
const linkDistance = (depth: number) =>
	([170, 135, 75][depth - 1] ?? 75) * FIELD_SCALE;

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
	const [pan, setPan] = useState(initialPan);
	const [zoom, setZoom] = useState(1);
	const svgRef = useRef<SVGSVGElement>(null);
	const simRef = useRef<Simulation<GraphNode, undefined> | null>(null);
	const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
		null,
	);
	const nodeDragRef = useRef<GraphNode | null>(null);
	// Active pointers for pinch-zoom detection
	const pointersRef = useRef(new Map<number, { x: number; y: number }>());
	const pinchRef = useRef<{
		dist: number;
		zoom: number;
		midX: number;
		midY: number;
		panX: number;
		panY: number;
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
			.force(
				"x",
				forceX<GraphNode>((node) => anchorFor(node).x).strength(anchorStrength),
			)
			.force(
				"y",
				forceY<GraphNode>((node) => anchorFor(node).y).strength(anchorStrength),
			)
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
	const toFieldCoords = ({ x, y }: { x: number; y: number }) => ({
		x: (x - pan.x) / zoom,
		y: (y - pan.y) / zoom,
	});

	const handleNodePointerDown = (node: GraphNode) => (event: React.PointerEvent) => {
		// The pinned root is not draggable
		if (node.depth === 0) return;
		// Keep the svg from starting a field pan
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		nodeDragRef.current = node;
		node.fx = node.x;
		node.fy = node.y;
		simRef.current?.alphaTarget(0.3).restart();
	};

	// Rescale so the field point under `origin` stays under it after zooming
	const zoomAround = (origin: { x: number; y: number }, nextZoom: number) => {
		const clamped = clampZoom(nextZoom);
		const fieldX = (origin.x - pan.x) / zoom;
		const fieldY = (origin.y - pan.y) / zoom;
		setZoom(clamped);
		setPan(clampPan(origin.x - fieldX * clamped, origin.y - fieldY * clamped, clamped));
	};

	const handleWheel = (event: React.WheelEvent) => {
		const coords = toViewBoxCoords(event);
		if (!coords) return;
		zoomAround(coords, zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12));
	};

	const handlePointerDown = (event: React.PointerEvent) => {
		const coords = toViewBoxCoords(event);
		if (!coords) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		pointersRef.current.set(event.pointerId, coords);

		if (pointersRef.current.size === 2) {
			// Second finger down: switch from panning to pinching
			panRef.current = null;
			const [a, b] = [...pointersRef.current.values()];
			pinchRef.current = {
				dist: Math.hypot(b.x - a.x, b.y - a.y),
				zoom,
				midX: (a.x + b.x) / 2,
				midY: (a.y + b.y) / 2,
				panX: pan.x,
				panY: pan.y,
			};
		} else {
			panRef.current = { startX: coords.x, startY: coords.y, panX: pan.x, panY: pan.y };
		}
	};

	const handlePointerMove = (event: React.PointerEvent) => {
		const coords = toViewBoxCoords(event);
		if (!coords) return;

		const dragged = nodeDragRef.current;
		if (dragged) {
			const fieldCoords = toFieldCoords(coords);
			dragged.fx = Math.max(bounds.minX, Math.min(bounds.maxX, fieldCoords.x));
			dragged.fy = Math.max(bounds.minY, Math.min(bounds.maxY, fieldCoords.y));
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
			setZoom(nextZoom);
			setPan(
				clampPan(pinch.midX - fieldX * nextZoom, pinch.midY - fieldY * nextZoom, nextZoom),
			);
			return;
		}

		const start = panRef.current;
		if (!start) return;
		setPan(
			clampPan(
				start.panX + (coords.x - start.startX),
				start.panY + (coords.y - start.startY),
				zoom,
			),
		);
	};

	const handlePointerUp = (event: React.PointerEvent) => {
		const dragged = nodeDragRef.current;
		if (dragged) {
			dragged.fx = null;
			dragged.fy = null;
			nodeDragRef.current = null;
			simRef.current?.alphaTarget(0);
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
			<g className="graph-field" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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
