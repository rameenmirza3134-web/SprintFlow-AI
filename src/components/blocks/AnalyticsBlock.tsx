import React from 'react';
import { ProjectFullState } from '../../types';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  state: ProjectFullState;
}

export const AnalyticsBlock: React.FC<Props> = ({ state }) => {
  const { sprints, backlogItems, teamMembers, risks } = state;

  const totalPoints = backlogItems.reduce((acc, t) => acc + (t.story_points || 0), 0);
  const donePoints = backlogItems
    .filter(t => t.status === 'done')
    .reduce((acc, t) => acc + (t.story_points || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  const overloadedSprints = sprints.filter(s => {
    const planned = backlogItems.filter(b => b.sprint_id === s.id).reduce((acc, t) => acc + (t.story_points || 0), 0);
    return planned > s.capacity;
  });

  const unassignedTasks = backlogItems.filter(b => !b.assignee_id);
  const criticalRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high');

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden text-slate-100 select-none">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100">Project Health & Velocity</span>
            <span className="text-[11px] text-slate-400 ml-2">Executive Summary</span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Live Metrics
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* Progress Big Metric */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Story Points Delivered</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-slate-100">{donePoints}</span>
              <span className="text-xs text-slate-400 font-mono">/ {totalPoints} pts</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Sprint Health</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-bold font-mono ${overloadedSprints.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {sprints.length - overloadedSprints.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {sprints.length} healthy</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {overloadedSprints.length > 0 ? `⚠ ${overloadedSprints.length} sprint(s) overloaded` : 'All sprint loads balanced'}
            </span>
          </div>
        </div>

        {/* Sprint Distribution Bar Chart */}
        <div>
          <span className="text-[11px] font-medium text-slate-300 block mb-2">Sprint Point Allocations</span>
          <div className="space-y-2">
            {sprints.map(s => {
              const pts = backlogItems.filter(b => b.sprint_id === s.id).reduce((acc, t) => acc + (t.story_points || 0), 0);
              const isOver = pts > s.capacity;
              const barPct = s.capacity > 0 ? Math.min(100, Math.round((pts / s.capacity) * 100)) : 0;

              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-300 font-medium">Sprint {s.sprint_number}</span>
                    <span className={isOver ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                      {pts} / {s.capacity} pts {isOver ? '(Overloaded)' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Badges */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 rounded bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Unassigned</div>
              <div className="font-semibold text-slate-200">{unassignedTasks.length} tasks</div>
            </div>
          </div>

          <div className="p-2 rounded bg-slate-950/50 border border-slate-800/80 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">High Risks</div>
              <div className="font-semibold text-slate-200">{criticalRisks.length} flagged</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-400">
          <TrendingUp className="w-3 h-3 text-sky-400" />
          Real-time Burnup Tracking
        </span>
        <span className="text-slate-500 font-mono">Analytics</span>
      </div>
    </div>
  );
};
