import React from "react";
import { AlertHistoryItem } from "../lib/types";
import { CheckCircle, XCircle, ThumbsUp, ShieldCheck } from "lucide-react";

interface FeedbackButtonsProps {
  activeAlert: AlertHistoryItem;
  onUpdateVerdict: (alertId: string, verdict: "true_positive" | "false_positive") => void;
}

export const FeedbackButtons: React.FC<FeedbackButtonsProps> = ({
  activeAlert,
  onUpdateVerdict,
}) => {
  const currentVerdict = activeAlert.verdict;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-indigo-600" />
            <span>Analyst Feedback & Ground Truth Labeling</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate model output for session active alert #{activeAlert.id.slice(0, 8)}
          </p>
        </div>

        {currentVerdict && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Verdict Saved: {currentVerdict === "true_positive" ? "True Positive" : "False Positive"}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={() => onUpdateVerdict(activeAlert.id, "true_positive")}
          className={`w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs ${
            currentVerdict === "true_positive"
              ? "bg-rose-600 text-white ring-2 ring-rose-600/30"
              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/80"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Mark as True Positive</span>
        </button>

        <button
          onClick={() => onUpdateVerdict(activeAlert.id, "false_positive")}
          className={`w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs ${
            currentVerdict === "false_positive"
              ? "bg-amber-600 text-white ring-2 ring-amber-600/30"
              : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/80"
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Mark as False Positive</span>
        </button>
      </div>

      {currentVerdict && (
        <p className="text-[11px] text-slate-500 mt-3 text-center bg-slate-50 py-1.5 rounded-lg border border-slate-100">
          In-memory session updated. This feedback refines analyst alert queues without database persistence.
        </p>
      )}
    </div>
  );
};
