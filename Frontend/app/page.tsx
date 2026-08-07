"use client";

import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { StatCards } from "../components/StatCards";
import { AlertQueue } from "../components/AlertQueue";
import { ShapChart } from "../components/ShapChart";
import { ProvenanceGraph } from "../components/ProvenanceGraph";
import { FeedbackButtons } from "../components/FeedbackButtons";
import { sampleFlows } from "../lib/sampleFlows";
import { AlertHistoryItem, PredictResponse, SampleFlow } from "../lib/types";
import {
  Play,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [selectedFlowId, setSelectedFlowId] = useState<string>(sampleFlows[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Client-side React state for alert history
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  // Currently active alert ID
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  const activeAlert = alertHistory.find((item) => item.id === activeAlertId) || null;

  const handleAnalyzeFlow = async () => {
    const targetFlow = sampleFlows.find((f) => f.id === selectedFlowId);
    if (!targetFlow) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Prepare payload (41 flow features + source_ip + destination_ip)
    const { id, label, category, ...flowFeatures } = targetFlow;

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://project-build-production.up.railway.app";

    try {
      const res = await fetch(`${apiUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flowFeatures),
      });

      if (!res.ok) {
        throw new Error(
          `Backend returned status ${res.status}: ${res.statusText || "Prediction failed"}`
        );
      }

      const data: PredictResponse = await res.json();

      const newAlert: AlertHistoryItem = {
        ...data,
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        selectedFlowLabel: targetFlow.label,
        verdict: null,
      };

      setAlertHistory((prev) => [newAlert, ...prev]);
      setActiveAlertId(newAlert.id);
    } catch (err: any) {
      console.error("API Prediction error:", err);
      setErrorMessage(
        err.message || "Failed to reach FastAPI backend on Railway. Please check network connectivity."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVerdict = (
    alertId: string,
    verdict: "true_positive" | "false_positive"
  ) => {
    setAlertHistory((prev) =>
      prev.map((item) => (item.id === alertId ? { ...item, verdict } : item))
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {/* Top Stat Cards */}
          <StatCards alertHistory={alertHistory} />

          {/* Main 2-Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (Narrower: 4 out of 12 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Sample Flow Selector Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    NetFlow Ingestion & Analysis
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Select a offline flow sample representing real network captures to submit to the classifier.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Flow Sample
                    </label>
                    <select
                      value={selectedFlowId}
                      onChange={(e) => setSelectedFlowId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    >
                      {sampleFlows.map((flow) => (
                        <option key={flow.id} value={flow.id}>
                          {flow.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Flow Quick Spec */}
                  {(() => {
                    const currentSample = sampleFlows.find((f) => f.id === selectedFlowId);
                    if (!currentSample) return null;
                    return (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Src IP: <strong className="text-slate-900">{currentSample.source_ip}</strong></span>
                          <span>Dst IP: <strong className="text-slate-900">{currentSample.destination_ip}</strong></span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Ports: {currentSample.L4_SRC_PORT} &rarr; {currentSample.L4_DST_PORT}</span>
                          <span>Pkts: {currentSample.IN_PKTS + currentSample.OUT_PKTS}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    onClick={handleAnalyzeFlow}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Running TreeSHAP & NetworkX...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Analyze Flow</span>
                      </>
                    )}
                  </button>

                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Analysis Failed</p>
                        <p className="text-[11px] mt-0.5">{errorMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Queue List */}
              <AlertQueue
                alertHistory={alertHistory}
                activeAlertId={activeAlertId}
                onSelectAlert={(alert) => setActiveAlertId(alert.id)}
              />
            </div>

            {/* RIGHT COLUMN (Wider: 8 out of 12 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {activeAlert ? (
                <>
                  {/* Active Alert Prediction Summary Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              activeAlert.prediction === "Malicious"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {activeAlert.prediction === "Malicious" ? (
                              <ShieldAlert className="w-4 h-4 text-rose-600" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            )}
                            {activeAlert.prediction}
                          </span>

                          {activeAlert.attack_type && (
                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">
                              Category: {activeAlert.attack_type}
                            </span>
                          )}
                        </div>

                        <h2 className="text-lg font-extrabold text-slate-900 mt-2">
                          {activeAlert.selectedFlowLabel}
                        </h2>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Confidence Score
                        </p>
                        <p className="text-3xl font-black text-indigo-600">
                          {(activeAlert.confidence * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Analyzed at {activeAlert.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Network Vector IPs Header */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono text-xs text-slate-700">
                      <div>
                        <span className="text-slate-400">Source Host: </span>
                        <span className="font-bold text-slate-900">{activeAlert.source_ip || "10.0.0.x"}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400">Destination Host: </span>
                        <span className="font-bold text-slate-900">{activeAlert.destination_ip || "192.168.1.x"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shap Explainability Chart */}
                  <ShapChart
                    shapExplanation={activeAlert.shap_explanation}
                    prediction={activeAlert.prediction}
                  />

                  {/* NetworkX Provenance Graph */}
                  <ProvenanceGraph
                    provenance={activeAlert.provenance}
                    sourceIp={activeAlert.source_ip}
                    destinationIp={activeAlert.destination_ip}
                    prediction={activeAlert.prediction}
                  />

                  {/* Analyst Feedback Section */}
                  <FeedbackButtons
                    activeAlert={activeAlert}
                    onUpdateVerdict={handleUpdateVerdict}
                  />
                </>
              ) : (
                /* Empty Details Placeholder */
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Select or Analyze a Flow</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Choose one of the 6 pre-configured NetFlow samples from the left panel and click &quot;Analyze Flow&quot; to send it to the live FastAPI backend for TreeSHAP & NetworkX attribution.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
