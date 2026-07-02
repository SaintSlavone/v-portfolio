"use client";

import "./SkillsGraph.scss";
import "./Adaptations.scss";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Anchors matching the Figma composition: Frontend spreads across the
// top half, Backend right-down, DevOps down, Tools left-down
const branchAnchors: Record<string, { x: number; y: number }> = {
	Frontend: { x: 950, y: 400 },
	Backend: { x: 1165, y: 690 },
	DevOps: { x: 830, y: 780 },
	Tools: { x: 645, y: 695 },
};

// Depth-2 groups get their own anchors so clusters fill the canvas (see Figma)
const groupAnchors: Record<string, { x: number; y: number }> = {
	Foundation: { x: 430, y: 390 },
	React: { x: 700, y: 250 },
	"Next.js": { x: 1080, y: 240 },
	"3D & WebVR": { x: 1290, y: 330 },
	"UI / UX": { x: 1370, y: 430 },
	Express: { x: 1400, y: 710 },
	Databases: { x: 1340, y: 810 },
	Integrations: { x: 1250, y: 870 },
};

const rootAnchor = { x: 930, y: 545 };

const anchorFor = (node: GraphNode) => {
	if (node.depth === 0) return rootAnchor;
	if (node.depth === 1) return branchAnchors[node.name] ?? rootAnchor;
	return (
		(node.group ? groupAnchors[node.group] : null) ??
		branchAnchors[node.branch ?? ""] ??
		rootAnchor
	);
};

// Keep every node on the canvas regardless of forces
const bounds = { minX: 70, maxX: 1850, minY: 100, maxY: 990 };

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
		const radius = 20 + (nodes.length % 6) * 20;
		node.x = anchor.x + Math.cos(angle) * radius;
		node.y = anchor.y + Math.sin(angle) * radius;
		nodes.push(node);
		if (parent) links.push({ source: parent, target: node, branch: node.branch });
		item.children?.forEach((child) => walk(child, depth + 1, node.branch, node.group, node));
	};

	walk(tree, 0, null, null, null);
	return { nodes, links };
}

const dotRadius = (depth: number) => [6, 5, 4, 2.5][depth] ?? 2.5;
const linkDistance = (depth: number) => [170, 135, 75][depth - 1] ?? 75;

// Branch heads and anchored groups hold their Figma positions firmly;
// leaves only drift toward their group
const anchorStrength = (node: GraphNode) => {
	if (node.depth === 0) return 1;
	if (node.depth === 1) return 0.5;
	if (node.depth === 2 && node.group && groupAnchors[node.group]) return 0.3;
	return 0.05;
};

export default function SkillsGraph() {
	const { nodes, links } = useMemo(() => buildGraph(skills), []);
	const [, setFrame] = useState(0);
	const [activeBranch, setActiveBranch] = useState<string | null>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const simRef = useRef<Simulation<GraphNode, undefined> | null>(null);
	const dragRef = useRef<GraphNode | null>(null);

	useEffect(() => {
		const simulation = forceSimulation(nodes)
			.force(
				"link",
				forceLink<GraphNode, GraphLink>(links)
					.distance(({ target }) => linkDistance(target.depth))
					.strength(0.9),
			)
			.force("charge", forceManyBody().strength(-150))
			.force(
				"collide",
				forceCollide<GraphNode>((node) => (node.depth <= 1 ? 50 : 34)).strength(0.9),
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
				setFrame((frame) => frame + 1);
			});

		// The root stays pinned like in the Figma composition
		const root = nodes[0];
		root.fx = rootAnchor.x;
		root.fy = rootAnchor.y;

		simRef.current = simulation;
		return () => {
			simulation.stop();
		};
	}, [nodes, links]);

	// Screen px -> viewBox coordinates (accounts for the meet scaling)
	const toGraphCoords = (event: React.PointerEvent) => {
		const svg = svgRef.current;
		if (!svg) return null;
		const matrix = svg.getScreenCTM();
		if (!matrix) return null;
		const point = new DOMPoint(event.clientX, event.clientY);
		const { x, y } = point.matrixTransform(matrix.inverse());
		return { x, y };
	};

	const handleNodePointerDown = (node: GraphNode) => (event: React.PointerEvent) => {
		// The pinned root is not draggable
		if (node.depth === 0) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = node;
		node.fx = node.x;
		node.fy = node.y;
		simRef.current?.alphaTarget(0.3).restart();
	};

	const handlePointerMove = (event: React.PointerEvent) => {
		const node = dragRef.current;
		if (!node) return;
		const coords = toGraphCoords(event);
		if (!coords) return;
		node.fx = coords.x;
		node.fy = coords.y;
	};

	const handlePointerUp = () => {
		const node = dragRef.current;
		if (!node) return;
		node.fx = null;
		node.fy = null;
		dragRef.current = null;
		simRef.current?.alphaTarget(0);
	};

	return (
		<svg
			ref={svgRef}
			className="skills-graph"
			viewBox="0 0 1920 1080"
			preserveAspectRatio="xMidYMid meet"
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			{links.map((link) => (
				<line
					key={`${link.source.id}-${link.target.id}`}
					className={`graph-link${
						activeBranch ? (link.branch === activeBranch ? " active" : " dimmed") : ""
					}`}
					x1={link.source.x}
					y1={link.source.y}
					x2={link.target.x}
					y2={link.target.y}
				/>
			))}
			{nodes.map((node) => (
				<g
					key={node.id}
					className={`graph-node depth-${node.depth}${
						activeBranch ? (node.branch === activeBranch ? " active" : " dimmed") : ""
					}`}
					transform={`translate(${node.x}, ${node.y})`}
					onMouseEnter={() => setActiveBranch(node.branch)}
					onMouseLeave={() => setActiveBranch(null)}
					onPointerDown={handleNodePointerDown(node)}
				>
					<circle className="node-dot" r={dotRadius(node.depth)} />
					<text className="node-label" y={node.depth <= 1 ? -14 : -10}>
						{node.name}
					</text>
				</g>
			))}
		</svg>
	);
}
