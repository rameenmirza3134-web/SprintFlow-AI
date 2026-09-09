import React, { useState, useEffect, useCallback } from 'react';
import {
  ProjectFullState,
  Project,
  Epic,
  Sprint,
  BacklogItem,
  TeamMember,
  RiskItem,
  CanvasBlock,
  BlockType,
  AIAnalysisIssue,
  ProjectStage,
} from './types';
import { storageService } from './services/storage';
import { Header } from './components/navigation/Header';
import { AgileSidebar } from './components/sidebar/AgileSidebar';
import { PhaseAgileBoard } from './components/PhaseAgileBoard';
import { ProjectIdeaGenerator } from './components/ProjectIdeaGenerator';
import { AddSprintModal } from './components/modals/AddSprintModal';
import { AddTaskModal } from './components/modals/AddTaskModal';
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas';
import { AIAnalysisModal } from './components/modals/AIAnalysisModal';
import { AIAssistantDrawer } from './components/modals/AIAssistantDrawer';
import { ExportModal } from './components/modals/ExportModal';
import { ShareModal } from './components/modals/ShareModal';
import { SupabaseSetupModal } from './components/modals/SupabaseSetupModal';
import { ProjectsManagerModal } from './components/modals/ProjectsManagerModal';

export default function App() {
  // Saved projects list (strictly user projects, zero demo data)
  const [savedProjects, setSavedProjects] = useState<{ id: string; name: string; updated_at: string }[]>(() => {
    return storageService.getProjectList();
  });

  // Active project state (null if no projects exist)
  const [projectState, setProjectState] = useState<ProjectFullState | null>(() => {
    return storageService.getActiveProject();
  });

  // Project Idea Generator modal / full screen
  const [isIdeaGeneratorOpen, setIsIdeaGeneratorOpen] = useState<boolean>(false);

  // Projects Manager modal
  const [isProjectsManagerOpen, setIsProjectsManagerOpen] = useState<boolean>(false);

  // View mode: 'board' (Phase Agile Board: Designing, Development, Testing, Deployment) or 'canvas' (Freeform)
  const [viewMode, setViewMode] = useState<'board' | 'canvas'>('board');

  // Sidebar collapse
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Quick modals for '+' buttons
  const [isAddSprintOpen, setIsAddSprintOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskDefaultStage, setAddTaskDefaultStage] = useState<ProjectStage | undefined>(undefined);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<ProjectFullState[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectFullState[]>([]);

  // Other Modals & Drawers
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisIssues, setAnalysisIssues] = useState<AIAnalysisIssue[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Sync state helper with undo recording
  const updateStateWithHistory = useCallback(
    (updater: (prev: ProjectFullState) => ProjectFullState, recordUndo = true) => {
      setProjectState((prev) => {
        if (!prev) return null;
        const next = updater(prev);
        if (recordUndo) {
          setUndoStack((u) => [...u.slice(-15), prev]);
          setRedoStack([]);
        }
        storageService.saveProject(next);
        setSavedProjects(storageService.getProjectList());
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !projectState) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, projectState]);
    setProjectState(previous);
    storageService.saveProject(previous);
    setSavedProjects(storageService.getProjectList());
  }, [undoStack, projectState]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !projectState) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, projectState]);
    setProjectState(next);
    storageService.saveProject(next);
    setSavedProjects(storageService.getProjectList());
  }, [redoStack, projectState]);

  // Keyboard shortcut listener (Ctrl+Z, Ctrl+Y, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape' && isPresentationMode) {
        setIsPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, isPresentationMode]);

  // Check Supabase connection on load
  useEffect(() => {
    const url = localStorage.getItem('sprintflow_supabase_url');
    const key = localStorage.getItem('sprintflow_supabase_key');
    setIsSupabaseConnected(Boolean(url && key));
  }, []);

  // Periodic automated project analysis
  const runProjectAnalysis = useCallback(async () => {
    if (!projectState) return;
    setIsAnalyzing(true);
    try {
      const resp = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectState),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.issues) {
          setAnalysisIssues(json.issues);
        }
      }
    } catch (err) {
      console.warn('Analysis check:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectState]);

  // Run initial analysis when sprints or backlog changes
  useEffect(() => {
    if (projectState) {
      runProjectAnalysis();
    }
  }, [projectState?.sprints.length, projectState?.backlogItems.length]);

  // Project switching and deletion
  const handleSelectProject = (projectId: string) => {
    const loaded = storageService.loadProjectFromLocal(projectId);
    if (loaded) {
      setProjectState(loaded);
      setIsIdeaGeneratorOpen(false);
      setUndoStack([]);
      setRedoStack([]);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await storageService.deleteProject(projectId);
      const updatedList = storageService.getProjectList();
      setSavedProjects(updatedList);
      if (projectState?.project.id === projectId) {
        if (updatedList.length > 0) {
          const nextProject = storageService.loadProjectFromLocal(updatedList[0].id);
          setProjectState(nextProject);
        } else {
          setProjectState(null);
          setIsIdeaGeneratorOpen(true);
        }
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleOpenNewProject = () => {
    setIsIdeaGeneratorOpen(true);
  };

  const handleSaveFromIdeaGenerator = (state: ProjectFullState) => {
    storageService.saveProject(state);
    setProjectState(state);
    setSavedProjects(storageService.getProjectList());
    setIsIdeaGeneratorOpen(false);
    setUndoStack([]);
    setRedoStack([]);
  };

  // Quick Add Sprint
  const handleAddSprint = (sprintData: Omit<Sprint, 'id' | 'created_at' | 'updated_at'>) => {
    if (!projectState) return;
    const now = new Date().toISOString();
    const newSprint: Sprint = {
      ...sprintData,
      id: `sprint-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    updateStateWithHistory((prev) => ({
      ...prev,
      sprints: [...prev.sprints, newSprint],
    }));
  };

  // Quick Add Task
  const handleAddTask = (taskData: Omit<BacklogItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!projectState) return;
    const now = new Date().toISOString();
    const newTask: BacklogItem = {
      ...taskData,
      id: `bi-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    updateStateWithHistory((prev) => ({
      ...prev,
      backlogItems: [...prev.backlogItems, newTask],
    }));
  };

  // Handlers for Project Updates
  const handleUpdateProject = (updates: Partial<Project>) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      project: {
        ...prev.project,
        ...updates,
        updated_at: new Date().toISOString(),
      },
    }));
  };

  const handleUpdateEpic = (epicId: string, updates: Partial<Epic>) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      epics: prev.epics.map((e) => (e.id === epicId ? { ...e, ...updates } : e)),
    }));
  };

  const handleDeleteEpic = (epicId: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      epics: prev.epics.filter((e) => e.id !== epicId),
      backlogItems: prev.backlogItems.map((b) => (b.epic_id === epicId ? { ...b, epic_id: null } : b)),
    }));
  };

  const handleDuplicateEpic = (epicId: string) => {
    updateStateWithHistory((prev) => {
      const epic = prev.epics.find((e) => e.id === epicId);
      if (!epic) return prev;
      const dup: Epic = {
        ...epic,
        id: `epic-${Date.now()}`,
        epic_code: `EP-${String(prev.epics.length + 1).padStart(2, '0')}`,
        title: `${epic.title} (Copy)`,
      };
      return { ...prev, epics: [...prev.epics, dup] };
    });
  };

  const handleUpdateSprint = (sprintId: string, updates: Partial<Sprint>) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) => (s.id === sprintId ? { ...s, ...updates } : s)),
    }));
  };

  const handleMoveTask = (taskId: string, targetSprintId: string | null) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      backlogItems: prev.backlogItems.map((b) =>
        b.id === taskId ? { ...b, sprint_id: targetSprintId, updated_at: new Date().toISOString() } : b
      ),
    }));
  };

  const handleUpdateTask = (taskId: string, updates: Partial<BacklogItem>) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      backlogItems: prev.backlogItems.map((b) =>
        b.id === taskId ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
      ),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      backlogItems: prev.backlogItems.filter((b) => b.id !== taskId),
    }));
  };

  const handleAddNewTask = (epicId?: string | null, sprintId?: string | null) => {
    if (!projectState) return;
    setAddTaskDefaultStage('development');
    setIsAddTaskOpen(true);
  };

  const handleAddTeamMember = (member: Omit<TeamMember, 'id' | 'created_at'>) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        { ...member, id: `tm-${Date.now()}`, created_at: new Date().toISOString() },
      ],
    }));
  };

  const handleDeleteTeamMember = (id: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((m) => m.id !== id),
    }));
  };

  const handleAddRisk = (risk: Omit<RiskItem, 'id' | 'created_at'>) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      risks: [
        ...prev.risks,
        { ...risk, id: `risk-${Date.now()}`, created_at: new Date().toISOString() },
      ],
    }));
  };

  const handleDeleteRisk = (id: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      risks: prev.risks.filter((r) => r.id !== id),
    }));
  };

  const handleDeleteDependency = (id: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      dependencies: prev.dependencies.filter((d) => d.id !== id),
    }));
  };

  // AI Analysis Handlers
  const handleApplyIssue = async (issue: AIAnalysisIssue) => {
    if (!projectState) return;
    if (issue.action_type === 'MOVE_TASK' && issue.action_payload?.task_id) {
      handleMoveTask(issue.action_payload.task_id, issue.action_payload.to_sprint_id || null);
    } else if (issue.action_type === 'ASSIGN_TASK' && issue.action_payload?.task_id) {
      const task = projectState.backlogItems.find((b) => b.id === issue.action_payload.task_id);
      if (task) {
        try {
          const resp = await fetch('/api/ai/suggest-assignee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, teamMembers: projectState.teamMembers }),
          });
          const json = await resp.json();
          if (json.suggestedMember) {
            handleUpdateTask(task.id, {
              suggested_assignee_id: json.suggestedMember.id,
              ai_suggestion_rationale: json.rationale,
            });
          }
        } catch (err) {
          console.warn('Assignee suggestion check:', err);
        }
      }
    } else if (issue.action_type === 'SET_DEADLINE') {
      const suggested = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      handleUpdateProject({ deadline: suggested });
    }

    setAnalysisIssues((prev) =>
      prev.map((i) => (i.id === issue.id ? { ...i, status: 'applied' } : i))
    );
  };

  const handleIgnoreIssue = (issueId: string) => {
    setAnalysisIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: 'ignored' } : i))
    );
  };

  // AI Assistant Chat Command Handler
  const handleExecuteCommand = async (command: string): Promise<string> => {
    if (!projectState) return 'No active project to execute command on.';
    const resp = await fetch('/api/ai/chat-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, projectState }),
    });
    const json = await resp.json();

    if (json.mutation) {
      const mut = json.mutation;
      if (mut.action === 'ADD_STORY' && mut.item) {
        handleAddTask(mut.item);
      } else if (mut.action === 'CREATE_SPRINT' && mut.sprint) {
        handleAddSprint(mut.sprint);
      }
    }

    return json.message || 'Action executed successfully.';
  };

  // If no project exists OR user clicked New Project / Edit in Text Boxes:
  if (isIdeaGeneratorOpen || !projectState) {
    return (
      <ProjectIdeaGenerator
        onSaveAndOpenBoard={handleSaveFromIdeaGenerator}
        onCancel={projectState ? () => setIsIdeaGeneratorOpen(false) : undefined}
        hasExistingProject={Boolean(projectState)}
      />
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Header
        project={projectState.project}
        onUpdateProjectName={(name) => handleUpdateProject({ name })}
        onAutoArrange={() => {}}
        onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
        analysisIssuesCount={analysisIssues.filter((i) => i.status === 'pending').length}
        onToggleAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        isAIAssistantOpen={isAIAssistantOpen}
        onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
        isPresentationMode={isPresentationMode}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenNewProjectModal={handleOpenNewProject}
        onOpenProjectsManager={() => setIsProjectsManagerOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Agile Sidebar */}
        <AgileSidebar
          activeProject={projectState}
          savedProjects={savedProjects}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          onOpenNewProject={handleOpenNewProject}
          onOpenProjectsManager={() => setIsProjectsManagerOpen(true)}
          onOpenAddSprint={() => setIsAddSprintOpen(true)}
          onOpenAddTask={(stage) => {
            setAddTaskDefaultStage(stage);
            setIsAddTaskOpen(true);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center: Phase-by-Phase Agile Board (Designing, Development, Testing, Deployment) */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          <PhaseAgileBoard
            projectState={projectState}
            onUpdateProjectState={updateStateWithHistory}
            onOpenAddTaskModal={(stage) => {
              setAddTaskDefaultStage(stage);
              setIsAddTaskOpen(true);
            }}
            onOpenAddSprintModal={() => setIsAddSprintOpen(true)}
            onOpenEditGenerator={() => setIsIdeaGeneratorOpen(true)}
          />
        </main>
      </div>

      {/* Modals and Drawers */}
      <AddSprintModal
        isOpen={isAddSprintOpen}
        onClose={() => setIsAddSprintOpen(false)}
        nextSprintNumber={projectState.sprints.length + 1}
        onAddSprint={handleAddSprint}
        projectId={projectState.project.id}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        defaultStage={addTaskDefaultStage}
        sprints={projectState.sprints}
        teamMembers={projectState.teamMembers}
        onAddTask={handleAddTask}
        projectId={projectState.project.id}
      />

      <AIAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        issues={analysisIssues}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={runProjectAnalysis}
        onApplyIssue={handleApplyIssue}
        onIgnoreIssue={handleIgnoreIssue}
      />

      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        projectState={projectState}
        onApplyAIChanges={(updated) => {
          updateStateWithHistory(() => updated);
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        state={projectState}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={projectState.project}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isConnected={isSupabaseConnected}
        onCredentialsUpdated={() => {
          const url = localStorage.getItem('sprintflow_supabase_url');
          const key = localStorage.getItem('sprintflow_supabase_key');
          setIsSupabaseConnected(Boolean(url && key));
        }}
      />

      <ProjectsManagerModal
        isOpen={isProjectsManagerOpen}
        onClose={() => setIsProjectsManagerOpen(false)}
        projects={savedProjects}
        activeProjectId={projectState.project.id}
        onSelectProject={(id) => {
          handleSelectProject(id);
          setIsProjectsManagerOpen(false);
        }}
        onDeleteProject={handleDeleteProject}
        onOpenNewProject={() => {
          setIsProjectsManagerOpen(false);
          handleOpenNewProject();
        }}
      />
    </div>
  );
}
