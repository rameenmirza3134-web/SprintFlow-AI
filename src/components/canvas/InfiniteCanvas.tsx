import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CanvasBlock, ProjectFullState, Dependency, BacklogItem, Epic, Sprint, TeamMember, RiskItem, Project } from '../../types';
import { ProjectOverviewBlock } from '../blocks/ProjectOverviewBlock';
import { EpicBlock } from '../blocks/EpicBlock';
import { SprintBlock } from '../blocks/SprintBlock';
import { BacklogBlock } from '../blocks/BacklogBlock';
import { TeamRosterBlock } from '../blocks/TeamRosterBlock';
import { RiskBlock } from '../blocks/RiskBlock';
import { AnalyticsBlock } from '../blocks/AnalyticsBlock';
import { TaskCardBlock } from '../blocks/TaskCardBlock';
import { ConnectorLayer } from './ConnectorLayer';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Grid, Move } from 'lucide-react';

interface Props {
  state: ProjectFullState;
  onUpdateBlockPosition: (blockId: string, x: number, y: number, width?: number, height?: number) => void;
  onUpdateProject: (updated: Partial<Project>) => void;
  onUpdateEpic: (epicId: string, updated: Partial<Epic>) => void;
  onDeleteEpic: (epicId: string) => void;
  onDuplicateEpic: (epicId: string) => void;
  onAddStoryToEpic: (epicId: string) => void;
  onUpdateSprint: (sprintId: string, updated: Partial<Sprint>) => void;
  onMoveTask: (taskId: string, targetSprintId: string | null) => void;
  onUpdateTask: (taskId: string, updated: Partial<BacklogItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddNewTask: (sprintId?: string | null) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => void;
  onDeleteTeamMember: (id: string) => void;
  onAddRisk: (risk: Omit<RiskItem, 'id' | 'created_at'>) => void;
  onDeleteRisk: (id: string) => void;
  onDeleteDependency: (depId: string) => void;
  isPresentationMode?: boolean;
}

export const InfiniteCanvas: React.FC<Props> = ({
  state,
  onUpdateBlockPosition,
  onUpdateProject,
  onUpdateEpic,
  onDeleteEpic,
  onDuplicateEpic,
  onAddStoryToEpic,
  onUpdateSprint,
  onMoveTask,
  onUpdateTask,
  onDeleteTask,
  onAddNewTask,
  onAddTeamMember,
  onDeleteTeamMember,
  onAddRisk,
  onDeleteRisk,
  onDeleteDependency,
  isPresentationMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom State
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Snap to Grid (20px)
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const GRID_SIZE = 20;

  // Selected Block & Hovered Dependency
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [hoveredDepId, setHoveredDepId] = useState<string | null>(null);

  // Block Dragging
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Block Resizing
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });

