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
}

interface GraphLink {
	source: GraphNode;
	target: GraphNode;
	branch: string | null;
}

// Rough anchors matching the Figma composition: Frontend spreads up,
// Backend right-down, DevOps down, Tools left-down
const branchAnchors: Record<string, { x: number; y: number }> = {
	Frontend: { x: 950, y: 380 },
	Backend: { x: 1170, y: 660 },
	DevOps: { x: 830, y: 740 },
	Tools: { x: 640, y: 660 },
};

const rootAnchor = { x: 930, y: 545 };

function buildGraph(tree: SkillTreeNode) {
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];

	const walk = (
		item: SkillTreeNode,
		depth: number,
		branch: string | null,
		parent: GraphNode | null,
	) => {
		const node: GraphNode = {
			id: parent ? `${parent.id}/${item.name}` : item.name,
			name: item.name,
			depth,
			branch: depth === 0 ? null : (branch ?? item.name),
			// Seed positions near the branch anchor so the simulation settles fast
			x: branchAnchors[branch ?? item.name]?.x ?? rootAnchor.x,
			y: branchAnchors[branch ?? item.name]?.y ?? rootAnchor.y,
		};
		nodes.push(node);
		if (parent) links.push({ source: parent, target: node, branch: node.branch });
		item.children?.forEach((child) => walk(child, depth + 1, node.branch, node));
	};

	walk(tree, 0, null, null);
	return { nodes, links };
}

const dotRadius = (depth: number) => [6, 5, 4, 2.5][depth] ?? 2.5;
const linkDistance = (depth: number) => [150, 120, 65][depth - 1] ?? 65;

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
			.force("charge", forceManyBody().strength(-160))
			.force("collide", forceCollide<GraphNode>((node) => dotRadius(node.depth) + 26))
			.force(
				"x",
				forceX<GraphNode>((node) => {
					if (node.depth === 0) return rootAnchor.x;
					return branchAnchors[node.branch ?? ""]?.x ?? rootAnchor.x;
				}).strength((node) => (node.depth <= 1 ? 0.35 : 0.03)),
			)
			.force(
				"y",
				forceY<GraphNode>((node) => {
					if (node.depth === 0) return rootAnchor.y;
					return branchAnchors[node.branch ?? ""]?.y ?? rootAnchor.y;
				}).strength((node) => (node.depth <= 1 ? 0.35 : 0.03)),
			)
			.on("tick", () => setFrame((frame) => frame + 1));

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
