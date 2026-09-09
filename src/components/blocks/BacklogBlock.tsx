import React, { useState } from 'react';
import { BacklogItem, Sprint, TeamMember, Priority, TaskStatus } from '../../types';
import { ListFilter, Plus, User, Sparkles, Check, Search, CheckCircle, ChevronDown } from 'lucide-react';

interface Props {
  items: BacklogItem[];
  sprints: Sprint[];
  teamMembers: TeamMember[];
  onUpdateItem: (itemId: string, updated: Partial<BacklogItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddNewTask: () => void;
  onMoveTask: (taskId: string, targetSprintId: string | null) => void;
  onSelectTask?: (taskId: string) => void;
  isPresentationMode?: boolean;
}

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const BacklogBlock: React.FC<Props> = ({
  items,
  sprints,
  teamMembers,
  onUpdateItem,
  onDeleteItem,
  onAddNewTask,
  onMoveTask,
  onSelectTask,
  isPresentationMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Filter items
  const filtered = items.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const totalPoints = items.reduce((acc, curr) => acc + (Number(curr.story_points) || 0), 0);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden text-slate-100 select-none">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100">Product Backlog</span>
            <span className="text-[11px] text-slate-400 ml-2">
              {items.length} items • {totalPoints} total story points
            </span>
          </div>
        </div>

        {!isPresentationMode && (
          <button
            onClick={onAddNewTask}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Task</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search backlog items..."
            className="w-full pl-8 pr-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Backlog Items Table / List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800 text-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
            <span>No backlog items match your search.</span>
            {!isPresentationMode && (
              <button
                onClick={onAddNewTask}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Create your first backlog task
              </button>
            )}
          </div>
        ) : (
          filtered.map(item => {
            const assignee = teamMembers.find(t => t.id === item.assignee_id);
            const suggestedMember = teamMembers.find(t => t.id === item.suggested_assignee_id);
            const assignedSprint = sprints.find(s => s.id === item.sprint_id);
            const isEditing = editingItemId === item.id;

            return (
              <div
                key={item.id}
                draggable={!isPresentationMode}
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', item.id);
                  e.dataTransfer.setData('sprintflow/task-id', item.id);
                }}
                onClick={() => onSelectTask?.(item.id)}
                className="p-3 hover:bg-slate-850/50 transition cursor-grab active:cursor-grabbing group"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Code, Title, Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-400">{item.item_code}</span>
                      <span className="font-semibold text-slate-200 truncate">{item.title}</span>
                      {item.ai_suggested && (
                        <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI Suggested
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-1 mb-2">{item.description}</p>

                    {/* AI Assignment Suggestion Bar (Strict Requirement 18) */}
                    {item.suggested_assignee_id && !item.assignee_id && suggestedMember && !isPresentationMode && (
                      <div className="mb-2 p-1.5 rounded bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-indigo-300">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>AI Suggested: <strong>{suggestedMember.name}</strong></span>
                          {item.ai_suggestion_rationale && (
                            <span className="text-indigo-400/70 text-[10px] hidden sm:inline">— {item.ai_suggestion_rationale}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateItem(item.id, { assignee_id: suggestedMember.id, suggested_assignee_id: null });
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium"
                          >
                            Accept Suggestion
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Meta Controls Row */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      {/* Priority */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Priority:</span>
                        <select
                          value={item.priority}
                          onChange={e => onUpdateItem(item.id, { priority: e.target.value as Priority })}
                          disabled={isPresentationMode}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
                        >
                          {PRIORITY_OPTIONS.map(p => (
                            <option key={p} value={p}>{p.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {/* Story Points */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Points:</span>
                        <select
                          value={item.story_points}
                          onChange={e => onUpdateItem(item.id, { story_points: Number(e.target.value) })}
                          disabled={isPresentationMode}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px] font-mono"
                        >
                          {[1, 2, 3, 5, 8, 13, 21].map(pts => (
                            <option key={pts} value={pts}>{pts} pts</option>
                          ))}
                        </select>
                      </div>

                      {/* Assignee Selection (Rule 3 & 14) */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Assignee:</span>
                        <select
                          value={item.assignee_id || ''}
                          onChange={e => onUpdateItem(item.id, { assignee_id: e.target.value || null })}
                          disabled={isPresentationMode}
                          className={`bg-slate-900 border rounded px-1.5 py-0.5 text-[11px] ${
                            item.assignee_id ? 'border-slate-700 text-slate-200' : 'border-amber-500/40 text-amber-400 font-medium'
                          }`}
                        >
                          <option value="">[ Select team member ]</option>
                          {teamMembers.map(tm => (
                            <option key={tm.id} value={tm.id}>{tm.name} ({tm.role})</option>
                          ))}
                        </select>
                      </div>

                      {/* Sprint Allocation (Drag and Drop / Select) */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Sprint:</span>
                        <select
                          value={item.sprint_id || ''}
                          onChange={e => onMoveTask(item.id, e.target.value || null)}
                          disabled={isPresentationMode}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
                        >
                          <option value="">Product Backlog</option>
                          {sprints.map(s => (
                            <option key={s.id} value={s.id}>Sprint {s.sprint_number}: {s.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Status:</span>
                        <select
                          value={item.status}
                          onChange={e => onUpdateItem(item.id, { status: e.target.value as TaskStatus })}
                          disabled={isPresentationMode}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-[11px]"
                        >
                          {STATUS_OPTIONS.map(st => (
                            <option key={st} value={st}>{st.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Drag tasks directly into Sprint blocks to assign & calculate workload</span>
        <span className="text-slate-500 font-mono">SprintFlow Core Backlog</span>
      </div>
    </div>
  );
};
