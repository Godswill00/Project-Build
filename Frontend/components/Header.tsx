import React from "react";
import { ShieldAlert, Server, UserCircle2 } from "lucide-react";

interface HeaderProps {
  theme?: "light" | "dark";
  isLoggedIn?: boolean;
  language?: "en" | "es" | "pt" | "it" | "ja" | "zh";
}

export const Header: React.FC<HeaderProps> = ({ theme = "light", isLoggedIn = false, language = "en" }) => {
  const surfaceClass = theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80";
  const textClass = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const mutedTextClass = theme === "dark" ? "text-slate-400" : "text-slate-500";

  const translations = {
    en: { title: "TraceGuard — Network Forensics Dashboard", subtitle: "AI-driven intrusion detection and traceback", endpoint: "Endpoint: Railway Production", online: "Analyst Online", active: "System Active", guest: "Guest", signedIn: "Signed in" },
    es: { title: "TraceGuard — Panel de forense de red", subtitle: "Detección de intrusiones y trazado impulsados por IA", endpoint: "Endpoint: Producción en Railway", online: "Analista en línea", active: "Sistema activo", guest: "Invitado", signedIn: "Conectado" },
    pt: { title: "TraceGuard — Painel de forense de rede", subtitle: "Detecção de intrusões e rastreamento com IA", endpoint: "Endpoint: Produção no Railway", online: "Analista online", active: "Sistema ativo", guest: "Convidado", signedIn: "Conectado" },
    it: { title: "TraceGuard — Dashboard di forensic di rete", subtitle: "Rilevamento intrusioni e tracciamento guidati dall'IA", endpoint: "Endpoint: Produzione Railway", online: "Analista online", active: "Sistema attivo", guest: "Ospite", signedIn: "Accesso eseguito" },
    ja: { title: "TraceGuard — ネットワークフォレンジックダッシュボード", subtitle: "AIによる侵入検知とトレースバック", endpoint: "Endpoint: Railway本番環境", online: "分析担当者オンライン", active: "システム稼働中", guest: "ゲスト", signedIn: "ログイン済み" },
    zh: { title: "TraceGuard — 网络取证仪表板", subtitle: "AI 驱动的入侵检测与回溯", endpoint: "Endpoint: Railway 生产环境", online: "分析师在线", active: "系统运行中", guest: "访客", signedIn: "已登录" },
  };

  const t = translations[language];

  return (
    <header className={`h-16 px-8 border-b flex items-center justify-between shadow-xs ${surfaceClass}`}>
      <div>
        <h1 className={`text-xl font-bold tracking-tight ${textClass}`}>
          {t.title}
        </h1>
        <p className={`text-xs font-medium ${mutedTextClass}`}>
          {t.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
          <Server className="w-3.5 h-3.5 text-indigo-600" />
          <span>{t.endpoint}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200/60"}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{isLoggedIn ? t.online : t.active}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white text-slate-700 border-slate-200"}`}>
          <UserCircle2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isLoggedIn ? t.signedIn : t.guest}</span>
        </div>
      </div>
    </header>
  );
};
