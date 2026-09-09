import React, { useState } from 'react';
import { X, Plus, Clock, User, Palette, Code2, TestTube, Rocket } from 'lucide-react';
import { BacklogItem, ProjectStage, Priority, Sprint, TeamMember } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultStage?: ProjectStage;
  sprints: Sprint[];
  teamMembers: TeamMember[];
  onAddTask: (task: Omit<BacklogItem, 'id' | 'created_at' | 'updated_at'>) => void;
  projectId: string;
}

export const AddTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultStage = 'development',
  sprints,
  teamMembers,
  onAddTask,
  projectId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<ProjectStage>(defaultStage);
  const [timing, setTiming] = useState('Sprint 1 • 3 days');
  const [assigneeName, setAssigneeName] = useState(teamMembers[0]?.name || 'Unassigned');
  const [priority, setPriority] = useState<Priority>('medium');
  const [storyPoints, setStoryPoints] = useState(3);
  const [sprintId, setSprintId] = useState(sprints[0]?.id || null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedMember = teamMembers.find(m => m.name === assigneeName);

    onAddTask({
      item_code: `${stage.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
      project_id: projectId,
      epic_id: null,
      title: title.trim(),
      description: description.trim(),
      stage,
      timing: timing.trim() || 'Sprint 1 • 3 days',
      assignee_name: assigneeName,
      priority,
      story_points: Number(storyPoints) || 3,
      assignee_id: matchedMember ? matchedMember.id : null,
      sprint_id: sprintId,
      status: 'todo',
      ai_suggested: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              +
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Create Backlog Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stage Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project Stage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['designing', 'development', 'testing', 'deployment'] as ProjectStage[]).map((s) => {
                const isSelected = stage === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      setStage(s);
                      if (s === 'designing') setTiming('Sprint 1 • Days 1-3');
                      else if (s === 'development') setTiming('Sprint 1 • Days 4-8');
                      else if (s === 'testing') setTiming('Sprint 2 • Days 2-5');
                      else setTiming('Sprint 2 • Days 6-8');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize border transition text-center ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title <span className="text-indigo-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design wireframes for checkout step"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Acceptance Criteria
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or requirements..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Timing */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                <span>Timing / Sprint Schedule</span>
              </label>
              <input
                type="text"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                placeholder="e.g. Sprint 1 • 3 days"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Assigned Team Member</span>
              </label>
              <input
                type="text"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="e.g. Devon Miller"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sprint */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assign Sprint
              </label>
              <select
                value={sprintId || ''}
                onChange={(e) => setSprintId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sprint {s.sprint_number} ({s.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Story points */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Story Points
              </label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 pt (Minor)</option>
                <option value={2}>2 pts (Small)</option>
                <option value={3}>3 pts (Medium)</option>
                <option value={5}>5 pts (Large)</option>
                <option value={8}>8 pts (Complex)</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
