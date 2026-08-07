import React from "react";
import { Shield, LayoutDashboard, History, Settings, Activity } from "lucide-react";

interface SidebarProps {
  activeTab?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-600/30">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">TraceGuard</h1>
          <p className="text-xs text-slate-400 font-medium">NDR Forensics v1.0</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Core Forensics
        </div>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500">
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all border-l-4 border-transparent">
          <History className="w-4 h-4" />
          <span>Alert History</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">Live</span>
        </button>

        <div className="pt-6 px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          System
        </div>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all border-l-4 border-transparent">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Backend Status Widget */}
      <div className="p-4 m-3 bg-slate-800/60 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">FastAPI Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          TreeSHAP & NetworkX connected live via Railway.
        </p>
      </div>
    </aside>
  );
};
