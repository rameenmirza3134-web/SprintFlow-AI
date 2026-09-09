import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Clock,
  User,
  Layers,
  Palette,
  Code2,
  TestTube,
  Rocket,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sun,
  Moon,
  X,
  UserPlus,
  Users
} from 'lucide-react';
import { ProjectFullState, BacklogItem, ProjectStage, Priority, Sprint, Epic } from '../types';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onSaveAndOpenBoard: (state: ProjectFullState) => void;
  onCancel?: () => void;
  hasExistingProject?: boolean;
}

export interface GeneratedDraft {
  name: string;
  description: string;
  sprint_duration: number;
  sprints_count: number;
  team: { name: string; role: string }[];
  tasks: {
    id: string;
    title: string;
    description: string;
    stage: ProjectStage;
    timing: string;
    assignee_name: string;
    story_points: number;
    priority: Priority;
  }[];
}

export interface TeamMemberEntry {
  id: string;
  name: string;
  role: string;
}

export function findBestAssigneeForTask(
  task: { title?: string; description?: string; stage?: string },
  team: { name: string; role?: string }[]
): string {
  if (!team || team.length === 0) return 'Team Member';

  const title = (task.title || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const stage = (task.stage || '').toLowerCase();
  const text = `${title} ${desc} ${stage}`;

  const isDevops = stage === 'deployment' || /ci\/cd|pipeline|docker|cloud|deploy|staging|infrastructure|hosting|dns|ssl|monitoring|sre|kubernetes/.test(text);
  const isQa = stage === 'testing' || /test|qa|bug bash|regression|audit|verification|test suite|e2e/.test(text);
  const isBackend = /database|schema|migration|api|rest|backend|endpoint|controller|server|sql|postgres|auth|data model/.test(text);
  const isFrontend = /frontend|client ui|interface|react|component|state engine|screens|views|tailwind|client-side|responsive/.test(text);
  const isDesign = stage === 'designing' || /design|ui\/ux|ux|wireframe|figma|prototype|mockup|theme system|component architecture/.test(text);
  const isProduct = /user story|user stories|acceptance criteria|scope|product owner|backlog|uat|specifications|requirements|journey/.test(text);

  let bestMember = team[0];
  let highestScore = -999;

  for (const m of team) {
    let score = 0;
    const role = (m.role || '').toLowerCase();

    if (isDevops) {
      if (/devops|cloud|infra|sre|sysadmin/.test(role)) score += 160;
      else if (/backend|full stack/.test(role)) score += 30;
      else if (/designer|ui\/ux|product owner/.test(role)) score -= 100;
    } else if (isQa) {
      if (/qa|tester|testing|quality/.test(role)) score += 160;
      else if (isProduct && /product owner|po|scrum master/.test(role)) score += 110;
      else if (/full stack|frontend/.test(role)) score += 30;
      else if (/designer|ui\/ux/.test(role)) score -= 50;
    } else if (isBackend) {
      if (/backend|database|architect|data engineer/.test(role)) score += 160;
      else if (/full stack/.test(role)) score += 70;
      else if (/designer|ui\/ux|devops|product owner/.test(role)) score -= 100;
    } else if (isFrontend) {
      if (/frontend|ui developer|client/.test(role)) score += 160;
      else if (/full stack/.test(role)) score += 70;
      else if (/designer|ui\/ux/.test(role)) score += 40;
      else if (/backend|devops/.test(role)) score -= 80;
    } else if (isDesign) {
      if (/designer|ui\/ux|ux|ui designer/.test(role)) score += 160;
      else if (/product owner|po|scrum master/.test(role)) score += 80;
      else if (/frontend/.test(role)) score += 50;
      else if (/devops|backend/.test(role)) score -= 100;
    }

    if (isProduct) {
      if (/product owner|po|scrum master|product manager|pm/.test(role)) score += 180;
      else if (/designer|ui\/ux/.test(role)) score += 50;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMember = m;
    }
  }

  return bestMember.name;
}

const DEFAULT_TEAM_MEMBERS: TeamMemberEntry[] = [
  { id: 'tm-1', name: 'Rameen', role: 'Product Owner' },
  { id: 'tm-2', name: 'Zainab', role: 'Frontend Developer' },
  { id: 'tm-3', name: 'Anees', role: 'Backend Developer' },
  { id: 'tm-4', name: 'Moniba', role: 'DevOps & Cloud' },
];

export const ProjectIdeaGenerator: React.FC<Props> = ({
  onSaveAndOpenBoard,
  onCancel,
  hasExistingProject
}) => {
  const [scenario, setScenario] = useState('');
  const [projectName, setProjectName] = useState('');
  const [sprintDuration, setSprintDuration] = useState(2); // 1, 2, 3, 4 weeks
  const [sprintCount, setSprintCount] = useState(4); // Up to 4 sprints
  const [teamMembersList, setTeamMembersList] = useState<TeamMemberEntry[]>(DEFAULT_TEAM_MEMBERS);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Full Stack Dev');

  // Step 2 inline member addition
  const [draftNewMemberName, setDraftNewMemberName] = useState('');
  const [draftNewMemberRole, setDraftNewMemberRole] = useState('Full Stack Dev');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark, toggleTheme } = useTheme();

  // Once generated, populated in editable text boxes
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);

  const handleAddTeamMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    const newMember: TeamMemberEntry = {
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      role: newMemberRole || 'Team Member',
    };
    setTeamMembersList(prev => [...prev, newMember]);
    setNewMemberName('');
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembersList(prev => prev.filter(m => m.id !== id));
  };

  const handleAddDraftMember = () => {
    if (!draft) return;
    const trimmed = draftNewMemberName.trim();
    if (!trimmed) return;
    setDraft({
      ...draft,
      team: [...draft.team, { name: trimmed, role: draftNewMemberRole || 'Team Member' }],
    });
    setDraftNewMemberName('');
  };

  const handleRemoveDraftMember = (indexToRemove: number) => {
    if (!draft || draft.team.length <= 1) return;
    const memberToRemove = draft.team[indexToRemove];
    const updatedTeam = draft.team.filter((_, idx) => idx !== indexToRemove);
    const fallbackAssignee = updatedTeam[0]?.name || 'Lead Member';

    // Reassign any tasks currently assigned to the removed member
    const updatedTasks = draft.tasks.map(t =>
      t.assignee_name === memberToRemove.name ? { ...t, assignee_name: fallbackAssignee } : t
    );

    setDraft({
      ...draft,
      team: updatedTeam,
      tasks: updatedTasks,
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) {
      setError('Please paste your project idea or requirements first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const payloadTeam = teamMembersList.map(m => ({ name: m.name, role: m.role }));

    try {
      const response = await fetch('/api/projects/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario.trim(),
          project_name: projectName.trim() || undefined,
          sprint_duration: sprintDuration,
          team_members: payloadTeam,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const raw = await response.json();
      const generated = raw.project || raw;

      // Default team if empty
      const rawTeam = generated.team || generated.team_members || [];
      const teamList = payloadTeam.length > 0
        ? payloadTeam
        : (rawTeam.length > 0
          ? rawTeam.map((m: any) => ({ name: typeof m === 'string' ? m : m.name, role: typeof m === 'string' ? 'Member' : (m.role || 'Member') }))
          : DEFAULT_TEAM_MEMBERS.map(m => ({ name: m.name, role: m.role })));

      // Ensure tasks have 4 stages: designing, development, testing, deployment
      const initialTasks = (generated.tasks || generated.backlog_items || []).map((t: any, idx: number) => {
        let stage: ProjectStage = 'development';
        if (t.stage && ['designing', 'development', 'testing', 'deployment'].includes(t.stage)) {
          stage = t.stage;
        } else {
          // Categorize based on index or title keywords
          const text = ((t.title || '') + ' ' + (t.description || '')).toLowerCase();
          if (text.includes('design') || text.includes('ui') || text.includes('wireframe') || text.includes('ux') || idx === 0) {
            stage = 'designing';
          } else if (text.includes('test') || text.includes('qa') || text.includes('audit')) {
            stage = 'testing';
          } else if (text.includes('deploy') || text.includes('docker') || text.includes('ci/cd') || text.includes('cloud') || text.includes('pipeline')) {
            stage = 'deployment';
          } else {
            stage = 'development';
          }
        }

        const defaultTiming =
          stage === 'designing' ? 'Sprint 1 • Days 1-3' :
          stage === 'development' ? 'Sprint 2 • Days 1-5' :
          stage === 'testing' ? 'Sprint 3 • Days 1-5' :
          'Sprint 4 • Days 1-4';

        const assignedMember = teamList.find(m => m.name.toLowerCase() === (t.assignee_name || '').toLowerCase());
        const finalAssignee = assignedMember && teamList.length <= 1
          ? assignedMember.name
          : findBestAssigneeForTask({ title: t.title, description: t.description, stage }, teamList);

        return {
          id: t.id || `draft-task-${idx + 1}`,
          title: t.title || `Task ${idx + 1}`,
          description: t.description || '',
          stage: stage,
          timing: t.timing || defaultTiming,
          assignee_name: finalAssignee,
          story_points: t.story_points || 3,
          priority: (t.priority || 'medium') as Priority,
        };
      });

      // Ensure we have at least one task per stage for demonstration
      const stages: ProjectStage[] = ['designing', 'development', 'testing', 'deployment'];
      stages.forEach((stg) => {
        const has = initialTasks.some((t: any) => t.stage === stg);
        if (!has) {
          if (stg === 'designing') {
            const taskObj = {
              title: `${generated.name || 'Project'} UI/UX Wireframes & Interactive Prototypes`,
              description: 'Create high-fidelity component specifications, user flow diagrams, and interactive mockups.',
              stage: 'designing' as ProjectStage,
            };
            initialTasks.unshift({
              id: `draft-task-design-default`,
              ...taskObj,
              timing: 'Sprint 1 • Days 1-4',
              assignee_name: findBestAssigneeForTask(taskObj, teamList),
              story_points: 5,
              priority: 'high',
            });
          } else if (stg === 'testing') {
            const taskObj = {
              title: 'Automated Unit, Integration & End-to-End Test Suite',
              description: 'Write automated test coverage for core workflows and execute regression testing.',
              stage: 'testing' as ProjectStage,
            };
            initialTasks.push({
              id: `draft-task-test-default`,
              ...taskObj,
              timing: 'Sprint 3 • Days 1-5',
              assignee_name: findBestAssigneeForTask(taskObj, teamList),
              story_points: 3,
              priority: 'high',
            });
          } else if (stg === 'deployment') {
            const taskObj = {
              title: 'CI/CD Pipeline Setup & Production Cloud Deployment',
              description: 'Configure automated build/deploy pipeline, containerization, and monitoring alerts.',
              stage: 'deployment' as ProjectStage,
            };
            initialTasks.push({
              id: `draft-task-deploy-default`,
              ...taskObj,
              timing: 'Sprint 4 • Days 1-4',
              assignee_name: findBestAssigneeForTask(taskObj, teamList),
              story_points: 3,
              priority: 'medium',
            });
          }
        }
      });

      setDraft({
        name: generated.name || projectName || 'Agile Project',
        description: generated.description || scenario.slice(0, 160),
        sprint_duration: generated.sprint_duration || sprintDuration,
        sprints_count: Math.max(sprintCount, (generated.sprints || []).length || 4),
        team: teamList,
        tasks: initialTasks,
      });
    } catch (err: any) {
      console.warn('Backend generation failed, using intelligent client-side generation fallback:', err);
      // Generate client-side fallback
      generateLocalDraft();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateLocalDraft = () => {
    const rawName = projectName.trim() || inferProjectName(scenario);
    const team = teamMembersList.length > 0
      ? teamMembersList.map(m => ({ name: m.name, role: m.role }))
      : DEFAULT_TEAM_MEMBERS.map(m => ({ name: m.name, role: m.role }));

    const rawTasks = [
      // Designing - Sprint 1
      {
        id: 'task-gen-0',
        title: 'User Story Mapping & Product Acceptance Criteria',
        description: 'Map user journeys, requirements specifications, and core acceptance criteria.',
        stage: 'designing' as ProjectStage,
        timing: 'Sprint 1 • Days 1-2',
        story_points: 3,
        priority: 'high' as Priority,
      },
      {
        id: 'task-gen-1',
        title: 'Design System & Figma Component Architecture',
        description: 'Define typography, color tokens, and responsive UI components for the core user flow.',
        stage: 'designing' as ProjectStage,
        timing: 'Sprint 1 • Days 2-4',
        story_points: 5,
        priority: 'high' as Priority,
      },
      {
        id: 'task-gen-2',
        title: 'Interactive User Journey & Wireframe Prototyping',
        description: 'Map complete user journey map with click-through wireframes for validation.',
        stage: 'designing' as ProjectStage,
        timing: 'Sprint 1 • Days 3-5',
        story_points: 3,
        priority: 'medium' as Priority,
      },
      // Development - Sprint 2
      {
        id: 'task-gen-3',
        title: 'Database Schema, Models & Migration Pipeline',
        description: 'Design relational database models, indexes, and automated migration scripts.',
        stage: 'development' as ProjectStage,
        timing: 'Sprint 2 • Days 1-3',
        story_points: 5,
        priority: 'critical' as Priority,
      },
      {
        id: 'task-gen-4',
        title: 'Backend API Controllers & Business Logic Endpoints',
        description: 'Implement RESTful endpoints, data validation, and backend service integration.',
        stage: 'development' as ProjectStage,
        timing: 'Sprint 2 • Days 3-6',
        story_points: 8,
        priority: 'critical' as Priority,
      },
      {
        id: 'task-gen-5',
        title: 'Responsive Client UI & Interactive State Engine',
        description: 'Build user interfaces, forms, and client state management for primary workflows.',
        stage: 'development' as ProjectStage,
        timing: 'Sprint 2 • Days 5-8',
        story_points: 8,
        priority: 'high' as Priority,
      },
      // Testing - Sprint 3
      {
        id: 'task-gen-6',
        title: 'Comprehensive QA Bug Bash & Cross-Browser Testing',
        description: 'Verify edge cases, validation errors, accessibility compliance, and mobile responsive behavior.',
        stage: 'testing' as ProjectStage,
        timing: 'Sprint 3 • Days 1-4',
        story_points: 5,
        priority: 'high' as Priority,
      },
      {
        id: 'task-gen-7',
        title: 'Automated E2E Test Suite & Security Validation',
        description: 'Implement automated integration test suite and check security posture.',
        stage: 'testing' as ProjectStage,
        timing: 'Sprint 3 • Days 4-7',
        story_points: 3,
        priority: 'medium' as Priority,
      },
      // Deployment - Sprint 4
      {
        id: 'task-gen-8',
        title: 'CI/CD Pipeline Automation & Production Deployment',
        description: 'Setup continuous deployment pipeline, Docker containerization, and SSL configuration.',
        stage: 'deployment' as ProjectStage,
        timing: 'Sprint 4 • Days 1-3',
        story_points: 3,
        priority: 'high' as Priority,
      },
      {
        id: 'task-gen-9',
        title: 'Cloud Infrastructure & Live Domain Release',
        description: 'Provision cloud hosting, SSL certificates, monitoring dashboards, and live DNS launch.',
        stage: 'deployment' as ProjectStage,
        timing: 'Sprint 4 • Days 4-7',
        story_points: 5,
        priority: 'critical' as Priority,
      },
    ];

    const tasks = rawTasks.map(t => ({
      ...t,
      assignee_name: findBestAssigneeForTask(t, team),
    }));

    setDraft({
      name: rawName,
      description: scenario.trim().slice(0, 180),
      sprint_duration: sprintDuration,
      sprints_count: sprintCount,
      team: team,
      tasks: tasks,
    });
  };

  const inferProjectName = (text: string): string => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0].length < 50 && !lines[0].includes('.')) {
      return lines[0];
    }
    const words = text.split(' ').slice(0, 4).join(' ');
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Agile Project';
  };

  // Updating draft state
  const handleUpdateTask = (id: string, field: string, value: any) => {
    if (!draft) return;
    setDraft({
      ...draft,
      tasks: draft.tasks.map(t => (t.id === id ? { ...t, [field]: value } : t)),
    });
  };

  const handleDeleteTask = (id: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      tasks: draft.tasks.filter(t => t.id !== id),
    });
  };

  const handleAddTaskToStage = (stage: ProjectStage) => {
    if (!draft) return;
    const newTask = {
      id: `task-manual-${Date.now()}`,
      title: `New ${stage.charAt(0).toUpperCase() + stage.slice(1)} Task`,
      description: '',
      stage: stage,
      timing: 'Sprint 1 • 2 days',
      assignee_name: draft.team[0]?.name || 'Lead Member',
      story_points: 3,
      priority: 'medium' as Priority,
    };
    setDraft({
      ...draft,
      tasks: [...draft.tasks, newTask],
    });
  };

  // Convert draft into full ProjectFullState and notify parent
  const handleSaveAndOpen = () => {
    if (!draft) return;

    const projectId = `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const teamMembers = draft.team.map((m, idx) => ({
      id: `tm-${idx + 1}`,
      project_id: projectId,
      name: m.name,
      role: m.role,
      avatar_url: '',
      capacity_hours_per_week: 40,
      skills: ['Agile', 'FullStack'],
    }));

    // Calculate duration in days per sprint (e.g. 1, 2, 3, or 4 weeks)
    const weeksPerSprint = draft.sprint_duration || 2;
    const daysPerSprint = weeksPerSprint * 7;
    const totalSprints = Math.max(1, Math.min(6, draft.sprints_count || 4));

    const sprintTitles = [
      { name: 'Sprint 1 - UI/UX Design & Architecture', goal: 'Complete user journeys, component tokens, wireframes, and schema architecture.' },
      { name: 'Sprint 2 - Core Development & Features', goal: 'Build interactive front-end components, REST/GraphQL APIs, and state engines.' },
      { name: 'Sprint 3 - Testing, QA & Security Audits', goal: 'Execute automated E2E testing, edge-case validation, and security compliance.' },
      { name: 'Sprint 4 - Cloud Infrastructure & Live Launch', goal: 'Configure CI/CD pipelines, SSL staging domains, and deploy to live production.' },
    ];

    const sprints: Sprint[] = Array.from({ length: totalSprints }, (_, idx) => {
      const startMs = Date.now() + idx * daysPerSprint * 86400000;
      const endMs = startMs + daysPerSprint * 86400000;
      const meta = sprintTitles[idx] || {
        name: `Sprint ${idx + 1} - Iteration Increment`,
        goal: `Deliver milestone features and bugfixes for Sprint ${idx + 1}.`,
      };

      return {
        id: `sprint-${idx + 1}-${Date.now()}`,
        project_id: projectId,
        sprint_number: idx + 1,
        name: meta.name,
        goal: meta.goal,
        start_date: new Date(startMs).toISOString().split('T')[0],
        end_date: new Date(endMs).toISOString().split('T')[0],
        status: idx === 0 ? 'active' : 'planned',
        capacity: 35,
        created_at: now,
        updated_at: now,
      };
    });

    const epics: Epic[] = [
      {
        id: `epic-1`,
        epic_code: 'EP-01',
        project_id: projectId,
        title: 'Core Product Release',
        description: draft.description,
        goal: 'Deliver initial usable increment',
        priority: 'high',
        progress: 15,
        created_at: now,
        updated_at: now,
      },
    ];

    const backlogItems: BacklogItem[] = draft.tasks.map((t, idx) => {
      // Assign sprint based on stage or explicit timing string
      let assignedSprint = sprints[0];
      const timingStr = (t.timing || '').toLowerCase();
      if (timingStr.includes('sprint 4') || (t.stage === 'deployment' && sprints[3])) {
        assignedSprint = sprints[3] || sprints[sprints.length - 1];
      } else if (timingStr.includes('sprint 3') || (t.stage === 'testing' && sprints[2])) {
        assignedSprint = sprints[2] || sprints[sprints.length - 1];
      } else if (timingStr.includes('sprint 2') || (t.stage === 'development' && sprints[1])) {
        assignedSprint = sprints[1] || sprints[0];
      } else {
        assignedSprint = sprints[0];
      }

      const assignedMember = teamMembers.find(m => m.name === t.assignee_name) || teamMembers[0];

      return {
        id: `task-item-${idx + 1}-${Date.now()}`,
        project_id: projectId,
        sprint_id: assignedSprint.id,
        epic_id: epics[0].id,
        item_code: `SF-${idx + 101}`,
        title: t.title,
        description: t.description,
        stage: t.stage,
        timing: t.timing,
        status: 'todo',
        priority: t.priority,
        story_points: t.story_points,
        assignee_id: assignedMember?.id || null,
        assignee_name: t.assignee_name,
        dependencies: [],
        ai_suggested: true,
        created_at: now,
        updated_at: now,
      };
    });

    const fullState: ProjectFullState = {
      project: {
        id: projectId,
        name: draft.name,
        description: draft.description,
        scenario: scenario.trim(),
        start_date: new Date().toISOString().split('T')[0],
        deadline: null,
        sprint_duration: draft.sprint_duration,
        project_type: 'Agile Web Application',
        tech_stack: ['TypeScript', 'React', 'TailwindCSS', 'Node.js'],
        created_at: now,
        updated_at: now,
        is_demo: false,
      },
      teamMembers,
      epics,
      backlogItems,
      sprints,
      dependencies: [],
      risks: [],
      milestones: [],
      canvasBlocks: [],
    };

    onSaveAndOpenBoard(fullState);
  };

  const getStageMeta = (stage: ProjectStage) => {
    switch (stage) {
      case 'designing':
        return {
          label: 'Designing',
          desc: 'UI/UX mockups, design systems & customer journeys',
          icon: Palette,
          color: 'text-purple-600 dark:text-purple-400',
          badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
        };
      case 'development':
        return {
          label: 'Development',
          desc: 'Frontend components, backend APIs & database schemas',
          icon: Code2,
          color: 'text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        };
      case 'testing':
        return {
          label: 'Testing & QA',
          desc: 'Unit testing, QA bug bash, validation & audits',
          icon: TestTube,
          color: 'text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        };
      case 'deployment':
        return {
          label: 'Deployment',
          desc: 'CI/CD automation, cloud hosting & launch',
          icon: Rocket,
          color: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 transition-colors duration-200">
      {/* Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between pb-6 mb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              SprintFlow <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">AI</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-medium">
                AI Project Planner
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste your project idea &rarr; AI organizes Sprints & Backlog &rarr; Review &rarr; Save to Board
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {hasExistingProject && onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition shadow-xs"
            >
              Back to Active Project
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl">
        {!draft ? (
          /* STEP 1: Empty text box where user pastes idea */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md dark:shadow-2xl transition-colors duration-200">
            <div className="max-w-2xl mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Paste your project idea or requirements
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Provide anything from a brief 2-sentence summary to full specifications. SprintFlow AI will analyze your requirements and break them down into 4 clear phases: <strong>Designing</strong>, <strong>Development</strong>, <strong>Testing</strong>, and <strong>Deployment</strong> with realistic timing and team allocations.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Project Scenario & Requirements <span className="text-indigo-600 dark:text-indigo-400">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Quick fill:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setScenario("Develop a comprehensive telemedicine platform supporting patient appointment scheduling, WebRTC video consultations, electronic prescription issuing, and automated SMS reminders.");
                        setProjectName("TeleMed Health Hub");
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition cursor-pointer"
                    >
                      Telemedicine
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScenario("Build an e-commerce marketplace featuring product catalog search, real-time inventory management, customer cart, Stripe payment checkout, and order fulfillment tracking.");
                        setProjectName("NovaStore Commerce");
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition cursor-pointer"
                    >
                      E-Commerce
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScenario("Create a real-time fleet management dashboard with vehicle GPS telemetry ingestion, driver route optimization, automated maintenance alerts, and cloud infrastructure monitoring.");
                        setProjectName("FleetPulse Telemetry");
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 transition cursor-pointer"
                    >
                      Fleet Logistics
                    </button>
                  </div>
                </div>
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Paste your project idea here...
Example: Build an on-demand food delivery platform with customer mobile app, restaurant menu portal, driver dispatch system with GPS routing, and Stripe checkout payments."
                  rows={7}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition leading-relaxed resize-y font-normal"
                  autoFocus
                />
              </div>

              {/* Project Configuration: Name, Sprint Duration, Sprints Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Project Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. QuickBite Express"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sprint Duration (Weeks per Sprint)
                  </label>
                  <select
                    value={sprintDuration}
                    onChange={(e) => setSprintDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value={1}>1 Week per Sprint (7 Days)</option>
                    <option value={2}>2 Weeks per Sprint (14 Days - Standard)</option>
                    <option value={3}>3 Weeks per Sprint (21 Days)</option>
                    <option value={4}>4 Weeks per Sprint (28 Days / 1 Month)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sprint Planning Scope
                  </label>
                  <select
                    value={sprintCount}
                    onChange={(e) => setSprintCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value={4}>4 Sprints (Sprint 1 to 4 • 4-Phase Delivery)</option>
                    <option value={3}>3 Sprints (Sprint 1 to 3)</option>
                    <option value={2}>2 Sprints (Sprint 1 to 2)</option>
                    <option value={1}>1 Sprint (Sprint 1)</option>
                  </select>
                </div>
              </div>

              {/* Team Members Section: Add One by One */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Add Team Members One by One ({teamMembersList.length})</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enter each member's name and role individually. You can customize, add, or remove members below.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTeamMembersList([])}
                      className="text-[11px] text-slate-400 hover:text-rose-500 transition px-1.5 py-0.5 rounded"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamMembersList(DEFAULT_TEAM_MEMBERS)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 py-0.5 rounded"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>

                {/* Individual Member Input Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTeamMember();
                        }
                      }}
                      placeholder="Type member name (e.g. Sara Khan, Marcus Chen)..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:w-52">
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Architect">Backend Architect</option>
                      <option value="Full Stack Dev">Full Stack Dev</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="DevOps & Cloud">DevOps & Cloud</option>
                      <option value="Scrum Master">Scrum Master</option>
                      <option value="Product Owner">Product Owner</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    disabled={!newMemberName.trim()}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Team Members List (Cards added one by one) */}
                {teamMembersList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2.5">
                    {teamMembersList.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {member.role}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          title={`Remove ${member.name}`}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-center p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-400">
                    No team members added yet. Type a name above and click "Add Member" to add them one by one.
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Ready to analyze with SprintFlow AI
                </span>

                <button
                  type="submit"
                  disabled={isGenerating || !scenario.trim()}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Sprint Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Sprints & Backlog</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 2: Populated Text Boxes for User to Analyze & Edit */
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors duration-200">
              <div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider block">
                  ✓ AI Analysis Complete
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Review & edit the structured project plan below
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All fields are editable text boxes. When satisfied, click &quot;Save & View Board&quot;.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setDraft(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Over</span>
                </button>

                <button
                  onClick={handleSaveAndOpen}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & View Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Project Overview Inputs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs dark:shadow-md transition-colors duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sprint Duration (Weeks)
                  </label>
                  <select
                    value={draft.sprint_duration}
                    onChange={(e) => setDraft({ ...draft, sprint_duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                  >
                    <option value={1}>1 Week per Sprint (7 Days)</option>
                    <option value={2}>2 Weeks per Sprint (14 Days - Standard)</option>
                    <option value={3}>3 Weeks per Sprint (21 Days)</option>
                    <option value={4}>4 Weeks per Sprint (28 Days / 1 Month)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project Description / Summary
                </label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Team Members */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assigned Team Members & Roles ({draft.team.length})
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add or remove members individually. All changes update task assignees.
                    </span>
                  </div>
                </div>

                {/* Inline Add Member in Step 2 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    value={draftNewMemberName}
                    onChange={(e) => setDraftNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDraftMember();
                      }
                    }}
                    placeholder="Add another member name..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <select
                    value={draftNewMemberRole}
                    onChange={(e) => setDraftNewMemberRole(e.target.value)}
                    className="sm:w-52 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Product Owner">Product Owner</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Architect">Backend Architect</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Dev">Full Stack Dev</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                    <option value="Scrum Master">Scrum Master</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddDraftMember}
                    disabled={!draftNewMemberName.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!draft) return;
                      const realignedTasks = draft.tasks.map(t => ({
                        ...t,
                        assignee_name: findBestAssigneeForTask(t, draft.team),
                      }));
                      setDraft({ ...draft, tasks: realignedTasks });
                    }}
                    title="Re-run role matching heuristic across all tasks"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1 transition shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Auto-Align Roles</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {draft.team.map((member, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between group shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{member.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{member.role}</div>
                        </div>
                      </div>
                      {draft.team.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftMember(idx)}
                          title={`Remove ${member.name}`}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition opacity-80 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Distinct Stage Breakdown Text Boxes */}
            {(['designing', 'development', 'testing', 'deployment'] as ProjectStage[]).map((stage) => {
              const meta = getStageMeta(stage);
              const Icon = meta.icon;
              const stageTasks = draft.tasks.filter(t => t.stage === stage);

              return (
                <div key={stage} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs dark:shadow-md transition-colors duration-200">
                  {/* Stage Header */}
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${meta.badgeBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {meta.label}
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            ({stageTasks.length} tasks)
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{meta.desc}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddTaskToStage(stage)}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Task</span>
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="p-4 space-y-3">
                    {stageTasks.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        No tasks in this stage yet. Click &quot;Add Task&quot; above to create one.
                      </div>
                    ) : (
                      stageTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-lg bg-slate-50/60 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-2.5"
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                              placeholder="Task title..."
                              className="flex-1 px-3 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              title="Delete task"
                              className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Timing input with quick Sprint 1-4 buttons */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                                <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="text-[10px] text-slate-400 shrink-0">Timing:</span>
                                <input
                                  type="text"
                                  value={task.timing}
                                  onChange={(e) => handleUpdateTask(task.id, 'timing', e.target.value)}
                                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="text-slate-400 text-[9px]">Quick:</span>
                                {[1, 2, 3, 4].map((sNum) => (
                                  <button
                                    key={sNum}
                                    type="button"
                                    onClick={() => handleUpdateTask(task.id, 'timing', `Sprint ${sNum} • Week ${sNum}`)}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 text-[10px] font-mono transition"
                                  >
                                    S{sNum}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Assignee select */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                              <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="text-[10px] text-slate-400 shrink-0">Assignee:</span>
                              <select
                                value={task.assignee_name}
                                onChange={(e) => handleUpdateTask(task.id, 'assignee_name', e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                              >
                                {draft.team.map((m, idx) => (
                                  <option key={idx} value={m.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Points & Priority */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                <span className="text-[10px] text-slate-400">Points:</span>
                                <select
                                  value={task.story_points}
                                  onChange={(e) => handleUpdateTask(task.id, 'story_points', Number(e.target.value))}
                                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                  <option value={1} className="bg-white dark:bg-slate-900">1 pt</option>
                                  <option value={2} className="bg-white dark:bg-slate-900">2 pts</option>
                                  <option value={3} className="bg-white dark:bg-slate-900">3 pts</option>
                                  <option value={5} className="bg-white dark:bg-slate-900">5 pts</option>
                                  <option value={8} className="bg-white dark:bg-slate-900">8 pts</option>
                                </select>
                              </div>

                              <div className="flex-1 flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                                <span className="text-[10px] text-slate-400">Priority:</span>
                                <select
                                  value={task.priority}
                                  onChange={(e) => handleUpdateTask(task.id, 'priority', e.target.value)}
                                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                  <option value="low" className="bg-white dark:bg-slate-900">Low</option>
                                  <option value="medium" className="bg-white dark:bg-slate-900">Medium</option>
                                  <option value="high" className="bg-white dark:bg-slate-900">High</option>
                                  <option value="critical" className="bg-white dark:bg-slate-900">Critical</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom Save Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setDraft(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-xs"
              >
                Cancel / Start Over
              </button>

              <button
                onClick={handleSaveAndOpen}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Project & View Board</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
