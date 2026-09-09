import React from 'react';
import { AIAnalysisIssue } from '../../types';
import { Sparkles, X, Check, EyeOff, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  issues: AIAnalysisIssue[];
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onApplyIssue: (issue: AIAnalysisIssue) => void;
  onIgnoreIssue: (issueId: string) => void;
}

export const AIAnalysisModal: React.FC<Props> = ({
  isOpen,
  onClose,
  issues,
  isAnalyzing,
  onRunAnalysis,
  onApplyIssue,
  onIgnoreIssue,
}) => {
  if (!isOpen) return null;

  const pendingIssues = issues.filter(i => i.status === 'pending');
  const appliedIssues = issues.filter(i => i.status === 'applied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Scrum Master Project Analysis</h3>
              <p className="text-xs text-slate-400">
                Continuous state inspection: sprint workloads, task owners, and dependency validation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-Analyze</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {pendingIssues.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Canvas Health is Excellent</h4>
              <p className="text-xs text-slate-400 max-w-md">
                No sprint overload, dependency deadlocks, or unassigned critical tasks detected.
              </p>
            </div>
          ) : (
            pendingIssues.map(issue => (
              <div
                key={issue.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-750 transition space-y-2.5"
              >
                {/* Issue Headline */}
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-100 block">{issue.issue}</span>
                  </div>
                </div>

                {/* Impact */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300">
                  <strong className="text-slate-400 block mb-0.5">Impact:</strong>
                  {issue.impact}
                </div>

                {/* Recommendation */}
                <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300">
                  <strong className="text-indigo-400 block mb-0.5">Recommendation:</strong>
                  {issue.recommendation}
                </div>

                {/* Action Buttons */}
                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onIgnoreIssue(issue.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 transition"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ignore</span>
                  </button>

                  <button
                    onClick={() => onApplyIssue(issue)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Suggestion</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Resolved Issues */}
          {appliedIssues.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Resolved Issues ({appliedIssues.length})
              </span>
              <div className="space-y-1.5">
                {appliedIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-between text-slate-400 text-xs"
                  >
                    <span className="line-through text-slate-500">{issue.issue}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Applied</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
