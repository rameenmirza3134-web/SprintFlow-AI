import { CanvasBlock, ProjectFullState } from '../types';

export function calculateAutoArrangeLayout(state: ProjectFullState): CanvasBlock[] {
  const updatedBlocks: CanvasBlock[] = [];
  const SPACING_X = 40;
  const SPACING_Y = 50;

  // 1. Top Section: Project Overview, Analytics, Team Roster
  let currentY = 80;
  const topBlocks = state.canvasBlocks.filter(b => 
    b.block_type === 'project_overview' || b.block_type === 'analytics' || b.block_type === 'team_roster'
  );

  let topX = 80;
  topBlocks.forEach(block => {
    let width = block.width || 420;
    let height = block.height || 380;
    if (block.block_type === 'project_overview') width = 480;
    if (block.block_type === 'team_roster') width = 400;

    updatedBlocks.push({
      ...block,
      x: topX,
      y: currentY,
      width,
      height
    });
    topX += width + SPACING_X;
  });

  currentY += 440;

  // 2. Epics Row: All Epics placed side-by-side
  const epicBlocks = state.canvasBlocks.filter(b => b.block_type === 'epic');
  if (epicBlocks.length > 0) {
    let epicX = 80;
    epicBlocks.forEach(block => {
      const width = block.width || 440;
      const height = block.height || 290;
      updatedBlocks.push({
        ...block,
        x: epicX,
        y: currentY,
        width,
        height
      });
      epicX += width + SPACING_X;
    });
    currentY += 340;
  }

  // 3. Sprints Row: Chronological horizontal sprint containers
  const sprintBlocks = state.canvasBlocks.filter(b => b.block_type === 'sprint');
  // Sort sprints by sprint_number
  const sortedSprintBlocks = [...sprintBlocks].sort((a, b) => {
    const sprintA = state.sprints.find(s => s.id === a.entity_id);
    const sprintB = state.sprints.find(s => s.id === b.entity_id);
    return (sprintA?.sprint_number || 0) - (sprintB?.sprint_number || 0);
  });

  if (sortedSprintBlocks.length > 0) {
    let sprintX = 80;
    sortedSprintBlocks.forEach(block => {
      const width = block.width || 440;
      const height = block.height || 500;
      updatedBlocks.push({
        ...block,
        x: sprintX,
        y: currentY,
        width,
        height
      });
      sprintX += width + SPACING_X;
    });
    currentY += 560;
  }

  // 4. Backlog & Risk Matrix Row
  const backlogBlock = state.canvasBlocks.find(b => b.block_type === 'product_backlog');
  const riskBlock = state.canvasBlocks.find(b => b.block_type === 'risk_matrix');

  if (backlogBlock) {
    const bWidth = backlogBlock.width || 920;
    const bHeight = backlogBlock.height || 460;
    updatedBlocks.push({
      ...backlogBlock,
      x: 80,
      y: currentY,
      width: bWidth,
      height: bHeight
    });

    if (riskBlock) {
      updatedBlocks.push({
        ...riskBlock,
        x: 80 + bWidth + SPACING_X,
        y: currentY,
        width: riskBlock.width || 440,
        height: riskBlock.height || 460
      });
    }
  } else if (riskBlock) {
    updatedBlocks.push({
      ...riskBlock,
      x: 80,
      y: currentY,
      width: 440,
      height: 460
    });
  }

  // Any remaining standalone cards (e.g. standalone task cards, notes, milestones)
  const handledIds = new Set(updatedBlocks.map(b => b.id));
  const remaining = state.canvasBlocks.filter(b => !handledIds.has(b.id));

  let remX = 80;
  let remY = currentY + 520;
  remaining.forEach((block, idx) => {
    updatedBlocks.push({
      ...block,
      x: remX,
      y: remY,
      width: block.width || 340,
      height: block.height || 220
    });
    remX += (block.width || 340) + SPACING_X;
    if ((idx + 1) % 3 === 0) {
      remX = 80;
      remY += (block.height || 220) + SPACING_Y;
    }
  });

  return updatedBlocks;
}
