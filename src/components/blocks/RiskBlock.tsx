import React, { useState } from 'react';
import { RiskItem } from '../../types';
import { ShieldAlert, Plus, Trash2, AlertCircle, Check } from 'lucide-react';

interface Props {
  risks: RiskItem[];
  onAddRisk: (risk: Omit<RiskItem, 'id' | 'created_at'>) => void;
  onDeleteRisk: (id: string) => void;
  isPresentationMode?: boolean;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  high: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  low: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
};

export const RiskBlock: React.FC<Props> = ({
  risks,
  onAddRisk,
  onDeleteRisk,
  isPresentationMode = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [impact, setImpact] = useState('');
  const [mitigation, setMitigation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddRisk({
      project_id: '',
      title: title.trim(),
      severity,
      impact: impact.trim() || 'Unspecified delivery impact.',
      mitigation: mitigation.trim() || 'Team monitoring and mitigation required.',
    });

    setTitle('');
    setImpact('');
    setMitigation('');
    setIsAdding(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden text-slate-100 select-none">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100">Project Risk Analysis</span>
            <span className="text-[11px] text-slate-400 ml-2">{risks.length} flagged</span>
          </div>
        </div>

        {!isPresentationMode && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Add Risk'}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-2.5 text-xs">
        {isAdding && (
          <form onSubmit={handleSubmit} className="p-3 rounded-lg bg-slate-950 border border-slate-700 space-y-2 mb-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Risk Summary *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Third-party authentication API rate limits"
                required
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Impact</label>
              <input
                type="text"
                value={impact}
                onChange={e => setImpact(e.target.value)}
                placeholder="May delay Sprint 2 release"
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Mitigation Strategy</label>
              <input
                type="text"
                value={mitigation}
                onChange={e => setMitigation(e.target.value)}
                placeholder="Implement Redis token caching"
                className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Save Risk Item
            </button>
          </form>
        )}

        {risks.length === 0 ? (
          <div className="p-6 text-center text-slate-500 flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-700 mb-2" />
            <span>No risks detected or recorded.</span>
            <span className="text-[10px] text-slate-600 mt-1">Run AI Project Analysis to detect potential blockers.</span>
          </div>
        ) : (
          risks.map(risk => {
            const sev = SEVERITY_COLORS[risk.severity] || SEVERITY_COLORS.medium;
            return (
              <div
                key={risk.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}>
                      {risk.severity}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs">{risk.title}</span>
                  </div>

                  {!isPresentationMode && (
                    <button
                      onClick={() => onDeleteRisk(risk.id)}
                      title="Delete risk"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Impact: </strong>
                  {risk.impact}
                </div>

                <div className="text-[11px] text-emerald-400/90 bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                  <strong className="text-emerald-300">Mitigation: </strong>
                  {risk.mitigation}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Continuous AI Risk Monitoring</span>
        <span className="text-slate-500 font-mono">Risk Engine</span>
      </div>
    </div>
  );
};
