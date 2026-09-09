import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';
import { Sprint } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nextSprintNumber: number;
  onAddSprint: (sprint: Omit<Sprint, 'id' | 'created_at' | 'updated_at'>) => void;
  projectId: string;
}

export const AddSprintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  nextSprintNumber,
  onAddSprint,
  projectId,
}) => {
  const [name, setName] = useState(`Sprint ${nextSprintNumber}: Optimization & Scaling`);
  const [goal, setGoal] = useState('');
  const [capacity, setCapacity] = useState(20);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddSprint({
      project_id: projectId,
      name: name.trim(),
      sprint_number: nextSprintNumber,
      goal: goal.trim() || 'Deliver planned sprint goals within capacity.',
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      capacity: Number(capacity) || 20,
      status: 'planned',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add New Sprint</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sprint Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sprint Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What should this sprint achieve?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Capacity (Story Points)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              <span>Create Sprint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
