export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type SprintStatus = 'planned' | 'active' | 'completed';
export type DependencyType = 'blocks' | 'relates_to' | 'depends_on';
export type SharePermission = 'view' | 'edit';

export type EntityType =
  | 'project'
  | 'goal'
  | 'requirement'
  | 'milestone'
  | 'epic'
  | 'backlog_item'
  | 'sprint'
  | 'team_member'
  | 'risk'
  | 'note'
  | 'progress'
  | 'workload';

export type BlockType =
  | 'project_overview'
  | 'epic'
  | 'sprint'
  | 'product_backlog'
  | 'team_roster'
  | 'risk_matrix'
  | 'analytics'
  | 'task_card'
  | 'milestone'
  | 'note';

export interface Project {
  id: string;
  owner_id?: string;
  name: string;
  description: string;
  scenario: string;
  start_date: string | null;
  deadline: string | null;
  sprint_duration: number | null; // e.g. 2 weeks
  project_type: string | null;
  tech_stack: string[];
  goals?: string[];
  requirements?: string[];
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export interface TeamMember {
  id: string;
  project_id: string;
  name: string;
  role: string;
  skills: string[];
  email?: string;
  created_at: string;
  is_ai_suggested?: boolean;
}

export interface Epic {
  id: string;
  epic_code: string; // e.g. "EP-01"
  project_id: string;
  title: string;
  description: string;
  goal: string;
  priority: Priority;
  progress: number;
  created_at: string;
  updated_at: string;
  is_ai_suggested?: boolean;
}

export type ProjectStage = 'designing' | 'development' | 'testing' | 'deployment';

export interface BacklogItem {
  id: string;
  item_code: string; // e.g. "SF-101"
  project_id: string;
  epic_id: string | null;
  title: string;
  description: string;
  stage?: ProjectStage;
  timing?: string;
  assignee_name?: string;
  priority: Priority;
  story_points: number;
  assignee_id: string | null;
  sprint_id: string | null;
  status: TaskStatus;
  ai_suggested: boolean;
  ai_suggestion_rationale?: string;
  suggested_assignee_id?: string | null;
  acceptance_criteria?: string[];
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  sprint_number: number;
  goal: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number; // in story points
  status: SprintStatus;
  created_at: string;
  updated_at: string;
  is_ai_suggested?: boolean;
}

export interface Dependency {
  id: string;
  project_id: string;
  source_item_id: string;
  target_item_id: string;
  dependency_type: DependencyType;
  description: string;
  created_at: string;
}

export interface RiskItem {
  id: string;
  project_id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  mitigation: string;
  created_at: string;
}

export interface MilestoneItem {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

export interface CanvasBlock {
  id: string;
  project_id: string;
  entity_type?: EntityType;
  entity_id: string; // References Project, Epic, BacklogItem, Sprint, etc.
  block_type: BlockType | string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index?: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectShare {
  id: string;
  project_id: string;
  share_token: string;
  permission: SharePermission;
  created_by?: string;
  created_at: string;
  expires_at?: string;
}

export interface GenerateProjectPayload {
  scenario: string;
  project_name?: string;
  project_type?: string;
  start_date?: string;
  deadline?: string;
  sprint_duration?: number;
  team_members?: string;
  tech_stack?: string;
}

export interface AIAnalysisIssue {
  id: string;
  issue: string;
  impact: string;
  recommendation: string;
  action_type?: 'MOVE_TASK' | 'ASSIGN_TASK' | 'INCREASE_CAPACITY' | 'SET_DEADLINE' | 'SPLIT_STORY' | 'CUSTOM';
  action_payload?: Record<string, any>;
  status?: 'pending' | 'applied' | 'ignored';
}

export interface ProjectFullState {
  project: Project;
  teamMembers: TeamMember[];
  epics: Epic[];
  backlogItems: BacklogItem[];
  sprints: Sprint[];
  dependencies: Dependency[];
  risks: RiskItem[];
  milestones: MilestoneItem[];
  canvasBlocks: CanvasBlock[];
  shares?: ProjectShare[];
}