  // Handle Wheel Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(prev => Math.min(2.0, Math.max(0.25, prev * zoomFactor)));
    } else {
      // Normal trackpad / wheel scroll moves pan
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  // Handle Canvas Pan Start
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking directly on canvas background (not on a block)
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setSelectedBlockId(null);
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle Block Mouse Down for Dragging
  const handleBlockMouseDown = (e: React.MouseEvent, block: CanvasBlock) => {
    if (isPresentationMode) return;
    // Don't drag if clicking buttons, inputs, selects, or resize handle
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('.resize-handle') ||
      target.closest('.no-drag')
    ) {
      return;
    }

    e.stopPropagation();
    setSelectedBlockId(block.id);
    setDraggingBlockId(block.id);

    // Calculate offset inside the block in canvas coordinates
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;
    setDragOffset({
      x: canvasX - block.x,
      y: canvasY - block.y,
    });
  };

  // Handle Resize Start
  const handleResizeMouseDown = (e: React.MouseEvent, block: CanvasBlock) => {
    if (isPresentationMode) return;
    e.stopPropagation();
    setSelectedBlockId(block.id);
    setResizingBlockId(block.id);
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      startW: block.width,
      startH: block.height,
    });
  };

  // Global Mouse Move & Mouse Up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      } else if (draggingBlockId) {
        const currentBlock = state.canvasBlocks.find(b => b.id === draggingBlockId);
        if (currentBlock) {
          const rawX = (e.clientX - pan.x) / zoom - dragOffset.x;
          const rawY = (e.clientY - pan.y) / zoom - dragOffset.y;

          let newX = rawX;
          let newY = rawY;
          if (snapToGrid) {
            newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
          }

          onUpdateBlockPosition(draggingBlockId, Math.max(0, newX), Math.max(0, newY));
        }
      } else if (resizingBlockId) {
        const currentBlock = state.canvasBlocks.find(b => b.id === resizingBlockId);
        if (currentBlock) {
          const deltaX = (e.clientX - resizeStart.startX) / zoom;
          const deltaY = (e.clientY - resizeStart.startY) / zoom;

          let newW = Math.max(300, resizeStart.startW + deltaX);
          let newH = Math.max(200, resizeStart.startH + deltaY);

          if (snapToGrid) {
            newW = Math.round(newW / GRID_SIZE) * GRID_SIZE;
            newH = Math.round(newH / GRID_SIZE) * GRID_SIZE;
          }

          onUpdateBlockPosition(resizingBlockId, currentBlock.x, currentBlock.y, newW, newH);
        }
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setDraggingBlockId(null);
      setResizingBlockId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isPanning,
    startPan,
    draggingBlockId,
    dragOffset,
    resizingBlockId,
    resizeStart,
    pan,
    zoom,
    snapToGrid,
    state.canvasBlocks,
    onUpdateBlockPosition,
  ]);

  // Fit to screen calculation
  const handleFitToScreen = () => {
    if (state.canvasBlocks.length === 0) {
      setPan({ x: 80, y: 80 });
      setZoom(0.85);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    state.canvasBlocks.forEach(b => {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    });

    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const viewportWidth = window.innerWidth - 80;
    const viewportHeight = window.innerHeight - 120;

    const newZoom = Math.min(1.2, Math.max(0.3, Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight)));
    setZoom(newZoom);
    setPan({
      x: -minX * newZoom + padding * newZoom,
      y: -minY * newZoom + padding * newZoom,
    });
  };

  return (
    <div
      id="sprintflow-canvas-viewport"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 canvas-background ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background SVG Grid pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern
            id="canvas-grid-pattern"
            width={40 * zoom}
            height={40 * zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${pan.x}, ${pan.y})`}
          >
            <circle cx={20 * zoom} cy={20 * zoom} r={1.2} fill="#64748b" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />
      </svg>

      {/* Transformable Canvas Workspace Layer */}
      <div
        id="sprintflow-canvas-content"
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '10000px',
          height: '10000px',
        }}
      >
        {/* SVG Dependency Connector Lines */}
        <ConnectorLayer
          dependencies={state.dependencies}
          blocks={state.canvasBlocks}
          onDeleteDependency={onDeleteDependency}
          selectedBlockId={selectedBlockId}
          hoveredDepId={hoveredDepId}
          setHoveredDepId={setHoveredDepId}
        />

        {/* Canvas Blocks */}
        {state.canvasBlocks.map(block => {
          const isSelected = selectedBlockId === block.id;

          let blockComponent: React.ReactNode = null;

          switch (block.block_type) {
            case 'project_overview':
              blockComponent = (
                <ProjectOverviewBlock
                  project={state.project}
                  teamMembers={state.teamMembers}
                  onUpdateProject={onUpdateProject}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;

            case 'epic': {
              const epic = state.epics.find(e => e.id === block.entity_id);
              if (!epic) return null;
              const storyCount = state.backlogItems.filter(b => b.epic_id === epic.id).length;
              blockComponent = (
                <EpicBlock
                  epic={epic}
                  storyCount={storyCount}
                  onUpdate={updated => onUpdateEpic(epic.id, updated)}
                  onDelete={() => onDeleteEpic(epic.id)}
                  onDuplicate={() => onDuplicateEpic(epic.id)}
                  onAddStory={() => onAddStoryToEpic(epic.id)}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;
            }

            case 'sprint': {
              const sprint = state.sprints.find(s => s.id === block.entity_id);
              if (!sprint) return null;
              const sprintTasks = state.backlogItems.filter(b => b.sprint_id === sprint.id);
              blockComponent = (
                <SprintBlock
                  sprint={sprint}
                  tasks={sprintTasks}
                  teamMembers={state.teamMembers}
                  onUpdateSprint={updated => onUpdateSprint(sprint.id, updated)}
                  onMoveTask={onMoveTask}
                  onAddTaskToSprint={() => onAddNewTask(sprint.id)}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;
            }

            case 'product_backlog':
              blockComponent = (
                <BacklogBlock
                  items={state.backlogItems}
                  sprints={state.sprints}
                  teamMembers={state.teamMembers}
                  onUpdateItem={onUpdateTask}
                  onDeleteItem={onDeleteTask}
                  onAddNewTask={() => onAddNewTask(null)}
                  onMoveTask={onMoveTask}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;

            case 'team_roster':
              blockComponent = (
                <TeamRosterBlock
                  members={state.teamMembers}
                  tasks={state.backlogItems}
                  onAddMember={onAddTeamMember}
                  onDeleteMember={onDeleteTeamMember}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;

            case 'risk_matrix':
              blockComponent = (
                <RiskBlock
                  risks={state.risks}
                  onAddRisk={onAddRisk}
                  onDeleteRisk={onDeleteRisk}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;

            case 'analytics':
              blockComponent = (
                <AnalyticsBlock state={state} />
              );
              break;

            case 'task_card': {
              const task = state.backlogItems.find(b => b.id === block.entity_id);
              if (!task) return null;
              blockComponent = (
                <TaskCardBlock
                  task={task}
                  teamMembers={state.teamMembers}
                  onUpdate={up => onUpdateTask(task.id, up)}
                  onDelete={() => onDeleteTask(task.id)}
                  isPresentationMode={isPresentationMode}
                />
              );
              break;
            }

            default:
              blockComponent = (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
                  {block.title}
                </div>
              );
          }

          return (
            <div
              key={block.id}
              id={`canvas-block-${block.id}`}
              onMouseDown={e => handleBlockMouseDown(e, block)}
              style={{
                position: 'absolute',
                left: `${block.x}px`,
                top: `${block.y}px`,
                width: `${block.width}px`,
                height: `${block.height}px`,
                zIndex: isSelected ? 30 : block.z_index || 1,
              }}
              className={`transition-shadow rounded-xl ${
                isSelected ? 'ring-2 ring-indigo-500 shadow-2xl' : ''
              }`}
            >
              {blockComponent}

              {/* Bottom Right Resize Handle */}
              {!isPresentationMode && (
                <div
                  onMouseDown={e => handleResizeMouseDown(e, block)}
                  className="resize-handle absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-1 text-slate-500 hover:text-indigo-400"
                  title="Drag to resize block"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="4" r="1.5" />
                    <circle cx="4" cy="8" r="1.5" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Controls (Zoom, Fit, Grid, Presentation) */}
      <div className="canvas-nav-overlay absolute bottom-6 right-6 flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl text-slate-300 text-xs z-40">
        <button
          onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
          title="Zoom In"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs text-slate-400 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(prev => Math.max(0.25, prev - 0.1))}
          title="Zoom Out"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={handleFitToScreen}
          title="Fit to Screen"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 80, y: 80 });
          }}
          title="Reset Zoom (100%)"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          title={snapToGrid ? 'Snap to Grid (Enabled)' : 'Snap to Grid (Disabled)'}
          className={`p-2 rounded-lg transition ${
            snapToGrid ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'hover:bg-slate-800'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
