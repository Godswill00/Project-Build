import React from "react";
import { AlertHistoryItem } from "../lib/types";
import { AlertTriangle, CheckCircle2, Clock, MousePointerClick } from "lucide-react";

interface AlertQueueProps {
  alertHistory: AlertHistoryItem[];
  activeAlertId: string | null;
  onSelectAlert: (alert: AlertHistoryItem) => void;
}

export const AlertQueue: React.FC<AlertQueueProps> = ({
  alertHistory,
  activeAlertId,
  onSelectAlert,
}) => {
  // Sort by confidence descending
  const sortedAlerts = [...alertHistory].sort(
    (a, b) => b.confidence - a.confidence
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Alert Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {sortedAlerts.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sorted by confidence descending
          </p>
        </div>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto max-h-[520px] flex-1">
        {sortedAlerts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-between justify-center text-slate-400 mb-3">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">No Flows Analyzed Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
              Select a sample network flow above and click &quot;Analyze Flow&quot; to populate the queue.
            </p>
          </div>
        ) : (
          sortedAlerts.map((alert) => {
            const isSelected = alert.id === activeAlertId;
            const isMalicious = alert.prediction === "Malicious";

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 relative ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/20"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {/* Prediction Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isMalicious
                          ? isSelected
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                          : isSelected
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isMalicious ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {alert.prediction}
                    </span>

                    {/* Attack Type Badge */}
                    {alert.attack_type && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          isSelected
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {alert.attack_type}
                      </span>
                    )}
                  </div>

                  {/* Confidence Percentage */}
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? "text-indigo-300" : "text-indigo-600"
                    }`}
                  >
                    {(alert.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Flow source and label details */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className={isSelected ? "text-slate-300" : "text-slate-600"}>
                      {alert.source_ip || "Unknown Src"} &rarr; {alert.destination_ip || "Unknown Dst"}
                    </span>
                  </div>

                  {alert.selectedFlowLabel && (
                    <p
                      className={`text-[11px] truncate ${
                        isSelected ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {alert.selectedFlowLabel}
                    </p>
                  )}
                </div>

                {/* Footer: timestamp and verdict badge */}
                <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                  isSelected ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-400"
                }`}>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {alert.timestamp}
                  </span>

                  {alert.verdict && (
                    <span
                      className={`font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        alert.verdict === "true_positive"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {alert.verdict === "true_positive" ? "TP Verified" : "FP Verified"}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
