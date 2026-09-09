import React from 'react';
import { Dependency, CanvasBlock } from '../../types';

interface Props {
  dependencies: Dependency[];
  blocks: CanvasBlock[];
  onDeleteDependency: (depId: string) => void;
  selectedBlockId: string | null;
  hoveredDepId: string | null;
  setHoveredDepId: (id: string | null) => void;
}

export const ConnectorLayer: React.FC<Props> = ({
  dependencies,
  blocks,
  onDeleteDependency,
  selectedBlockId,
  hoveredDepId,
  setHoveredDepId,
}) => {
  const blockMap = new Map<string, CanvasBlock>();
  blocks.forEach(b => blockMap.set(b.id, b));

  // Find block by entity_id or direct id
  const getBlockForEntity = (entityId: string): CanvasBlock | undefined => {
    return (
      blockMap.get(entityId) ||
      blocks.find(b => b.entity_id === entityId)
    );
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
      <defs>
        <marker
          id="arrow-blocks"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
        </marker>
        <marker
          id="arrow-depends"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
        </marker>
        <marker
          id="arrow-relates"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
        </marker>
      </defs>

      {dependencies.map(dep => {
        const sourceBlock = getBlockForEntity(dep.source_item_id);
        const targetBlock = getBlockForEntity(dep.target_item_id);

        if (!sourceBlock || !targetBlock) return null;

        // Calculate connection points
        // From right of source to left of target
        const startX = sourceBlock.x + sourceBlock.width;
        const startY = sourceBlock.y + sourceBlock.height / 2;
        const endX = targetBlock.x;
        const endY = targetBlock.y + targetBlock.height / 2;

        const deltaX = Math.abs(endX - startX) * 0.5;
        const c1X = startX + Math.max(deltaX, 50);
        const c1Y = startY;
        const c2X = endX - Math.max(deltaX, 50);
        const c2Y = endY;

        const pathData = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const isHovered = hoveredDepId === dep.id;
        const isHighlighted =
          selectedBlockId === sourceBlock.id || selectedBlockId === targetBlock.id;

        let strokeColor = '#6366f1'; // Indigo (depends_on)
        let markerId = 'arrow-depends';
        let badgeBg = 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50';

        if (dep.dependency_type === 'blocks') {
          strokeColor = '#f43f5e'; // Rose
          markerId = 'arrow-blocks';
          badgeBg = 'bg-rose-950/80 text-rose-300 border-rose-700/50';
        } else if (dep.dependency_type === 'relates_to') {
          strokeColor = '#38bdf8'; // Sky
          markerId = 'arrow-relates';
          badgeBg = 'bg-sky-950/80 text-sky-300 border-sky-700/50';
        }

        return (
          <g
            key={dep.id}
            className="group cursor-pointer pointer-events-auto"
            onMouseEnter={() => setHoveredDepId(dep.id)}
            onMouseLeave={() => setHoveredDepId(null)}
          >
            {/* Invisible wide stroke for easy clicking / hovering */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="24"
              className="pointer-events-stroke"
            />

            {/* Visible Bezier Path */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isHovered || isHighlighted ? 3 : 2}
              strokeDasharray={dep.dependency_type === 'relates_to' ? '6 4' : undefined}
              markerEnd={`url(#${markerId})`}
              className="transition-all duration-200"
              style={{
                filter: isHovered || isHighlighted ? `drop-shadow(0 0 6px ${strokeColor})` : undefined,
              }}
            />

            {/* Floating Label / Badge on Bezier Curve */}
            <foreignObject
              x={midX - 45}
              y={midY - 14}
              width="90"
              height="28"
              className="overflow-visible pointer-events-auto"
            >
              <div className="flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDependency(dep.id);
                  }}
                  title={dep.description ? `${dep.description} (Click to delete)` : 'Click to delete dependency'}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm shadow-md transition transform hover:scale-105 ${badgeBg}`}
                >
                  {dep.dependency_type.replace('_', ' ')}
                </button>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
};
