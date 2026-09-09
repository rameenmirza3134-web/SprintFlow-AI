import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ProjectFullState } from '../types';

export async function exportCanvasAsImage(
  elementId: string,
  format: 'png' | 'jpg' = 'png',
  projectName: string = 'SprintFlow_Canvas'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Canvas container not found');
  }

  // Create canvas capture
  const canvas = await html2canvas(element, {
    backgroundColor: '#020617', // slate-950
    scale: 2, // High resolution
    useCORS: true,
    logging: false,
    ignoreElements: (el) => {
      return el.classList.contains('no-export') || el.classList.contains('canvas-nav-overlay');
    }
  });

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, 0.95);

  const link = document.createElement('a');
  link.download = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_canvas.${format}`;
  link.href = dataUrl;
  link.click();
}

export function exportProjectAsPDF(state: ProjectFullState): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SprintFlow AI — Project Plan Report', 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Project: ${state.project.name}`, 14, 28);
  doc.text(`Start Date: ${state.project.start_date || 'Not set'} | Target Deadline: ${state.project.deadline || 'Not set'}`, 14, 35);

  y = 52;

  // Section 1: Executive Overview
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Project Scenario & Strategy', 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const descLines = doc.splitTextToSize(state.project.description || state.project.scenario, pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 6;

  // Goals
  if (state.project.goals && state.project.goals.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Key Objectives & Goals:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    state.project.goals.forEach(goal => {
      doc.text(`• ${goal}`, 18, y);
      y += 5;
    });
    y += 4;
  }

  // Section 2: Team Roster
  if (state.teamMembers.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Team Roster & Roles', 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    state.teamMembers.forEach(tm => {
      doc.text(`• ${tm.name} — ${tm.role} (Skills: ${tm.skills.join(', ') || 'General'})`, 18, y);
      y += 5;
    });
    y += 4;
  }

  // Check page height
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // Section 3: Epics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Epics & Strategic Initiatives', 14, y);
  y += 7;

  state.epics.forEach(epic => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, y - 4, pageWidth - 28, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`[${epic.epic_code}] ${epic.title} (${epic.priority.toUpperCase()} Priority - ${epic.progress}% Completed)`, 17, y + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Goal: ${epic.goal}`, 17, y + 7);
    y += 18;
  });

  // Section 4: Sprints
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Sprint Allocation & Workload Planning', 14, y);
  y += 7;

  state.sprints.forEach(sprint => {
    const items = state.backlogItems.filter(b => b.sprint_id === sprint.id);
    const plannedPoints = items.reduce((acc, curr) => acc + (curr.story_points || 0), 0);
    const isOverloaded = plannedPoints > sprint.capacity;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(isOverloaded ? 254 : 248, isOverloaded ? 242 : 250, isOverloaded ? 242 : 252);
    doc.rect(14, y - 4, pageWidth - 28, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(isOverloaded ? 185 : 15, isOverloaded ? 28 : 23, isOverloaded ? 28 : 42);
    doc.text(`${sprint.name} | Capacity: ${sprint.capacity} pts | Planned: ${plannedPoints} pts ${isOverloaded ? '[OVERLOADED]' : ''}`, 17, y + 3);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    items.forEach(it => {
      const assignee = state.teamMembers.find(t => t.id === it.assignee_id)?.name || 'Unassigned';
      doc.text(`   - [${it.item_code}] ${it.title} (${it.story_points} pts) -> ${assignee} [${it.status}]`, 17, y);
      y += 5;
    });
    y += 4;
  });

  // Section 5: Risk Matrix
  if (state.risks.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Risk Analysis & Mitigation Strategies', 14, y);
    y += 7;

    state.risks.forEach(risk => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28);
      doc.text(`• [${risk.severity.toUpperCase()}] ${risk.title}`, 18, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`   Impact: ${risk.impact}`, 18, y);
      y += 4;
      doc.text(`   Mitigation: ${risk.mitigation}`, 18, y);
      y += 6;
    });
  }

  // Save the PDF
  doc.save(`${state.project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_SprintFlow_Plan.pdf`);
}

export function exportProjectAsJSON(state: ProjectFullState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${state.project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_backup.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
