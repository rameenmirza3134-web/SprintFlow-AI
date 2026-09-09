import React, { useState } from 'react';
import { Sprint, BacklogItem, TeamMember, Priority } from '../../types';
import { Calendar, AlertTriangle, CheckCircle2, User, Sparkles, Plus, Edit2, Check, ArrowRight } from 'lucide-react';

interface Props {
  sprint: Sprint;
  tasks: BacklogItem[];
  teamMembers: TeamMember[];
  onUpdateSprint: (updated: Partial<Sprint>) => void;
  onMoveTask: (taskId: string, targetSprintId: string | null) => void;
  onSelectTask?: (taskId: string) => void;
  onAddTaskToSprint?: () => void;
  isPresentationMode?: boolean;
}

const PRIORITY_BADGES: Record<Priority, string> = {
  critical: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  high: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export const SprintBlock: React.FC<Props> = ({
  sprint,
  tasks,
  teamMembers,
  onUpdateSprint,
  onMoveTask,
  onSelectTask,
  onAddTaskToSprint,
  isPresentationMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal);
  const [capacity, setCapacity] = useState(sprint.capacity);
  const [startDate, setStartDate] = useState(sprint.start_date || '');
  const [endDate, setEndDate] = useState(sprint.end_date || '');
  const [isDragOver, setIsDragOver] = useState(false);

  const plannedPoints = tasks.reduce((acc, t) => acc + (Number(t.story_points) || 0), 0);
  const isOverloaded = plannedPoints > sprint.capacity;
  const percentage = sprint.capacity > 0 ? Math.min(100, Math.round((plannedPoints / sprint.capacity) * 100)) : 0;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Unique assignees in this sprint
  const assigneeIds = Array.from(new Set(tasks.map(t => t.assignee_id).filter(Boolean)));
  const sprintMembers = teamMembers.filter(tm => assigneeIds.includes(tm.id));

  const handleSave = () => {
    onUpdateSprint({
      name,
      goal,
      capacity: Number(capacity) || 20,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setIsEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('sprintflow/task-id');
    if (taskId) {
      onMoveTask(taskId, sprint.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-md rounded-xl border transition-all duration-200 shadow-xl overflow-hidden text-slate-100 select-none ${
        isDragOver
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : isOverloaded
          ? 'border-rose-700/60'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
        isOverloaded ? 'bg-rose-950/40 border-rose-900/50' : 'bg-slate-800/80 border-slate-700/60'
      }`}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Sprint {sprint.sprint_number}
          </span>
          <div>
            <span className="text-xs font-bold text-slate-100 truncate block max-w-[200px]">{sprint.name}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>
                {sprint.start_date || 'TBD'} → {sprint.end_date || 'TBD'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {sprint.is_ai_suggested && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              AI Suggested
            </span>
          )}

          {!isPresentationMode && (
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-700/60"
            >
              {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Overloaded Warning Banner (Strict Requirement 15) */}
      {isOverloaded && (
        <div className="px-3 py-1.5 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>⚠ Sprint overloaded</span>
          </div>
          <span className="text-[11px] text-rose-400">
            {plannedPoints} / {sprint.capacity} pts (+{plannedPoints - sprint.capacity})
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col gap-3 overflow-y-auto text-xs">
        {isEditing ? (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Sprint Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Sprint Goal</label>
              <textarea
                value={goal}
                onChange={e => setGoal(e.target.value)}
                rows={2}
                className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100 resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Capacity (pts)</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-1.5 py-1 rounded bg-slate-950 border border-slate-700 text-[11px] text-slate-100"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Goal */}
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Sprint Goal</span>
              <p className="text-slate-200 text-xs line-clamp-2">{sprint.goal || 'No goal specified.'}</p>
            </div>

            {/* Workload Indicator (Visual Bar) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Workload: <strong className={isOverloaded ? 'text-rose-400' : 'text-slate-200'}>{plannedPoints}</strong> / {sprint.capacity} pts</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverloaded
                      ? 'bg-rose-500'
                      : percentage > 85
                      ? 'bg-amber-400'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 space-y-1.5 min-h-[140px]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>Tasks ({tasks.length})</span>
                <span className="text-[10px] text-emerald-400">{completedTasks} done ({completionPercentage}%)</span>
              </div>

              {tasks.length === 0 ? (
                <div className="h-28 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-3 text-slate-500 text-[11px]">
                  <span>Drag tasks here to plan</span>
                  <span className="text-[10px] text-slate-600 mt-0.5">Or use "+ Add Task"</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {tasks.map(task => {
                    const assignee = teamMembers.find(t => t.id === task.assignee_id);
                    return (
                      <div
                        key={task.id}
                        draggable={!isPresentationMode}
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.setData('sprintflow/task-id', task.id);
                        }}
                        onClick={() => onSelectTask?.(task.id)}
                        className={`p-2 rounded-lg bg-slate-950/80 border hover:border-slate-600 transition cursor-grab active:cursor-grabbing ${
                          task.status === 'done' ? 'border-emerald-500/30 opacity-75' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[10px] font-semibold text-slate-400">{task.item_code}</span>
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${PRIORITY_BADGES[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                              {task.story_points} pts
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] font-medium text-slate-200 line-clamp-1 mb-1.5">
                          {task.title}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {assignee ? (
                              <span className="text-slate-300 font-medium">{assignee.name}</span>
                            ) : (
                              <span className="text-amber-400 italic">[ Select team member ]</span>
                            )}
                          </div>

                          {!isPresentationMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveTask(task.id, null); // Move to backlog
                              }}
                              title="Move back to Backlog"
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 text-slate-400">
          <User className="w-3 h-3 text-slate-400" />
          <span>
            {sprintMembers.length > 0 ? (
              `${sprintMembers.length} assignees`
            ) : (
              <span className="text-amber-400/80">[ Select team member ]</span>
            )}
          </span>
        </div>

        {!isPresentationMode && onAddTaskToSprint && (
          <button
            onClick={onAddTaskToSprint}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium hover:underline text-[11px]"
          >
            <Plus className="w-3 h-3" />
            + Task
          </button>
        )}
      </div>
    </div>
  );
};
