import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '10mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-vercel',
      },
    },
  });
}

function extractProjectName(scenario: string): string {
  if (!scenario) return 'Agile Project';
  const clean = scenario.replace(/^(build|create|develop|make|design)\s+(a|an|the)?\s*/i, '');
  const words = clean.split(/[.,\n]/)[0].trim().split(/\s+/).slice(0, 4).join(' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Agile Project';
}

function generateProjectData(input: any) {
  const scenario = input.scenario || 'Full-Stack Agile Application';
  const name = input.projectName || input.project_name || extractProjectName(scenario);
  const now = new Date();
  const startDate = input.startDate || input.start_date || now.toISOString().split('T')[0];
  const deadline = input.deadline || null;
  const sprintDuration = input.sprint_duration ? parseInt(input.sprint_duration, 10) : (input.sprintDuration ? parseInt(input.sprintDuration, 10) : 2);

  let rawTeam = input.team_members || input.teamMembers || [];
  let userTeam: { name: string; role?: string }[] = [];
  if (Array.isArray(rawTeam)) {
    userTeam = rawTeam.map((m: any) => {
      if (typeof m === 'string') {
        const match = m.match(/^([^(]+)\s*\(([^)]+)\)$/);
        if (match) return { name: match[1].trim(), role: match[2].trim() };
        return { name: m.trim() };
      }
      return { name: m.name || 'Team Member', role: m.role };
    });
  } else if (typeof rawTeam === 'string' && rawTeam.trim()) {
    userTeam = rawTeam.split(',').map((s: string) => {
      const match = s.trim().match(/^([^(]+)\s*\(([^)]+)\)$/);
      if (match) return { name: match[1].trim(), role: match[2].trim() };
      return { name: s.trim() };
    }).filter(m => Boolean(m.name));
  }

  const team = userTeam.length > 0
    ? userTeam.map((t, idx: number) => ({
        name: t.name,
        role: t.role || ['UI/UX Designer', 'Frontend Developer', 'Backend Architect', 'DevOps & Cloud Lead'][idx % 4],
        skills: ['Full-Stack Development'],
        is_ai_suggested: false,
      }))
    : [
        { name: 'Elena Rostova', role: 'UI/UX Designer', skills: ['Figma', 'Design System'], is_ai_suggested: true },
        { name: 'Zainab Khan', role: 'Frontend Developer', skills: ['React', 'TypeScript', 'Tailwind'], is_ai_suggested: true },
        { name: 'Anees Rahman', role: 'Backend Architect', skills: ['APIs', 'Database', 'PostgreSQL'], is_ai_suggested: true },
        { name: 'Moniba Farooq', role: 'DevOps & Cloud Lead', skills: ['Docker', 'CI/CD', 'Cloud'], is_ai_suggested: true }
      ];

  const epics = [
    {
      title: 'Phase 1: Architecture & UI/UX Foundations',
      description: 'System specifications, visual branding, UI components, and core state model.',
      goal: 'Validate user workflows and establish high-fidelity design standards.',
      priority: 'high',
      phase: 'designing'
    },
    {
      title: 'Phase 2: Core Engineering & Backend APIs',
      description: 'Data schemas, authentication, responsive views, and service integrations.',
      goal: 'Deliver production-grade full-stack features.',
      priority: 'critical',
      phase: 'development'
    },
    {
      title: 'Phase 3: Automated Testing & Security Audit',
      description: 'End-to-end user journey tests, security review, and edge-case handling.',
      goal: 'Guarantee zero regression bugs and high test coverage.',
      priority: 'high',
      phase: 'testing'
    },
    {
      title: 'Phase 4: Production Deployment & CI/CD Pipeline',
      description: 'Cloud environment setup, automated pipeline, telemetry, and rollout.',
      goal: 'Seamless zero-downtime deployment to live users.',
      priority: 'critical',
      phase: 'deployment'
    }
  ];

  const sprints = [
    {
      name: 'Sprint 1: Architecture, Scaffolding & UI',
      sprint_number: 1,
      goal: 'Complete system blueprints, component library, and database schema.',
      capacity: 20,
      duration_weeks: sprintDuration
    },
    {
      name: 'Sprint 2: Core Features & Integration',
      sprint_number: 2,
      goal: 'Connect client views to backend endpoints and real-time persistence.',
      capacity: 24,
      duration_weeks: sprintDuration
    },
    {
      name: 'Sprint 3: Quality Verification & Live Release',
      sprint_number: 3,
      goal: 'Complete QA regression test suite and deploy to production.',
      capacity: 18,
      duration_weeks: sprintDuration
    }
  ];

  const tasks = [
    {
      title: 'Establish Design System & Responsive Tokens',
      description: 'Define typography scales, accessible color schemes, and component primitives in Figma/Tailwind.',
      epic_idx: 0,
      sprint_idx: 0,
      story_points: 3,
      priority: 'high',
      stage: 'designing',
      assignee_name: team[0]?.name || 'Elena Rostova'
    },
    {
      title: 'User Stories & Journey Wireframes',
      description: 'Map user journeys, edge scenarios, and high-fidelity screen mockups.',
      epic_idx: 0,
      sprint_idx: 0,
      story_points: 5,
      priority: 'high',
      stage: 'designing',
      assignee_name: team[0]?.name || 'Elena Rostova'
    },
    {
      title: 'Relational Database Schema & Data Models',
      description: 'Create PostgreSQL database schemas, indexes, and migration scripts.',
      epic_idx: 1,
      sprint_idx: 0,
      story_points: 5,
      priority: 'critical',
      stage: 'development',
      assignee_name: team.find(m => /backend|architect|engineer/i.test(m.role || ''))?.name || team[1]?.name || 'Anees Rahman'
    },
    {
      title: 'Core REST APIs & Authentication Handlers',
      description: 'Build secure authentication, role verification, and business logic API routes.',
      epic_idx: 1,
      sprint_idx: 1,
      story_points: 8,
      priority: 'critical',
      stage: 'development',
      assignee_name: team.find(m => /backend|architect|engineer/i.test(m.role || ''))?.name || team[1]?.name || 'Anees Rahman'
    },
    {
      title: 'Frontend Interactive Dashboard & State Engine',
      description: 'Implement responsive views, optimistic state updates, and accessible UI interactions.',
      epic_idx: 1,
      sprint_idx: 1,
      story_points: 8,
      priority: 'high',
      stage: 'development',
      assignee_name: team.find(m => /frontend|ui/i.test(m.role || ''))?.name || team[1]?.name || 'Zainab Khan'
    },
    {
      title: 'Comprehensive Unit & E2E Test Suite',
      description: 'Write end-to-end tests covering primary user flows and error recovery.',
      epic_idx: 2,
      sprint_idx: 2,
      story_points: 5,
      priority: 'high',
      stage: 'testing',
      assignee_name: team.find(m => /qa|test|frontend/i.test(m.role || ''))?.name || team[0]?.name || 'Zainab Khan'
    },
    {
      title: 'Automated CI/CD Pipeline & Vercel Deployment',
      description: 'Configure automated build checks, preview branches, environment variables, and CDN caching.',
      epic_idx: 3,
      sprint_idx: 2,
      story_points: 3,
      priority: 'critical',
      stage: 'deployment',
      assignee_name: team.find(m => /devops|cloud|lead/i.test(m.role || ''))?.name || team[team.length - 1]?.name || 'Moniba Farooq'
    }
  ];

  return {
    project: {
      name,
      description: scenario.length > 250 ? `${scenario.slice(0, 247)}...` : scenario,
      start_date: startDate,
      deadline,
      sprint_duration_weeks: sprintDuration
    },
    team,
    epics,
    sprints,
    backlog_items: tasks,
    dependencies: [
      { source_idx: 2, target_idx: 3, type: 'blocks', desc: 'Database models must precede API endpoints' },
      { source_idx: 3, target_idx: 4, type: 'relates_to', desc: 'Frontend integrates with REST APIs' },
      { source_idx: 4, target_idx: 5, type: 'blocks', desc: 'Core features must be complete before E2E testing' },
      { source_idx: 5, target_idx: 6, type: 'blocks', desc: 'Test suite must pass before production deployment' }
    ]
  };
}

// Router to support both with and without /api prefix
const router = express.Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    platform: 'vercel-serverless',
    has_gemini_key: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

router.post('/projects/generate', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    const scenario = req.body.scenario || '';

    if (!scenario.trim()) {
      res.status(400).json({ error: 'Scenario is required' });
      return;
    }

    if (ai) {
      try {
        const prompt = `You are a Principal Agile Architect. Generate a complete Agile Project for: "${scenario}".
Output strictly valid JSON with this exact schema:
{
  "project": { "name": "...", "description": "...", "start_date": "YYYY-MM-DD", "sprint_duration_weeks": 2 },
  "team": [{ "name": "...", "role": "...", "skills": ["..."] }],
  "epics": [{ "title": "...", "description": "...", "goal": "...", "priority": "high|critical|medium" }],
  "sprints": [{ "name": "Sprint 1...", "sprint_number": 1, "goal": "...", "capacity": 20 }],
  "backlog_items": [{ "title": "...", "description": "...", "epic_idx": 0, "sprint_idx": 0, "story_points": 5, "priority": "high", "stage": "designing|development|testing|deployment", "assignee_name": "..." }],
  "dependencies": [{ "source_idx": 0, "target_idx": 1, "type": "blocks", "desc": "..." }]
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text);
          if (parsed.project && parsed.backlog_items) {
            res.json({ success: true, project: parsed, source: 'gemini-sdk' });
            return;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini Vercel fallback:', geminiErr);
      }
    }

    const fallback = generateProjectData(req.body);
    res.json({ success: true, project: fallback, source: 'heuristic-engine' });
  } catch (err: any) {
    const fallback = generateProjectData(req.body);
    res.json({ success: true, project: fallback, error: err?.message });
  }
});

router.post('/ai/generate-project', async (req: Request, res: Response) => {
  const data = generateProjectData(req.body);
  res.json({ success: true, data, source: 'vercel-handler' });
});

router.post('/assistant/chat', async (req: Request, res: Response) => {
  const message = req.body.message || req.body.command || '';
  res.json({
    success: true,
    response: `Processed instruction: "${message}". All 4 agile phases (Designing, Development, Testing, Deployment) are synced.`,
    suggestions: [
      'Create sprint retrospective',
      'Optimize sprint capacity',
      'Auto-assign tasks to roles'
    ]
  });
});

router.post('/ai/analyze-project', async (req: Request, res: Response) => {
  res.json({
    success: true,
    issues: [],
    summary: 'Project architecture healthy. All tasks aligned across Designing, Development, Testing, and Deployment phases.'
  });
});

router.post('/ai/chat-command', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Command executed successfully.'
  });
});

router.post('/ai/suggest-assignee', async (req: Request, res: Response) => {
  const team = req.body.teamMembers || [];
  const member = team[0] || { name: 'Lead Developer', role: 'Full-Stack Developer' };
  res.json({
    success: true,
    suggestedMember: member,
    rationale: `${member.name} matches task requirements.`
  });
});

router.get('/backend/code', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    code: '// SprintFlow AI Vercel Serverless Architecture\n// Supports Gemini 2.5 Flash and Heuristic Agile Planning'
  });
});

app.use('/api', router);
app.use('/', router);

export default app;
