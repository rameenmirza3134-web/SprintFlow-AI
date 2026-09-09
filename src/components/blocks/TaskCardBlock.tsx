import React from 'react';
import { BacklogItem, TeamMember, Priority } from '../../types';
import { User, Sparkles, Trash2, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  task: BacklogItem;
  teamMembers: TeamMember[];
  onUpdate: (updated: Partial<BacklogItem>) => void;
  onDelete: () => void;
  isPresentationMode?: boolean;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export const TaskCardBlock: React.FC<Props> = ({
  task,
  teamMembers,
  onUpdate,
  onDelete,
  isPresentationMode = false,
}) => {
  const assignee = teamMembers.find(t => t.id === task.assignee_id);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden text-slate-100 select-none p-3 justify-between">
      <div>
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-indigo-400">{task.item_code}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
              {task.story_points} pts
            </span>
            {!isPresentationMode && (
              <button
                onClick={onDelete}
                className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 mb-1">{task.title}</h4>
        <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-slate-400" />
          {assignee ? (
            <span className="text-slate-200 font-medium">{assignee.name}</span>
          ) : (
            <span className="text-amber-400 italic">[ Select team member ]</span>
          )}
        </div>

        <select
          value={task.status}
          onChange={e => onUpdate({ status: e.target.value as any })}
          disabled={isPresentationMode}
          className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
        >
          <option value="todo">TODO</option>
          <option value="in_progress">IN PROGRESS</option>
          <option value="review">REVIEW</option>
          <option value="done">DONE</option>
        </select>
      </div>
    </div>
  );
};
