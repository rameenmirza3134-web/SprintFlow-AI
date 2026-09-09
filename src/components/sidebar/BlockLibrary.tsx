import React, { useState } from 'react';
import {
  Layers,
  Flag,
  Calendar,
  ListFilter,
  Users,
  ShieldAlert,
  BarChart3,
  CheckSquare,
  Milestone,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BlockType } from '../../types';

interface Props {
  onAddBlock: (blockType: BlockType) => void;
  isPresentationMode?: boolean;
}

interface BlockItemDef {
  type: BlockType;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'Project' | 'Agile' | 'Team' | 'Analytics';
  color: string;
}

const BLOCK_DEFINITIONS: BlockItemDef[] = [
  // Project
  {
    type: 'project_overview',
    title: 'Project Overview',
    description: 'Scope, timeline, tech stack & goals',
    icon: Layers,
    category: 'Project',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  },
  {
    type: 'milestone',
    title: 'Milestone Tracker',
    description: 'Key release milestones & deadlines',
    icon: Milestone,
    category: 'Project',
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  },
  // Agile
  {
    type: 'epic',
    title: 'Epic Block',
    description: 'Strategic feature initiatives',
    icon: Flag,
    category: 'Agile',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    type: 'sprint',
    title: 'Sprint Container',
    description: 'Timeboxed sprint with workload',
    icon: Calendar,
    category: 'Agile',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    type: 'product_backlog',
    title: 'Product Backlog',
    description: 'Categorized user stories & tasks',
    icon: ListFilter,
    category: 'Agile',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    type: 'task_card',
    title: 'Task Card',
    description: 'Individual standalone task',
    icon: CheckSquare,
    category: 'Agile',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  // Team
  {
    type: 'team_roster',
    title: 'Team Management',
    description: 'Member roles, skills & workload',
    icon: Users,
    category: 'Team',
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  },
  // Analytics
  {
    type: 'analytics',
    title: 'Velocity & Burnup',
    description: 'Sprint health, points & capacity',
    icon: BarChart3,
    category: 'Analytics',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    type: 'risk_matrix',
    title: 'Risk Matrix',
    description: 'Risk severity, impact & mitigations',
    icon: ShieldAlert,
    category: 'Analytics',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
];

export const BlockLibrary: React.FC<Props> = ({ onAddBlock, isPresentationMode = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (isPresentationMode) return null;

  const categories = ['All', 'Project', 'Agile', 'Team', 'Analytics'];

  const filteredBlocks = BLOCK_DEFINITIONS.filter(
    b => selectedCategory === 'All' || b.category === selectedCategory
  );

  return (
    <aside
      className={`relative h-[calc(100vh-3.5rem)] bg-slate-950/95 backdrop-blur-md border-r border-slate-800/80 transition-all duration-300 z-20 flex flex-col select-none ${
        isCollapsed ? 'w-12' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand Block Library' : 'Collapse Block Library'}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition z-30"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {isCollapsed ? (
        <div className="py-4 flex flex-col items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400" title="Block Library">
            <Plus className="w-4 h-4" />
          </div>
          <div className="w-6 h-px bg-slate-800" />
          {BLOCK_DEFINITIONS.slice(0, 6).map(b => {
            const Icon = b.icon;
            return (
              <button
                key={b.type}
                onClick={() => onAddBlock(b.type)}
                title={`Add ${b.title}`}
                className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3.5 flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-slate-100 block">Add to Canvas</span>
              <span className="text-[10px] text-slate-400">Click or drag to place blocks</span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Block Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredBlocks.map(block => {
              const Icon = block.icon;
              return (
                <div
                  key={block.type}
                  onClick={() => onAddBlock(block.type)}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('sprintflow/block-type', block.type);
                  }}
                  className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-sm flex items-start gap-2.5"
                >
                  <div className={`p-2 rounded-md border ${block.color} shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                        {block.title}
                      </span>
                      <Plus className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{block.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
            SprintFlow AI Modular Engine
          </div>
        </div>
      )}
    </aside>
  );
};
