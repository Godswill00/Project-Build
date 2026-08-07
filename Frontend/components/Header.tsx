import React from "react";
import { ShieldAlert, Server } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="h-16 px-8 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          TraceGuard — Network Forensics Dashboard
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          AI-driven intrusion detection and traceback
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Server className="w-3.5 h-3.5 text-indigo-600" />
          <span>Endpoint: Railway Production</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>System Active</span>
        </div>
      </div>
    </header>
  );
};
