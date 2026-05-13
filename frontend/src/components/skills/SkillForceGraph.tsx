"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { SkillEdge, SkillNode } from "@/lib/skills-api";

/**
 * Tiny self-contained force-directed graph using SVG.
 *
 * We re-implement the bits of d3-force we need (charge repulsion, link
 * attraction, centering) so we don't drag in 200 kB of dependencies. Good
 * enough up to ~80 nodes — performance starts to degrade past that.
 */

interface SimNode extends SkillNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Pinned (currently being dragged) flag. */
  fx?: number | null;
  fy?: number | null;
}

interface Props {
  nodes: SkillNode[];
  edges: SkillEdge[];
  width?: number;
  height?: number;
}

const CLUSTER_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6",
  "#0ea5e9", "#ef4444", "#22c55e", "#a855f7", "#f97316",
];

export function SkillForceGraph({ nodes: nodesIn, edges, width = 720, height = 520 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  // Seed simulation state — kept in a ref so we don't recreate on every render.
  const simNodes = useMemo<SimNode[]>(() => {
    return nodesIn.map((n, i) => {
      const angle = (i / Math.max(1, nodesIn.length)) * Math.PI * 2;
      const r = 120 + (i % 7) * 12;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesIn]);

  const byId = useMemo(() => {
    const m = new Map<string, SimNode>();
    for (const n of simNodes) m.set(n.id, n);
    return m;
  }, [simNodes]);

  // Run the physics in a requestAnimationFrame loop.
  useEffect(() => {
    if (simNodes.length === 0) return;
    let raf = 0;
    let iter = 0;
    const TOTAL = 400;
    const step = () => {
      const cx = width / 2;
      const cy = height / 2;
      const alpha = Math.max(0.02, 1 - iter / TOTAL);

      // Repulsion (O(n²) — fine for our scale)
      for (let i = 0; i < simNodes.length; i++) {
        const a = simNodes[i];
        for (let j = i + 1; j < simNodes.length; j++) {
          const b = simNodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 1) {
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            dist2 = 4;
          }
          const force = 1800 / dist2;
          const dist = Math.sqrt(dist2);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Link attraction
      for (const e of edges) {
        const s = byId.get(e.source);
        const t = byId.get(e.target);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        // Target distance shrinks with similarity (stronger ties → closer).
        const target = 110 - e.weight * 50;
        const k = 0.05 * e.weight;
        const fx = ((dist - target) / dist) * dx * k;
        const fy = ((dist - target) / dist) * dy * k;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      }

      // Centering + damping + integrate
      for (const n of simNodes) {
        if (n.fx != null && n.fy != null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += (cx - n.x) * 0.005;
        n.vy += (cy - n.y) * 0.005;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx * alpha;
        n.y += n.vy * alpha;
        // Soft bounds
        n.x = Math.max(20, Math.min(width - 20, n.x));
        n.y = Math.max(20, Math.min(height - 20, n.y));
      }

      iter++;
      setTick((t) => t + 1);
      if (iter < TOTAL) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simNodes, edges, width, height]);

  // --- drag handling ---
  const dragging = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<SVGCircleElement>, n: SimNode) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svgPoint(svg, e.clientX, e.clientY);
    dragging.current = { id: n.id, dx: pt.x - n.x, dy: pt.y - n.y };
    n.fx = n.x;
    n.fy = n.y;
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    const d = dragging.current;
    if (!d) return;
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svgPoint(svg, e.clientX, e.clientY);
    const n = byId.get(d.id);
    if (!n) return;
    n.fx = pt.x - d.dx;
    n.fy = pt.y - d.dy;
    setTick((t) => t + 1);
  };
  const onPointerUp = (_e: React.PointerEvent<SVGCircleElement>) => {
    const d = dragging.current;
    if (!d) return;
    const n = byId.get(d.id);
    if (n) {
      n.fx = null;
      n.fy = null;
    }
    dragging.current = null;
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full h-auto"
      data-tick={tick}
    >
      {/* edges */}
      <g stroke="currentColor" className="text-border" strokeOpacity={0.4}>
        {edges.map((e, i) => {
          const s = byId.get(e.source);
          const t = byId.get(e.target);
          if (!s || !t) return null;
          return (
            <line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              strokeWidth={Math.max(0.6, e.weight * 2)}
            />
          );
        })}
      </g>
      {/* nodes */}
      {simNodes.map((n) => {
        const color = CLUSTER_COLORS[n.cluster % CLUSTER_COLORS.length];
        const r = 8 + Math.min(14, Math.log2(1 + n.demand) * 3);
        const isHover = hover === n.id;
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}>
            <circle
              r={r}
              fill={n.owned ? color : "#1a1a1f"}
              stroke={color}
              strokeWidth={n.owned ? 0 : 2}
              opacity={isHover ? 1 : 0.92}
              onPointerDown={(e) => onPointerDown(e, n)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerEnter={() => setHover(n.id)}
              onPointerLeave={() => setHover(null)}
              style={{ cursor: "grab" }}
            />
            <text
              y={r + 12}
              textAnchor="middle"
              className="pointer-events-none select-none fill-text font-mono"
              style={{ fontSize: 10.5 }}
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const m = svg.getScreenCTM();
  if (!m) return { x: clientX, y: clientY };
  const out = pt.matrixTransform(m.inverse());
  return { x: out.x, y: out.y };
}
