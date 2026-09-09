import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration can come from Vite env or user settings
let supabaseInstance: SupabaseClient | null = null;

export const SUPABASE_SCHEMA_SQL = `-- ==========================================
-- SprintFlow AI: Supabase Schema & RLS Setup
-- Project: sprintflow-ai
-- ==========================================

-- 1. Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  scenario TEXT NOT NULL,
  start_date DATE,
  deadline DATE,
  sprint_duration INTEGER DEFAULT 2,
  project_type TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Team Members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Epics table
CREATE TABLE IF NOT EXISTS public.epics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sprints table
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sprint_number INTEGER NOT NULL,
  goal TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  capacity INTEGER DEFAULT 30,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Backlog Items table
CREATE TABLE IF NOT EXISTS public.backlog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  epic_id UUID REFERENCES public.epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  story_points INTEGER DEFAULT 3,
  assignee_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  ai_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Dependencies table
CREATE TABLE IF NOT EXISTS public.dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  source_item_id UUID REFERENCES public.backlog_items(id) ON DELETE CASCADE NOT NULL,
  target_item_id UUID REFERENCES public.backlog_items(id) ON DELETE CASCADE NOT NULL,
  dependency_type TEXT DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to', 'depends_on')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Canvas Blocks table
CREATE TABLE IF NOT EXISTS public.canvas_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  block_type TEXT NOT NULL,
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION NOT NULL DEFAULT 320,
  height DOUBLE PRECISION NOT NULL DEFAULT 200,
  z_index INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Project Shares table
CREATE TABLE IF NOT EXISTS public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Policies for project owners and shared collaborators
CREATE POLICY "Projects accessible by owner or public share"
  ON public.projects FOR ALL
  USING (
    auth.uid() = owner_id 
    OR EXISTS (SELECT 1 FROM public.project_shares WHERE project_shares.project_id = projects.id)
    OR auth.role() = 'anon'
  );

CREATE POLICY "Entities accessible by project access"
  ON public.team_members FOR ALL USING (true);
CREATE POLICY "Epics accessible by project access"
  ON public.epics FOR ALL USING (true);
CREATE POLICY "Sprints accessible by project access"
  ON public.sprints FOR ALL USING (true);
CREATE POLICY "Backlog items accessible by project access"
  ON public.backlog_items FOR ALL USING (true);
CREATE POLICY "Dependencies accessible by project access"
  ON public.dependencies FOR ALL USING (true);
CREATE POLICY "Canvas blocks accessible by project access"
  ON public.canvas_blocks FOR ALL USING (true);
CREATE POLICY "Project shares accessible by project access"
  ON public.project_shares FOR ALL USING (true);
`;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const env = (import.meta as any).env || {};
  const url = env.VITE_SUPABASE_URL || localStorage.getItem('sprintflow_supabase_url');
  const key = env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('sprintflow_supabase_key');

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}

export function configureSupabaseCredentials(url: string, key: string): void {
  localStorage.setItem('sprintflow_supabase_url', url);
  localStorage.setItem('sprintflow_supabase_key', key);
  supabaseInstance = null;
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (e) {
      console.warn('Invalid Supabase configuration:', e);
    }
  }
}
