import {
  ProjectFullState,
  Project,
  TeamMember,
  Epic,
  BacklogItem,
  Sprint,
  Dependency,
  CanvasBlock,
  RiskItem,
  MilestoneItem,
  ProjectShare
} from '../types';
import { getSupabaseClient } from './supabase';

const PROJECTS_INDEX_KEY = 'sprintflow_projects_index';
const PROJECT_PREFIX = 'sprintflow_project_';

export const StorageService = {
  getProjectList(): { id: string; name: string; updated_at: string; is_demo?: boolean }[] {
    try {
      const raw = localStorage.getItem(PROJECTS_INDEX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Strictly filter out any demo/sample projects
      const realProjects = parsed.filter(p => !p.is_demo && !p.id.startsWith('demo-') && !p.name?.includes('Demo Project') && !p.name?.includes('AuraFlow'));
      if (realProjects.length !== parsed.length) {
        localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(realProjects));
      }
      return realProjects;
    } catch {
      return [];
    }
  },

  saveProjectToLocal(state: ProjectFullState) {
    try {
      localStorage.setItem(`${PROJECT_PREFIX}${state.project.id}`, JSON.stringify(state));
      const list = this.getProjectList();
      const existingIdx = list.findIndex(p => p.id === state.project.id);
      const entry = {
        id: state.project.id,
        name: state.project.name,
        updated_at: new Date().toISOString(),
        is_demo: state.project.is_demo || false
      };
      if (existingIdx >= 0) {
        list[existingIdx] = entry;
      } else {
        list.unshift(entry);
      }
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Failed to save project locally:', err);
    }
  },

  loadProjectFromLocal(projectId: string): ProjectFullState | null {
    try {
      const raw = localStorage.getItem(`${PROJECT_PREFIX}${projectId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async deleteProject(projectId: string): Promise<void> {
    try {
      // 1. Remove from local storage index and item cache
      localStorage.removeItem(`${PROJECT_PREFIX}${projectId}`);
      const list = this.getProjectList().filter(p => p.id !== projectId);
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(list));

      // 2. Also remove from Supabase database if connected
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('projects').delete().eq('id', projectId);
        } catch (supabaseErr) {
          console.warn('Supabase remote delete notice (local deletion succeeded):', supabaseErr);
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  },

  async saveFullState(state: ProjectFullState): Promise<void> {
    // 1. Always save locally immediately
    this.saveProjectToLocal(state);

    // 2. If Supabase is connected, sync asynchronously
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // Upsert project
      await supabase.from('projects').upsert({
        id: state.project.id,
        name: state.project.name,
        description: state.project.description,
        scenario: state.project.scenario,
        start_date: state.project.start_date,
        deadline: state.project.deadline,
        sprint_duration: state.project.sprint_duration,
        project_type: state.project.project_type,
        tech_stack: state.project.tech_stack,
        updated_at: new Date().toISOString(),
      });

      // Epics
      if (state.epics.length > 0) {
        await supabase.from('epics').upsert(
          state.epics.map(e => ({
            id: e.id,
            project_id: state.project.id,
            title: e.title,
            description: e.description,
            goal: e.goal,
            priority: e.priority,
            progress: e.progress,
            updated_at: new Date().toISOString()
          }))
        );
      }

      // Sprints
      if (state.sprints.length > 0) {
        await supabase.from('sprints').upsert(
          state.sprints.map(s => ({
            id: s.id,
            project_id: state.project.id,
            name: s.name,
            sprint_number: s.sprint_number,
            goal: s.goal,
            start_date: s.start_date,
            end_date: s.end_date,
            capacity: s.capacity,
            status: s.status,
            updated_at: new Date().toISOString()
          }))
        );
      }

      // Team members
      if (state.teamMembers.length > 0) {
        await supabase.from('team_members').upsert(
          state.teamMembers.map(t => ({
            id: t.id,
            project_id: state.project.id,
            name: t.name,
            role: t.role,
            skills: t.skills,
            email: t.email
          }))
        );
      }

      // Backlog Items
      if (state.backlogItems.length > 0) {
        await supabase.from('backlog_items').upsert(
          state.backlogItems.map(b => ({
            id: b.id,
            project_id: state.project.id,
            epic_id: b.epic_id,
            title: b.title,
            description: b.description,
            priority: b.priority,
            story_points: b.story_points,
            assignee_id: b.assignee_id,
            sprint_id: b.sprint_id,
            status: b.status,
            ai_suggested: b.ai_suggested,
            updated_at: new Date().toISOString()
          }))
        );
      }

      // Canvas blocks
      if (state.canvasBlocks.length > 0) {
        await supabase.from('canvas_blocks').upsert(
          state.canvasBlocks.map(c => ({
            id: c.id,
            project_id: state.project.id,
            entity_type: c.entity_type,
            entity_id: c.entity_id,
            block_type: c.block_type,
            x: c.x,
            y: c.y,
            width: c.width,
            height: c.height,
            z_index: c.z_index,
            metadata: c.metadata,
            updated_at: new Date().toISOString()
          }))
        );
      }
    } catch (err) {
      console.warn('Supabase sync notice (using local storage as primary):', err);
    }
  },

  async loadFullState(projectId: string): Promise<ProjectFullState | null> {
    // Check local first for instant responsiveness
    const local = this.loadProjectFromLocal(projectId);
    const supabase = getSupabaseClient();
    if (!supabase) return local;

    try {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (!proj) return local;

      const [
        { data: team },
        { data: epics },
        { data: sprints },
        { data: items },
        { data: deps },
        { data: blocks }
      ] = await Promise.all([
        supabase.from('team_members').select('*').eq('project_id', projectId),
        supabase.from('epics').select('*').eq('project_id', projectId),
        supabase.from('sprints').select('*').eq('project_id', projectId).order('sprint_number'),
        supabase.from('backlog_items').select('*').eq('project_id', projectId),
        supabase.from('dependencies').select('*').eq('project_id', projectId),
        supabase.from('canvas_blocks').select('*').eq('project_id', projectId),
      ]);

      const state: ProjectFullState = {
        project: {
          id: proj.id,
          name: proj.name,
          description: proj.description || '',
          scenario: proj.scenario || '',
          start_date: proj.start_date,
          deadline: proj.deadline,
          sprint_duration: proj.sprint_duration,
          project_type: proj.project_type,
          tech_stack: proj.tech_stack || [],
          created_at: proj.created_at,
          updated_at: proj.updated_at,
        },
        teamMembers: (team || []).map(t => ({
          id: t.id,
          project_id: t.project_id,
          name: t.name,
          role: t.role,
          skills: t.skills || [],
          email: t.email,
          created_at: t.created_at
        })),
        epics: (epics || []).map((e, idx) => ({
          id: e.id,
          epic_code: `EP-${String(idx + 1).padStart(2, '0')}`,
          project_id: e.project_id,
          title: e.title,
          description: e.description,
          goal: e.goal,
          priority: e.priority,
          progress: e.progress || 0,
          created_at: e.created_at,
          updated_at: e.updated_at
        })),
        sprints: (sprints || []).map(s => ({
          id: s.id,
          project_id: s.project_id,
          name: s.name,
          sprint_number: s.sprint_number,
          goal: s.goal,
          start_date: s.start_date,
          end_date: s.end_date,
          capacity: s.capacity,
          status: s.status,
          created_at: s.created_at,
          updated_at: s.updated_at
        })),
        backlogItems: (items || []).map((b, idx) => ({
          id: b.id,
          item_code: `SF-${String(idx + 101)}`,
          project_id: b.project_id,
          epic_id: b.epic_id,
          title: b.title,
          description: b.description,
          priority: b.priority,
          story_points: b.story_points,
          assignee_id: b.assignee_id,
          sprint_id: b.sprint_id,
          status: b.status,
          ai_suggested: b.ai_suggested,
          created_at: b.created_at,
          updated_at: b.updated_at
        })),
        dependencies: (deps || []).map(d => ({
          id: d.id,
          project_id: d.project_id,
          source_item_id: d.source_item_id,
          target_item_id: d.target_item_id,
          dependency_type: d.dependency_type,
          description: d.description || '',
          created_at: d.created_at
        })),
        risks: local?.risks || [],
        milestones: local?.milestones || [],
        canvasBlocks: (blocks || []).map(c => ({
          id: c.id,
          project_id: c.project_id,
          entity_type: c.entity_type,
          entity_id: c.entity_id,
          block_type: c.block_type,
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
          z_index: c.z_index,
          metadata: c.metadata || {},
          created_at: c.created_at,
          updated_at: c.updated_at
        }))
      };

      this.saveProjectToLocal(state);
      return state;
    } catch {
      return local;
    }
  }
};

export function createDefaultTeamProject(): ProjectFullState {
  const projectId = 'proj-sprintflow-main';
  const now = new Date().toISOString();

  const teamMembers: TeamMember[] = [
    { id: 'tm-rameen', project_id: projectId, name: 'Rameen', role: 'Product Owner', skills: ['Product Management', 'User Stories', 'Agile', 'UAT'], is_ai_suggested: false, created_at: now },
    { id: 'tm-zainab', project_id: projectId, name: 'Zainab', role: 'Frontend Developer', skills: ['React', 'TypeScript', 'Tailwind CSS', 'UI/UX'], is_ai_suggested: false, created_at: now },
    { id: 'tm-anees', project_id: projectId, name: 'Anees', role: 'Backend Developer', skills: ['Node.js', 'Python', 'PostgreSQL', 'REST API'], is_ai_suggested: false, created_at: now },
    { id: 'tm-moniba', project_id: projectId, name: 'Moniba', role: 'DevOps & Cloud', skills: ['Docker', 'CI/CD', 'Cloud Infrastructure', 'Kubernetes'], is_ai_suggested: false, created_at: now },
  ];

  const epics: Epic[] = [
    { id: 'epic-1', epic_code: 'EP-01', project_id: projectId, title: 'UI/UX Design & Requirement Mapping', description: 'User stories, UX flows and frontend design system.', goal: 'Deliver high-fidelity wireframes and clear acceptance criteria.', priority: 'high', progress: 15, is_ai_suggested: false, created_at: now, updated_at: now },
    { id: 'epic-2', epic_code: 'EP-02', project_id: projectId, title: 'Core Backend & API Services', description: 'Database schema, authentication, and core business endpoints.', goal: 'Deliver robust database models and fast REST APIs.', priority: 'critical', progress: 10, is_ai_suggested: false, created_at: now, updated_at: now },
    { id: 'epic-3', epic_code: 'EP-03', project_id: projectId, title: 'Frontend Client & Interactive Experience', description: 'Responsive screens, state engine, and design integration.', goal: 'Ensure accessible, responsive user journey.', priority: 'high', progress: 0, is_ai_suggested: false, created_at: now, updated_at: now },
    { id: 'epic-4', epic_code: 'EP-04', project_id: projectId, title: 'DevOps, CI/CD & Cloud Infrastructure', description: 'Containerization, automated pipelines, and cloud release.', goal: 'Zero-downtime automated deployment.', priority: 'high', progress: 0, is_ai_suggested: false, created_at: now, updated_at: now },
  ];

  const sprints: Sprint[] = [
    { id: 'sprint-1', project_id: projectId, name: 'Sprint 1: Architecture & Scaffolding', sprint_number: 1, goal: 'Validate user requirements, design system, database models, and setup pipeline.', capacity: 20, status: 'active', start_date: now.split('T')[0], end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], created_at: now, updated_at: now },
    { id: 'sprint-2', project_id: projectId, name: 'Sprint 2: Features, Testing & Launch', sprint_number: 2, goal: 'Complete UI features, automated test suite, and cloud launch.', capacity: 22, status: 'planned', start_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], end_date: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0], created_at: now, updated_at: now },
  ];

  const backlogItems: BacklogItem[] = [
    // Designing -> Rameen & Zainab
    { id: 'task-1', item_code: 'SF-101', project_id: projectId, epic_id: 'epic-1', sprint_id: 'sprint-1', title: 'User Story Mapping & Product Acceptance Criteria', description: 'Define core personas, user journeys, and acceptance requirements.', stage: 'designing', timing: 'Sprint 1 • Days 1-3', priority: 'high', story_points: 3, assignee_id: 'tm-rameen', status: 'in_progress', ai_suggested: false, created_at: now, updated_at: now },
    { id: 'task-2', item_code: 'SF-102', project_id: projectId, epic_id: 'epic-1', sprint_id: 'sprint-1', title: 'Information Architecture & Wireframe Specifications', description: 'Create user flow diagrams, screen hierarchy, and wireframes.', stage: 'designing', timing: 'Sprint 1 • Days 2-4', priority: 'high', story_points: 3, assignee_id: 'tm-rameen', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },
    { id: 'task-3', item_code: 'SF-103', project_id: projectId, epic_id: 'epic-1', sprint_id: 'sprint-1', title: 'High-Fidelity UI Design & Component System', description: 'Establish typography scale, color tokens, and reusable UI components.', stage: 'designing', timing: 'Sprint 1 • Days 4-6', priority: 'high', story_points: 5, assignee_id: 'tm-zainab', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },

    // Development -> Anees & Zainab
    { id: 'task-4', item_code: 'SF-104', project_id: projectId, epic_id: 'epic-2', sprint_id: 'sprint-1', title: 'Database Schema & Migration Pipeline', description: 'Design relational tables, foreign key constraints, indexes, and migrations.', stage: 'development', timing: 'Sprint 1 • Days 3-6', priority: 'critical', story_points: 5, assignee_id: 'tm-anees', status: 'in_progress', ai_suggested: false, created_at: now, updated_at: now },
    { id: 'task-5', item_code: 'SF-105', project_id: projectId, epic_id: 'epic-2', sprint_id: 'sprint-1', title: 'REST API Endpoints & Business Logic', description: 'Implement API controllers, validation middlewares, and service layer.', stage: 'development', timing: 'Sprint 1 • Days 6-10', priority: 'high', story_points: 5, assignee_id: 'tm-anees', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },
    { id: 'task-6', item_code: 'SF-106', project_id: projectId, epic_id: 'epic-3', sprint_id: 'sprint-2', title: 'Responsive Client UI & Interactive State Engine', description: 'Build interactive screens with responsive layouts and state synchronization.', stage: 'development', timing: 'Sprint 2 • Days 1-5', priority: 'high', story_points: 5, assignee_id: 'tm-zainab', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },

    // Testing -> Anees & Rameen
    { id: 'task-7', item_code: 'SF-107', project_id: projectId, epic_id: 'epic-2', sprint_id: 'sprint-2', title: 'Automated Unit, Integration & API Test Suite', description: 'Write comprehensive backend unit and endpoint tests to ensure reliability.', stage: 'testing', timing: 'Sprint 2 • Days 4-7', priority: 'medium', story_points: 3, assignee_id: 'tm-anees', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },
    { id: 'task-8', item_code: 'SF-108', project_id: projectId, epic_id: 'epic-1', sprint_id: 'sprint-2', title: 'User Acceptance Testing (UAT) & UX Verification', description: 'Verify complete user journeys against agreed acceptance criteria.', stage: 'testing', timing: 'Sprint 2 • Days 7-9', priority: 'high', story_points: 3, assignee_id: 'tm-rameen', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },

    // Deployment -> Moniba
    { id: 'task-9', item_code: 'SF-109', project_id: projectId, epic_id: 'epic-4', sprint_id: 'sprint-1', title: 'CI/CD Pipeline Automation & Containerization', description: 'Configure Docker images, GitHub Actions workflows, and automated checks.', stage: 'deployment', timing: 'Sprint 1 • Days 5-8', priority: 'high', story_points: 3, assignee_id: 'tm-moniba', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },
    { id: 'task-10', item_code: 'SF-110', project_id: projectId, epic_id: 'epic-4', sprint_id: 'sprint-2', title: 'Production Cloud Infrastructure & Live Deployment', description: 'Provision cloud environments, SSL certificates, health monitoring, and DNS.', stage: 'deployment', timing: 'Sprint 2 • Days 8-10', priority: 'critical', story_points: 5, assignee_id: 'tm-moniba', status: 'todo', ai_suggested: false, created_at: now, updated_at: now },
  ];

  return {
    project: {
      id: projectId,
      name: 'SprintFlow Agile Hub',
      description: 'Production agile delivery tracking with automated sprints, role matching, and phase boards.',
      scenario: 'Multi-role agile delivery board with dedicated Designing, Development, Testing, and Deployment phases.',
      start_date: now.split('T')[0],
      deadline: undefined,
      sprint_duration: 2,
      project_type: 'Full-Stack Web System',
      tech_stack: ['TypeScript', 'React', 'Python', 'Tailwind CSS', 'PostgreSQL'],
      created_at: now,
      updated_at: now,
    },
    teamMembers,
    epics,
    sprints,
    backlogItems,
    dependencies: [],
    risks: [],
    milestones: [],
    canvasBlocks: []
  };
}

export const storageService = {
  ...StorageService,
  getActiveProject(): ProjectFullState | null {
    const list = StorageService.getProjectList();
    if (list.length > 0) {
      const existing = StorageService.loadProjectFromLocal(list[0].id);
      if (existing) return existing;
    }
    const hasInitialized = localStorage.getItem('sprintflow_initialized');
    if (!hasInitialized) {
      localStorage.setItem('sprintflow_initialized', 'true');
      const defaultProject = createDefaultTeamProject();
      StorageService.saveProjectToLocal(defaultProject);
      return defaultProject;
    }
    return null;
  },
  async deleteProject(projectId: string): Promise<void> {
    await StorageService.deleteProject(projectId);
  },
  saveProject(state: ProjectFullState) {
    StorageService.saveProjectToLocal(state);
    StorageService.saveFullState(state).catch(() => {});
  }
};
