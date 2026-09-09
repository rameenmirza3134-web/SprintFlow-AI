import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  LayoutGrid,
  Share2,
  Download,
  RotateCcw,
  RotateCw,
  Monitor,
  Bot,
  Plus,
  ChevronDown,
  FolderOpen,
  Sun,
  Moon
} from 'lucide-react';
import { Project } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  project: Project;
  onUpdateProjectName: (name: string) => void;
  onAutoArrange: () => void;
  onOpenAnalysis: () => void;
  analysisIssuesCount: number;
  onToggleAIAssistant: () => void;
  isAIAssistantOpen: boolean;
  onTogglePresentationMode: () => void;
  isPresentationMode: boolean;
  onOpenExportModal: () => void;
  onOpenShareModal: () => void;
  onOpenNewProjectModal: () => void;
  onOpenProjectsManager?: () => void;
  onOpenSupabaseModal: () => void;
  isSupabaseConnected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Header: React.FC<Props> = ({
  project,
  onUpdateProjectName,
  onAutoArrange,
  onOpenAnalysis,
  analysisIssuesCount,
  onToggleAIAssistant,
  isAIAssistantOpen,
  onTogglePresentationMode,
  isPresentationMode,
  onOpenExportModal,
  onOpenShareModal,
  onOpenNewProjectModal,
  onOpenProjectsManager,
  onOpenSupabaseModal,
  isSupabaseConnected,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const { theme, isDark, toggleTheme } = useTheme();

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onUpdateProjectName(projectName.trim());
    }
    setIsEditingTitle(false);
  };

  if (isPresentationMode) {
    return (
      <header className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={onTogglePresentationMode}
          className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-1.5 transition"
        >
          <Monitor className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exit Presentation Mode</span>
        </button>
      </header>
    );
  }

  return (
    <header className="h-14 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between text-slate-800 dark:text-slate-100 z-30 select-none transition-colors duration-200">
      {/* Left: Brand and Project Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              SprintFlow <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">AI</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold">
              Agile Visual Canvas
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Editable Project Title */}
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex items-center">
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={handleTitleSubmit}
              autoFocus
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-indigo-500 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </form>
        ) : (
          <div
            onClick={() => {
              setProjectName(project.name);
              setIsEditingTitle(true);
            }}
            title="Click to rename project"
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition text-sm font-medium text-slate-700 dark:text-slate-200 group"
          >
            <span className="truncate max-w-[220px] font-semibold">{project.name}</span>
            <span className="text-[10px] text-slate-400 group-hover:text-indigo-500">✎</span>
          </div>
        )}

        <button
          onClick={onOpenProjectsManager || onOpenNewProjectModal}
          title="View & Manage All Projects"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-medium transition shadow-xs"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden md:inline">Projects</span>
        </button>
      </div>

      {/* Center: Canvas Productivity Controls (Auto Arrange, Analyze, AI, Undo/Redo) */}
      <div className="flex items-center gap-1.5">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Arrange */}
        <button
          onClick={onAutoArrange}
          title="Auto Arrange Canvas Blocks into structured layout"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-medium transition shadow-xs"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">Auto Arrange</span>
        </button>

        {/* Analyze Project */}
        <button
          onClick={onOpenAnalysis}
          title="AI Scrum Master Project Analysis"
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-medium transition shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Analyze</span>
          {analysisIssuesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40">
              {analysisIssuesCount}
            </span>
          )}
        </button>

        {/* AI Assistant Drawer Toggle */}
        <button
          onClick={onToggleAIAssistant}
          title="Chat with AI Project Manager"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs border ${
            isAIAssistantOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-indigo-600 dark:text-indigo-300 border-indigo-300/50 dark:border-indigo-500/30'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Assistant</span>
        </button>
      </div>

      {/* Right: Theme Toggle, Supabase DB, Presentation, Share, Export */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 transition shadow-xs"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px] font-medium text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline text-[11px] font-medium text-slate-700">Dark</span>
            </>
          )}
        </button>

        {/* Presentation Mode */}
        <button
          onClick={onTogglePresentationMode}
          title="Presentation Mode"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>

        {/* Share Project */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Export (PDF, PNG, JPG) */}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
