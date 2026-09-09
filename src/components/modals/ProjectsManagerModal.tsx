import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, CheckCircle2, Clock, Calendar, AlertTriangle, X, ArrowRight } from 'lucide-react';

interface ProjectEntry {
  id: string;
  name: string;
  updated_at?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectEntry[];
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenNewProject: () => void;
}

export const ProjectsManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onOpenNewProject,
}) => {
  const [projectToDelete, setProjectToDelete] = useState<ProjectEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Projects Manager
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} saved • Switch workspaces or delete projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewProject();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Banner (In-App, No window.confirm) */}
        {projectToDelete && (
          <div className="px-6 py-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2.5 text-xs text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold">Permanently delete &quot;{projectToDelete.name}&quot;?</span>
                <span className="block text-[11px] text-rose-700 dark:text-rose-300">
                  This will erase all tasks, sprints, epics, and canvas layouts for this project.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No Projects Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                You do not have any projects saved. Generate an agile project plan from a scenario to get started.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewProject();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            projects.map((p) => {
              const isActive = activeProjectId === p.id;
              const isSelectedForDelete = projectToDelete?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition ${
                    isActive
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                      : isSelectedForDelete
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </h4>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            Current Active
                          </span>
                        )}
                      </div>

                      {p.updated_at && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Last updated {new Date(p.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isActive ? (
                      <button
                        onClick={() => {
                          onSelectProject(p.id);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ) : (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium px-2 py-1">
                        Currently Viewing
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(p);
                      }}
                      title="Delete Project"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Project data persists in browser storage and syncs across active tabs.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
