import React from "react";
import { ProvenanceData } from "../lib/types";
import { Network, Info, Share2 } from "lucide-react";

interface ProvenanceGraphProps {
  provenance: ProvenanceData | null;
  sourceIp: string | null;
  destinationIp: string | null;
  prediction: "Benign" | "Malicious";
}

export const ProvenanceGraph: React.FC<ProvenanceGraphProps> = ({
  provenance,
  sourceIp,
  destinationIp,
  prediction,
}) => {
  // If provenance is null or flow is benign
  if (!provenance || prediction === "Benign") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[260px] text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Provenance Traceback Needed</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          No provenance data — flow classified as benign
        </p>
      </div>
    );
  }

  const srcStr = sourceIp || "10.0.0.x";
  const dstStr = destinationIp || "192.168.1.x";

  // Filter out destination IP from connected nodes if present to render as satellite nodes
  const additionalNodes = (provenance.connected_nodes || []).filter(
    (ip) => ip !== dstStr && ip !== srcStr
  );

  // Position coordinates for additional satellite nodes around source node (120, 120)
  const satellitePositions = [
    { x: 70, y: 50 },
    { x: 70, y: 190 },
    { x: 40, y: 120 },
    { x: 170, y: 45 },
    { x: 170, y: 195 },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-600" />
            <span>NetworkX Provenance Graph & Traceback</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Causal graph topology extracted from enterprise NetFlow logs
          </p>
        </div>

        {/* Server-side Computed Graph Metrics */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-medium">
            Out-Degree: <span className="font-bold text-indigo-600">{provenance.out_degree}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-medium">
            In-Degree: <span className="font-bold text-indigo-600">{provenance.in_degree}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-medium">
            Total Edges: <span className="font-bold text-indigo-600">{provenance.total_edges_in_graph}</span>
          </div>
        </div>
      </div>

      {/* SVG Diagram Canvas */}
      <div className="w-full bg-slate-950 rounded-xl p-4 overflow-hidden relative shadow-inner">
        <svg
          viewBox="0 0 600 240"
          className="w-full h-48 drop-shadow-md select-none"
        >
          <defs>
            {/* Arrowhead marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
            </marker>

            {/* Satellite arrow marker */}
            <marker
              id="satellite-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#818CF8" />
            </marker>
          </defs>

          {/* Grid background effect */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Satellite lines & nodes */}
          {additionalNodes.map((ip, idx) => {
            const pos = satellitePositions[idx % satellitePositions.length];
            return (
              <g key={`sat-${idx}`}>
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={130}
                  y2={120}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  markerEnd="url(#satellite-arrow)"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="14"
                  fill="#1E1B4B"
                  stroke="#818CF8"
                  strokeWidth="1.5"
                />
                <text
                  x={pos.x}
                  y={pos.y + 24}
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {ip}
                </text>
              </g>
            );
          })}

          {/* Main Primary Flow Connection Line */}
          <line
            x1={165}
            y1={120}
            x2={435}
            y2={120}
            stroke="#EF4444"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="animate-pulse"
            markerEnd="url(#arrow)"
          />

          {/* Source Node */}
          <g>
            <circle
              cx="130"
              cy="120"
              r="30"
              fill="#1E293B"
              stroke="#6366F1"
              strokeWidth="3"
            />
            <text
              x="130"
              y="116"
              fill="#EEF2FF"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              SRC
            </text>
            <text
              x="130"
              y="130"
              fill="#A5B4FC"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {srcStr}
            </text>
          </g>

          {/* Destination Node */}
          <g>
            <circle
              cx="470"
              cy="120"
              r="30"
              fill="#450A0A"
              stroke="#F43F5E"
              strokeWidth="3"
            />
            <text
              x="470"
              y="116"
              fill="#FFF1F2"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              DST
            </text>
            <text
              x="470"
              y="130"
              fill="#FECDD3"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {dstStr}
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Source IP Node
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Target / Dest IP Node
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-900 border border-indigo-400" />
              Connected Subgraph Peers ({provenance.connected_nodes.length})
            </span>
          </div>

          <span className="font-mono text-slate-500">
            NetworkX MultiDiGraph ID: #{srcStr.replaceAll(".", "")}
          </span>
        </div>
      </div>
    </div>
  );
};
