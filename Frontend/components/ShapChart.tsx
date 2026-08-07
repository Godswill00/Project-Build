"use client";

import React from "react";
import { ShapEntry } from "../lib/types";
import { generateForensicSummary } from "../lib/generateForensicSummary";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { BarChart3, Info, FileText } from "lucide-react";

interface ShapChartProps {
  shapExplanation: ShapEntry[] | null;
  prediction: "Benign" | "Malicious";
  attackType?: string | null;
}

export const ShapChart: React.FC<ShapChartProps> = ({
  shapExplanation,
  prediction,
  attackType,
}) => {
  // Fallback if null or empty or benign
  if (!shapExplanation || shapExplanation.length === 0 || prediction === "Benign") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[260px] text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Normal Traffic Profile</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          No explanation needed — flow classified as benign
        </p>
      </div>
    );
  }

  // Generate natural language forensic summary sentence
  const forensicSummarySentence = generateForensicSummary(shapExplanation, attackType);

  // Sort by absolute SHAP value descending so most influential feature appears first (at top of vertical layout)
  const sortedData = [...shapExplanation]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>TreeSHAP Feature Attributions</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Top features driving the decision (Red = Malicious push, Green = Benign push)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            +Malicious
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            -Benign
          </span>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={sortedData}
            margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis
              type="number"
              tickFormatter={(val) => val.toFixed(3)}
              stroke="#64748B"
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="feature"
              width={130}
              stroke="#475569"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: any) => [
                typeof value === "number" ? value.toFixed(5) : String(value ?? "N/A"),
                "SHAP Impact Value",
              ]}
              labelStyle={{ fontWeight: "bold", color: "#0F172A" }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#CBD5E1",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                fontSize: "12px",
              }}
            />
            <ReferenceLine x={0} stroke="#94A3B8" strokeWidth={1.5} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? "#EF4444" : "#10B981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forensic Summary Callout Box */}
      {forensicSummarySentence && (
        <div className="mt-5 rounded-lg bg-slate-50 border-l-4 border-rose-500 p-4 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Forensic Summary</span>
          </div>
          <p className="text-xs text-slate-800 font-medium leading-relaxed">
            {forensicSummarySentence}
          </p>
        </div>
      )}
    </div>
  );
};
