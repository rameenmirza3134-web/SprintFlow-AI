import React, { useState } from 'react';
import { Epic, Priority } from '../../types';
import { Flag, Trash2, Copy, Plus, Edit2, Check, Sparkles } from 'lucide-react';

interface Props {
  epic: Epic;
  storyCount: number;
  onUpdate: (updated: Partial<Epic>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddStory: () => void;
  isPresentationMode?: boolean;
}

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  high: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
  medium: { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/40' },
  low: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
};

export const EpicBlock: React.FC<Props> = ({
  epic,
  storyCount,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddStory,
  isPresentationMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(epic.title);
  const [description, setDescription] = useState(epic.description);
  const [goal, setGoal] = useState(epic.goal);
  const [priority, setPriority] = useState<Priority>(epic.priority);
  const [progress, setProgress] = useState(epic.progress);

  const handleSave = () => {
    onUpdate({
      title,
      description,
      goal,
      priority,
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
    });
    setIsEditing(false);
  };

  const currentPriorityStyle = PRIORITY_STYLES[epic.priority] || PRIORITY_STYLES.medium;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden text-slate-100 select-none transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {epic.epic_code}
          </span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{epic.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {epic.is_ai_suggested && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              AI Suggested
            </span>
          )}

          {!isPresentationMode && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                title={isEditing ? 'Save' : 'Edit Epic'}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700/60"
              >
                {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onDuplicate}
                title="Duplicate Epic"
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700/60"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                title="Delete Epic"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700/60"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3 text-xs">
        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Epic Name</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Goal</label>
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Progress %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-slate-300 line-clamp-2 leading-relaxed">{epic.description}</p>

            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Outcome Goal</span>
              <span className="text-xs text-slate-200 line-clamp-2">{epic.goal || 'No specific goal set'}</span>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span>Progress</span>
                <span className="font-semibold text-slate-200">{epic.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${epic.progress}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${currentPriorityStyle.bg} ${currentPriorityStyle.text} ${currentPriorityStyle.border}`}
          >
            <Flag className="w-2.5 h-2.5 inline mr-1" />
            {epic.priority}
          </span>
          <span className="text-slate-400 font-medium">
            {storyCount} {storyCount === 1 ? 'story' : 'stories'}
          </span>
        </div>

        {!isPresentationMode && (
          <button
            onClick={onAddStory}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
          >
            <Plus className="w-3 h-3" />
            Add Story
          </button>
        )}
      </div>
    </div>
  );
};
