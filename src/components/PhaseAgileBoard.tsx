import React, { useState } from 'react';
import {
  Palette,
  Code2,
  TestTube,
  Rocket,
  Clock,
  User,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Circle,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  ChevronRight,
  Check
} from 'lucide-react';
import { ProjectFullState, BacklogItem, ProjectStage, TaskStatus, Priority } from '../types';

interface Props {
  projectState: ProjectFullState;
  onUpdateProjectState: (updater: (prev: ProjectFullState) => ProjectFullState) => void;
  onOpenAddTaskModal: (defaultStage?: ProjectStage) => void;
  onOpenAddSprintModal: () => void;
  onOpenEditGenerator: () => void;
}

export const PhaseAgileBoard: React.FC<Props> = ({
  projectState,
  onUpdateProjectState,
  onOpenAddTaskModal,
  onOpenAddSprintModal,
  onOpenEditGenerator,
}) => {
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { project, backlogItems, sprints, teamMembers } = projectState;

  // Filter tasks
  const filteredTasks = backlogItems.filter(item => {
    if (selectedSprintFilter !== 'all' && item.sprint_id !== selectedSprintFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchAssignee = (item.assignee_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  const getStageTasks = (stage: ProjectStage) => {
    return filteredTasks.filter(item => {
      if (item.stage) return item.stage === stage;
      const lower = (item.title + ' ' + item.description).toLowerCase();
      if (stage === 'designing') return lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('wireframe');
      if (stage === 'testing') return lower.includes('test') || lower.includes('qa') || lower.includes('audit');
      if (stage === 'deployment') return lower.includes('deploy') || lower.includes('ci/cd') || lower.includes('docker') || lower.includes('cloud') || lower.includes('pipeline');
      return stage === 'development';
    });
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    onUpdateProjectState(prev => ({
      ...prev,
      backlogItems: prev.backlogItems.map(item =>
        item.id === taskId ? { ...item, status: newStatus, updated_at: new Date().toISOString() } : item
      ),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateProjectState(prev => ({
      ...prev,
      backlogItems: prev.backlogItems.filter(item => item.id !== taskId),
    }));
  };

  const handleQuickSaveTask = (taskId: string, title: string, timing: string, assigneeName: string) => {
    onUpdateProjectState(prev => ({
      ...prev,
      backlogItems: prev.backlogItems.map(item =>
        item.id === taskId
          ? {
              ...item,
              title,
              timing,
              assignee_name: assigneeName,
              updated_at: new Date().toISOString(),
            }
          : item
      ),
    }));
    setEditingTaskId(null);
  };

  // Helper for stages
  const stagesConfig: {
    stage: ProjectStage;
    title: string;
    description: string;
    icon: any;
    cardBorder: string;
    headerBg: string;
    iconBadge: string;
  }[] = [
    {
      stage: 'designing',
      title: 'Designing',
      description: 'UI/UX wireframes, component mockups & user flow',
      icon: Palette,
      cardBorder: 'border-purple-200 dark:border-slate-800',
      headerBg: 'bg-purple-50/90 dark:bg-purple-950/50 border-b border-purple-100 dark:border-slate-800',
      iconBadge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    },
    {
      stage: 'development',
      title: 'Development',
      description: 'Frontend components, backend APIs & database models',
      icon: Code2,
      cardBorder: 'border-blue-200 dark:border-slate-800',
      headerBg: 'bg-blue-50/90 dark:bg-blue-950/50 border-b border-blue-100 dark:border-slate-800',
      iconBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    },
    {
      stage: 'testing',
      title: 'Testing & QA',
      description: 'Automated test suite, bug bash & validation',
      icon: TestTube,
      cardBorder: 'border-emerald-200 dark:border-slate-800',
      headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/50 border-b border-emerald-100 dark:border-slate-800',
      iconBadge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    },
    {
      stage: 'deployment',
      title: 'Deployment',
      description: 'CI/CD pipelines, cloud environment & launch',
      icon: Rocket,
      cardBorder: 'border-amber-200 dark:border-slate-800',
      headerBg: 'bg-amber-50/90 dark:bg-amber-950/50 border-b border-amber-100 dark:border-slate-800',
      iconBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    },
  ];

  // Overall stats
  const totalTasks = backlogItems.length;
  const doneTasks = backlogItems.filter(t => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Top Controls Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              {sprints.length} Sprints
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              {doneTasks}/{totalTasks} Completed ({progressPercent}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {project.description || 'SprintFlow agile project plan'}
          </p>
        </div>

        {/* Right action controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full lg:w-auto">
          {/* Sprint Filter */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setSelectedSprintFilter('all')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                selectedSprintFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Sprints
            </button>
            {sprints.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSprintFilter(s.id)}
                className={`px-3 py-1 rounded-md transition font-medium ${
                  selectedSprintFilter === s.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sprint {s.sprint_number}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks or member..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => onOpenAddTaskModal()}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            onClick={onOpenEditGenerator}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition"
            title="Edit in full-page text boxes"
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit in Text Boxes</span>
          </button>
        </div>
      </div>

      {/* 4 Distinct Stage Columns Board */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 min-w-[1050px] h-full items-start">
          {stagesConfig.map(({ stage, title, description, icon: Icon, cardBorder, headerBg, iconBadge }) => {
            const stageTasks = getStageTasks(stage);

            return (
              <div
                key={stage}
                className={`flex flex-col rounded-2xl bg-white dark:bg-slate-900/90 border ${cardBorder} shadow-sm dark:shadow-xl overflow-hidden max-h-full transition-colors duration-200`}
              >
                {/* Column Header */}
                <div className={`p-4 ${headerBg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${iconBadge}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
                      {stageTasks.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>

                  <button
                    onClick={() => onOpenAddTaskModal(stage)}
                    className="mt-3 w-full py-1.5 rounded-lg bg-white/80 hover:bg-white dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {title} Task</span>
                  </button>
                </div>

                {/* Task Cards Container */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto min-h-[300px] max-h-[calc(100vh-250px)]">
                  {stageTasks.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                      <Icon className="w-6 h-6 mb-1 opacity-40" />
                      <p className="text-xs font-medium">No tasks in {title}</p>
                      <button
                        onClick={() => onOpenAddTaskModal(stage)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 font-medium"
                      >
                        + Create a task
                      </button>
                    </div>
                  ) : (
                    stageTasks.map((task) => {
                      const isDone = task.status === 'done';
                      const isInProgress = task.status === 'in_progress';
                      const isReview = task.status === 'review';
                      const isEditing = editingTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          className={`group rounded-xl p-4 transition-all duration-200 shadow-xs dark:shadow-md ${
                            isDone
                              ? 'bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 opacity-80'
                              : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700'
                          }`}
                        >
                          {isEditing ? (
                            /* Inline Edit Mode */
                            <InlineTaskEditor
                              task={task}
                              teamMembers={teamMembers}
                              onSave={(t, time, ass) => handleQuickSaveTask(task.id, t, time, ass)}
                              onCancel={() => setEditingTaskId(null)}
                            />
                          ) : (
                            /* Normal Card View */
                            <>
                              {/* Card Header: Code & Status */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">
                                  {task.item_code || 'SF-TASK'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {/* Story points */}
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                    {task.story_points} pts
                                  </span>

                                  {/* Status Selector */}
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none transition ${
                                      isDone
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                        : isInProgress
                                        ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-400'
                                        : isReview
                                        ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-400'
                                        : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400'
                                    }`}
                                  >
                                    <option value="todo" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Todo</option>
                                    <option value="in_progress" className="bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300">In Progress</option>
                                    <option value="review" className="bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300">Review</option>
                                    <option value="done" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300">Done ✓</option>
                                  </select>
                                </div>
                              </div>

                              {/* Title */}
                              <h3
                                className={`text-xs font-semibold leading-snug mb-1.5 ${
                                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {task.title}
                              </h3>

                              {/* Description if present */}
                              {task.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {/* Timing badge - prominent */}
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-slate-900/90 border border-indigo-100 dark:border-slate-800 text-[11px] text-indigo-700 dark:text-indigo-300 mb-2.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="font-semibold tracking-wide">
                                  {task.timing || 'Sprint 1 • 3 days'}
                                </span>
                              </div>

                              {/* Footer: Assignee & Action Buttons */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900">
                                {/* Assignee */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {(task.assignee_name || 'U').charAt(0)}
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                                    {task.assignee_name || 'Unassigned'}
                                  </span>
                                </div>

                                {/* Hover action buttons */}
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => setEditingTaskId(task.id)}
                                    title="Edit task"
                                    className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    title="Delete task"
                                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Inline Task Editor Helper
const InlineTaskEditor: React.FC<{
  task: BacklogItem;
  teamMembers: any[];
  onSave: (title: string, timing: string, assigneeName: string) => void;
  onCancel: () => void;
}> = ({ task, teamMembers, onSave, onCancel }) => {
  const [title, setTitle] = useState(task.title);
  const [timing, setTiming] = useState(task.timing || 'Sprint 1 • 3 days');
  const [assigneeName, setAssigneeName] = useState(task.assignee_name || (teamMembers[0]?.name || ''));

  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Timing</label>
        <input
          type="text"
          value={timing}
          onChange={(e) => setTiming(e.target.value)}
          placeholder="e.g. Sprint 1 • Days 1-4"
          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Assignee</label>
        <input
          type="text"
          value={assigneeName}
          onChange={(e) => setAssigneeName(e.target.value)}
          placeholder="Team member name"
          className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-1">
        <button
          onClick={onCancel}
          className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] hover:bg-slate-300 dark:hover:bg-slate-700 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(title, timing, assigneeName)}
          className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-500 shadow-xs"
        >
          Save
        </button>
      </div>
    </div>
  );
};
