import React from "react";
import { AlertHistoryItem } from "../lib/types";
import { Activity, ShieldAlert, ShieldCheck, Zap } from "lucide-react";

interface StatCardsProps {
  alertHistory: AlertHistoryItem[];
}

export const StatCards: React.FC<StatCardsProps> = ({ alertHistory }) => {
  const totalFlows = alertHistory.length;
  const maliciousCount = alertHistory.filter((item) => item.prediction === "Malicious").length;
  const benignCount = alertHistory.filter((item) => item.prediction === "Benign").length;
  
  const avgConfidence = totalFlows > 0
    ? (alertHistory.reduce((acc, curr) => acc + curr.confidence, 0) / totalFlows) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {/* Total Flows Analyzed */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-slate-600 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Total Flows Analyzed
          </p>
          <p className="text-3xl font-extrabold text-slate-900">{totalFlows}</p>
          <p className="text-xs text-slate-400 mt-1">Session flow records</p>
        </div>
        <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
          <Activity className="w-6 h-6" />
        </div>
      </div>

      {/* Malicious Detected */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-rose-500 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Malicious Detected
          </p>
          <p className="text-3xl font-extrabold text-rose-600">{maliciousCount}</p>
          <p className="text-xs text-rose-500/80 mt-1">High severity alerts</p>
        </div>
        <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
      </div>

      {/* Benign */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Benign
          </p>
          <p className="text-3xl font-extrabold text-emerald-600">{benignCount}</p>
          <p className="text-xs text-emerald-600/80 mt-1">Normal verified traffic</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Avg Confidence */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-indigo-500 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Avg Confidence
          </p>
          <p className="text-3xl font-extrabold text-indigo-600">
            {totalFlows > 0 ? `${avgConfidence.toFixed(1)}%` : "0.0%"}
          </p>
          <p className="text-xs text-indigo-500/80 mt-1">Model certainty score</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <Zap className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
