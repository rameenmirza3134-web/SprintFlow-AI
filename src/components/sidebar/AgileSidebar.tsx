import React, { useState } from 'react';
import {
  Plus,
  Layers,
  FolderGit2,
  Calendar,
  ListTodo,
  Palette,
  Code2,
  TestTube,
  Rocket,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { ProjectFullState, ProjectStage } from '../../types';

interface ProjectListItem {
  id: string;
  name: string;
  updated_at: string;
}

interface Props {
  activeProject: ProjectFullState | null;
  savedProjects: ProjectListItem[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenNewProject: () => void;
  onOpenProjectsManager?: () => void;
  onOpenAddSprint: () => void;
  onOpenAddTask: (stage?: ProjectStage) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AgileSidebar: React.FC<Props> = ({
  activeProject,
  savedProjects,
  onSelectProject,
  onDeleteProject,
  onOpenNewProject,
  onOpenProjectsManager,
  onOpenAddSprint,
  onOpenAddTask,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null);
  if (isCollapsed) {
    return (
      <aside className="w-14 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col items-center py-4 justify-between shrink-0 select-none z-20 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNewProject}
            title="Create New Project (+)"
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddSprint}
            title="Add Sprint"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAddTask()}
            title="Add Backlog Task"
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <ListTodo className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Backlog stage item counts
  const stageCounts: Record<ProjectStage, number> = {
    designing: 0,
    development: 0,
    testing: 0,
    deployment: 0,
  };

  if (activeProject) {
    activeProject.backlogItems.forEach((item) => {
      if (item.stage && stageCounts[item.stage] !== undefined) {
        stageCounts[item.stage]++;
      } else {
        stageCounts['development']++;
      }
    });
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-20 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* App Title & Collapse */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white block">
                SprintFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Agile Planner</span>
            </div>
          </div>

          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 1. PROJECTS SECTION WITH [+] BUTTON */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <FolderGit2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Projects ({savedProjects.length})</span>
            </span>

            <div className="flex items-center gap-1">
              {onOpenProjectsManager && (
                <button
                  onClick={onOpenProjectsManager}
                  title="Manage Projects"
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition px-1.5"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>All</span>
                </button>
              )}
              <button
                onClick={onOpenNewProject}
                title="Create New Project from Idea (+)"
                className="p-1 rounded bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:text-indigo-300 dark:hover:text-white border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition px-1.5"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {savedProjects.length === 0 && !activeProject ? (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center">
                No projects yet. Click &quot;+ New&quot; to paste your idea.
              </div>
            ) : (
              savedProjects.map((p) => {
                const isActive = activeProject?.project.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition text-xs ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-white font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />
                      <span className="truncate">{p.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(p);
                      }}
                      title="Delete project"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* In-App Delete Confirmation Dialog (Iframe-safe, no window.confirm) */}
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delete Project?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                Permanently delete <strong className="text-slate-900 dark:text-white">&quot;{projectToDelete.name}&quot;</strong> and all associated sprints, tasks, and canvas blocks?
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const idToDelete = projectToDelete.id;
                    setProjectToDelete(null);
                    onDeleteProject(idToDelete);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. SPRINTS SECTION WITH [+] BUTTON */}
        {activeProject && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Sprints</span>
              </span>

              <button
                onClick={onOpenAddSprint}
                title="Add New Sprint (+)"
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-[11px] font-medium flex items-center gap-1 transition px-1.5"
              >
                <Plus className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Sprint</span>
              </button>
            </div>

            <div className="space-y-1">
              {activeProject.sprints.map((sprint) => {
                const sprintTasks = activeProject.backlogItems.filter(
                  (t) => t.sprint_id === sprint.id
                );
                const sprintPoints = sprintTasks.reduce(
                  (sum, t) => sum + (t.story_points || 0),
                  0
                );

                return (
                  <div
                    key={sprint.id}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                      <span className="truncate">Sprint {sprint.sprint_number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950 text-sky-700 dark:text-sky-300 font-mono">
                        {sprintPoints}/{sprint.capacity} pts
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {sprint.goal}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. BACKLOG STAGES SECTION WITH [+] BUTTON */}
        {activeProject && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <ListTodo className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Backlog Stages</span>
              </span>

              <button
                onClick={() => onOpenAddTask()}
                title="Add Task to Backlog (+)"
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-[11px] font-medium flex items-center gap-1 transition px-1.5"
              >
                <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Task</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {/* Designing */}
              <div
                onClick={() => onOpenAddTask('designing')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Designing</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950">
                  {stageCounts.designing}
                </span>
              </div>

              {/* Development */}
              <div
                onClick={() => onOpenAddTask('development')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Development</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950">
                  {stageCounts.development}
                </span>
              </div>

              {/* Testing */}
              <div
                onClick={() => onOpenAddTask('testing')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                  <TestTube className="w-3.5 h-3.5" />
                  <span>Testing & QA</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950">
                  {stageCounts.testing}
                </span>
              </div>

              {/* Deployment */}
              <div
                onClick={() => onOpenAddTask('deployment')}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/60 cursor-pointer transition text-xs"
              >
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Deployment</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-950">
                  {stageCounts.deployment}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
