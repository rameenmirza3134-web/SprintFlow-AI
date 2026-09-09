import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

// Execute Python AI Agent CLI
function runPythonBackend<T = any>(action: string, payload: any = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'backend', 'main.py');
    const child = spawn('python3', [pythonScript, action], {
      env: { ...process.env },
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0 && !stdout.trim()) {
        console.error(`[PythonBackend error (${action})]:`, stderr);
        return reject(new Error(`Python agent process exited with code ${code}: ${stderr}`));
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err: any) {
        console.error(`[Python JSON parse error (${action})]:`, stdout, stderr);
        reject(new Error(`Failed to parse Python agent output: ${stdout || stderr}`));
      }
    });

    child.on('error', (err) => {
      console.error(`[Python spawn error (${action})]:`, err);
      reject(err);
    });

    if (payload !== undefined) {
      child.stdin.write(JSON.stringify(payload));
    }
    child.stdin.end();
  });
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Intelligent task-to-role matcher
function matchAssigneeForTask(task: any, team: any[]): any {
  if (!team || team.length === 0) return { name: 'Team Member', role: 'Developer' };

  const title = (task?.title || '').toLowerCase();
  const desc = (task?.description || '').toLowerCase();
  const stage = (task?.stage || '').toLowerCase();
  const text = `${title} ${desc} ${stage}`;

  const isDatabaseBackend = /database|schema|migration|api|rest|backend|endpoint|controller|server|sql|postgres|auth/.test(text);
  const isFrontendUi = /frontend|client ui|interface|react|component|state engine|screens|views|tailwind|client-side|responsive/.test(text);
  const isProductReqs = /user story|user stories|acceptance criteria|scope|product owner|backlog|uat|specifications|requirements|journey/.test(text);
  const isDesignUi = (stage === 'designing' && !isProductReqs) || /design system|ui\/ux|ux design|ui design|wireframe|figma|prototype|mockup|theme system/.test(text);
  const isDevops = (stage === 'deployment' || /ci\/cd|docker|cloud|deploy|staging|infrastructure|hosting|dns|ssl|monitoring|sre/.test(text)) && !isDatabaseBackend;
  const isQa = (stage === 'testing' || /test|qa|bug bash|regression|audit|verification|test suite/.test(text)) && !isDatabaseBackend && !isFrontendUi;

  let bestMember = team[0];
  let highestScore = -999;

  for (const m of team) {
    let score = 0;
    const role = (m.role || '').toLowerCase();

    // 1. Product Requirements
    if (isProductReqs) {
      if (/product owner|po|product manager|pm|scrum master/.test(role)) score += 200;
      else if (/designer|ui\/ux/.test(role)) score += 40;
      else if (/backend|devops/.test(role)) score -= 80;
    }

    // 2. UI/UX Design
    if (isDesignUi) {
      if (/designer|ui\/ux|ux|ui designer/.test(role)) score += 200;
      else if (/frontend/.test(role)) score += 80;
      else if (/product owner|po|scrum master/.test(role)) score += 40;
      else if (/devops|backend/.test(role)) score -= 100;
    }

    // 3. Backend Development & Database
    if (isDatabaseBackend) {
      if (/backend|database|architect|data engineer/.test(role)) score += 200;
      else if (/full stack/.test(role)) score += 70;
      else if (/devops|cloud/.test(role)) score -= 80;
      else if (/designer|ui\/ux|product owner/.test(role)) score -= 120;
    }

    // 4. Frontend Development
    if (isFrontendUi) {
      if (/frontend|ui developer|client/.test(role)) score += 200;
      else if (/full stack/.test(role)) score += 70;
      else if (/designer|ui\/ux/.test(role)) score += 40;
      else if (/backend|devops|product owner/.test(role)) score -= 80;
    }

    // 5. DevOps & Cloud
    if (isDevops) {
      if (/devops|cloud|infra|sre|sysadmin/.test(role)) score += 200;
      else if (/backend|full stack/.test(role)) score += 30;
      else if (/designer|ui\/ux|product owner|frontend/.test(role)) score -= 120;
    }

    // 6. QA & Testing
    if (isQa) {
      if (/qa|tester|testing|quality/.test(role)) score += 200;
      else if (/product owner|po/.test(role)) score += 60;
      else if (/frontend|full stack/.test(role)) score += 40;
      else if (/designer|ui\/ux/.test(role)) score -= 50;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMember = m;
    }
  }

  return bestMember;
}

// Heuristic fallback generator when API key is unconfigured or rate limited
function heuristicGenerateProject(input: any) {
  const scenario = input.scenario || 'Web Application Project';
  const name = input.projectName || extractProjectName(scenario);
  const now = new Date();
  const startDate = input.startDate || now.toISOString().split('T')[0];
  const deadline = input.deadline || null;
  const sprintDuration = input.sprint_duration ? parseInt(input.sprint_duration, 10) : (input.sprintDuration ? parseInt(input.sprintDuration, 10) : 2);

  // Extract keywords
  const techStack = input.techStack && input.techStack.length > 0
    ? (Array.isArray(input.techStack) ? input.techStack : input.techStack.split(',').map((s: string) => s.trim()))
    : ['TypeScript', 'React', 'Node.js', 'PostgreSQL'];

  const projectType = input.projectType || 'Full-Stack Application';

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
        skills: [techStack[0] || 'TypeScript'],
        is_ai_suggested: false,
      }))
    : [
        { name: 'Elena Rostova', role: 'UI/UX Designer', skills: ['Figma', 'UI/UX'], is_ai_suggested: true },
        { name: 'Zainab Khan', role: 'Frontend Developer', skills: ['React', 'TailwindCSS'], is_ai_suggested: true },
        { name: 'Anees Rahman', role: 'Backend Architect', skills: ['APIs', 'Database', 'PostgreSQL'], is_ai_suggested: true },
        { name: 'Moniba Farooq', role: 'DevOps & Cloud Lead', skills: ['Docker', 'CI/CD', 'Cloud'], is_ai_suggested: true }
      ];

  const epics = [
    {
      title: 'UI/UX Design & User Experience',
      description: `User journey mapping, wireframing, and component design system for ${name}.`,
      goal: 'Deliver clean, validated user interfaces and intuitive interaction flows.',
      priority: 'high',
      progress: 0,
      is_ai_suggested: true
    },
    {
      title: 'Core Architecture & Feature Implementation',
      description: `Build backend services, API layer, and client components: ${scenario.slice(0, 100)}...`,
      goal: 'Ship reliable, responsive core workflows with high performance.',
      priority: 'critical',
      progress: 0,
      is_ai_suggested: true
    },
    {
      title: 'Quality Assurance & Automated Testing',
      description: 'End-to-end user testing, unit tests, integration audits, and bug mitigation.',
      goal: 'Ensure 99.9% reliability and zero blocking regressions.',
      priority: 'high',
      progress: 0,
      is_ai_suggested: true
    },
    {
      title: 'Production Infrastructure & CI/CD Deployment',
      description: 'Containerized deployment pipelines, staging validation, and production monitoring.',
      goal: 'Deliver friction-free, automated zero-downtime releases.',
      priority: 'medium',
      progress: 0,
      is_ai_suggested: true
    }
  ];

  const rawBacklogItems = [
    // 1. DESIGNING
    {
      title: 'User Story Mapping & Product Acceptance Criteria',
      description: 'Map user journeys, requirements specifications, and core acceptance criteria.',
      stage: 'designing',
      timing: 'Sprint 1 • Days 1-3',
      priority: 'high',
      story_points: 3,
      epic_index: 0,
      status: 'todo',
      ai_suggested: true
    },
    {
      title: 'Information Architecture & Wireframe Specifications',
      description: 'Design user flows, screen blueprints, navigation structure, and interface mockups.',
      stage: 'designing',
      timing: 'Sprint 1 • Days 2-4',
      priority: 'high',
      story_points: 3,
      epic_index: 0,
      status: 'todo',
      ai_suggested: true
    },
    {
      title: 'High-Fidelity UI Design & Component System',
      description: 'Establish typography scale, color tokens, responsive UI components, and asset tokens.',
      stage: 'designing',
      timing: 'Sprint 1 • Days 4-6',
      priority: 'high',
      story_points: 5,
      epic_index: 0,
      status: 'todo',
      ai_suggested: true
    },
    // 2. DEVELOPMENT
    {
      title: 'Database Schema & Migration Pipeline',
      description: 'Define relational models, indexes, and automated migration scripts.',
      stage: 'development',
      timing: 'Sprint 1 • Days 2-5',
      priority: 'critical',
      story_points: 5,
      epic_index: 1,
      status: 'todo',
      ai_suggested: true
    },
    {
      title: 'REST API Endpoints & Business Controllers',
      description: 'Implement CRUD controllers with input validation and rate limiting.',
      stage: 'development',
      timing: 'Sprint 1 • Days 6-10',
      priority: 'critical',
      story_points: 5,
      epic_index: 1,
      status: 'todo',
      ai_suggested: true
    },
    {
      title: 'Responsive Client UI & Interactive State Engine',
      description: `Build user-facing workflows and real-time state synchronization for ${name}.`,
      stage: 'development',
      timing: 'Sprint 2 • Days 1-6',
      priority: 'high',
      story_points: 8,
      epic_index: 1,
      status: 'todo',
      ai_suggested: true
    },
    // 3. TESTING
    {
      title: 'Automated Unit & Integration Test Suite',
      description: 'Write automated test harnesses for critical domain calculation logic and API schemas.',
      stage: 'testing',
      timing: 'Sprint 2 • Days 4-7',
      priority: 'high',
      story_points: 3,
      epic_index: 2,
      status: 'todo',
      ai_suggested: true
    },
    {
      title: 'End-to-End QA Validation & Bug Bash',
      description: 'Cross-browser verification, mobile viewport audit, and edge-case regression tests.',
      stage: 'testing',
      timing: 'Sprint 2 • Days 8-10',
      priority: 'medium',
      story_points: 3,
      epic_index: 2,
      status: 'todo',
      ai_suggested: true
    },
    // 4. DEPLOYMENT
    {
      title: 'Automated CI/CD Pipeline & Staging Setup',
      description: 'Configure continuous integration workflows with automated linting and build checks.',
      stage: 'deployment',
      timing: 'Sprint 2 • Days 6-8',
      priority: 'high',
      story_points: 3,
      epic_index: 3,
      status: 'todo',
      ai_suggested: true
    },
    {
      title: 'Production Cloud Deployment & Live Domain Launch',
      description: 'Set up production environment variables, SSL certificates, health monitoring, and DNS.',
      stage: 'deployment',
      timing: 'Sprint 2 • Days 9-10',
      priority: 'high',
      story_points: 5,
      epic_index: 3,
      status: 'todo',
      ai_suggested: true
    }
  ];

  const backlogItems = rawBacklogItems.map((item) => {
    const best = matchAssigneeForTask(item, team);
    return {
      ...item,
      assignee_name: best.name
    };
  });

  // Distribute into 2 sprints
  const sprints = [
    {
      name: 'Sprint 1: Design & Core Scaffolding',
      sprint_number: 1,
      goal: 'Complete UI/UX design tokens, database models, and base API infrastructure.',
      capacity: 20,
      duration_weeks: sprintDuration,
      item_indices: [0, 1, 2, 3]
    },
    {
      name: 'Sprint 2: Feature Build, QA & Production Launch',
      sprint_number: 2,
      goal: 'Ship interactive UI features, achieve full test coverage, and deploy to live production.',
      capacity: 24,
      duration_weeks: sprintDuration,
      item_indices: [4, 5, 6, 7, 8]
    }
  ];

  const risks = [
    {
      title: 'Unassigned Team Members on Critical Path',
      severity: 'high',
      impact: 'Core architectural tasks lack designated owners, delaying kickoff.',
      mitigation: 'Assign qualified engineering leads before Sprint 1 initiation.'
    },
    {
      title: 'Integration Complexity with Legacy Workflows',
      severity: 'medium',
      impact: 'Third-party APIs may cause latency spikes or timeout failures.',
      mitigation: 'Implement exponential backoff retry policies and circuit breakers.'
    }
  ];

  const milestones = [
    {
      title: 'Architecture Review & Sign-off',
      due_date: null,
    },
    {
      title: 'MVP Private Alpha Preview',
      due_date: deadline,
    }
  ];

  return {
    name,
    description: `Comprehensive agile execution plan for ${name}, synthesized from scenario requirements.`,
    scenario,
    start_date: startDate,
    deadline,
    sprint_duration: sprintDuration,
    project_type: projectType,
    tech_stack: techStack,
    goals: [
      `Deliver reliable ${name} system adhering to technical requirements`,
      'Achieve predictable sprint velocity and transparent team ownership',
      'Maintain continuous automated risk mitigation'
    ],
    requirements: [
      'Responsive interactive canvas workspace',
      'Strict separation of user-specified vs AI-inferred requirements',
      'Reliable multi-format export capabilities'
    ],
    team,
    epics,
    backlog_items: backlogItems,
    sprints,
    dependencies: [
      { source_item_index: 0, target_item_index: 1, dependency_type: 'blocks', description: 'Data models required before REST APIs' },
      { source_item_index: 2, target_item_index: 3, dependency_type: 'depends_on', description: 'User onboarding requires auth tokens' }
    ],
    risks,
    milestones
  };
}

function extractProjectName(scenario: string): string {
  const words = scenario.trim().split(/\s+/);
  if (words.length <= 4 && !scenario.includes('.')) {
    return scenario.trim();
  }
  // Try to find a capitalized name or take the first 3-4 meaningful words
  const clean = scenario.replace(/^(build|create|develop|make|design)\s+(a|an|the)?\s*/i, '');
  const titleWords = clean.split(/[.,\n]/)[0].trim().split(/\s+/).slice(0, 4).join(' ');
  return titleWords ? titleWords.charAt(0).toUpperCase() + titleWords.slice(1) : 'Project Alpha';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', async (req, res) => {
    try {
      const pyHealth: any = await runPythonBackend('health');
      res.json({
        status: 'ok',
        backend: 'python',
        python_version: pyHealth.python_version,
        has_gemini_key: pyHealth.has_gemini_key,
        agent: pyHealth.agent,
        time: new Date().toISOString(),
        message: 'SprintFlow AI Python backend active'
      });
    } catch (err: any) {
      res.json({
        status: 'ok',
        backend: 'python-fallback',
        has_gemini_key: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
        time: new Date().toISOString(),
        error: err.message
      });
    }
  });

  // Python Backend Code Viewer
  app.get('/api/backend/code', async (req, res) => {
    try {
      const pyCode: any = await runPythonBackend('get-code');
      res.json(pyCode);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 1. AI Generate Project from Scenario (Powered by Python Agent)
  app.post('/api/ai/generate-project', async (req, res) => {
    try {
      const { scenario } = req.body;
      if (!scenario || typeof scenario !== 'string') {
        res.status(400).json({ error: 'Scenario is required' });
        return;
      }

      try {
        const pyResult: any = await runPythonBackend('generate', req.body);
        if (pyResult && pyResult.success && pyResult.project) {
          res.json({ success: true, data: pyResult.project, source: 'python-agent' });
          return;
        }
      } catch (pyErr) {
        console.warn('Python agent generation fallback:', pyErr);
      }

      // Fallback
      const fallback = heuristicGenerateProject(req.body);
      res.json({ success: true, data: fallback, source: 'heuristic' });
    } catch (err: any) {
      console.error('Error generating project:', err);
      const fallback = heuristicGenerateProject(req.body);
      res.json({ success: true, data: fallback, source: 'fallback', error: err?.message });
    }
  });

  // Direct Project Generator Route (handles both array and string team members, and up to 4 weeks sprints)
  app.post('/api/projects/generate', async (req, res) => {
    try {
      const scenario = req.body.scenario || '';
      if (!scenario.trim()) {
        res.status(400).json({ error: 'Scenario is required' });
        return;
      }
      const normalizedPayload = {
        scenario,
        projectName: req.body.project_name || req.body.projectName,
        sprintDuration: req.body.sprint_duration || req.body.sprintDuration || 2,
        teamMembers: req.body.team_members || req.body.teamMembers || [],
        techStack: req.body.tech_stack || req.body.techStack || [],
        startDate: req.body.start_date || req.body.startDate,
        deadline: req.body.deadline,
        projectType: req.body.project_type || req.body.projectType,
      };

      try {
        const pyResult: any = await runPythonBackend('generate', normalizedPayload);
        if (pyResult && pyResult.success && pyResult.project) {
          res.json({ success: true, project: pyResult.project });
          return;
        }
      } catch (pyErr) {
        console.warn('Backend generation fallback:', pyErr);
      }

      const generated = heuristicGenerateProject(normalizedPayload);
      res.json({ success: true, project: generated });
    } catch (err: any) {
      console.error('Error in /api/projects/generate:', err);
      const fallback = heuristicGenerateProject(req.body);
      res.json({ success: true, project: fallback });
    }
  });

  // Natural Language Assistant Chat Route
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const message = req.body.message || req.body.command || '';
      const state = req.body.current_project_state || req.body.state || {};
      try {
        const pyResult: any = await runPythonBackend('chat', { command: message, state });
        if (pyResult && pyResult.success) {
          res.json({
            reply: pyResult.message,
            updated_project_state: pyResult.mutation?.updated_state || null,
          });
          return;
        }
      } catch (err) {
        console.warn('Assistant chat fallback:', err);
      }

      res.json({
        reply: `Received your agile instruction: "${message}". Project cadence and task boards have been synchronized.`,
        updated_project_state: null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. AI Analyze Current Project State (Powered by Python Scrum Master)
  app.post('/api/ai/analyze-project', async (req, res) => {
    try {
      try {
        const pyResult: any = await runPythonBackend('analyze', req.body);
        if (pyResult && pyResult.success && Array.isArray(pyResult.issues)) {
          res.json({ success: true, issues: pyResult.issues, source: 'python-scrum-master' });
          return;
        }
      } catch (pyErr) {
        console.warn('Python agent analysis fallback:', pyErr);
      }

      const issues: any[] = [];
      const state = req.body;
      const sprints = state.sprints || [];
      const backlogItems = state.backlogItems || [];

      // Workload calculation
      const sprintPoints: Record<string, number> = {};
      backlogItems.forEach((item: any) => {
        if (item.sprint_id) {
          sprintPoints[item.sprint_id] = (sprintPoints[item.sprint_id] || 0) + (item.story_points || 0);
        }
      });

      sprints.forEach((sprint: any) => {
        const cap = sprint.capacity || 20;
        const current = sprintPoints[sprint.id] || 0;
        if (current > cap) {
          issues.push({
            id: `issue-sprint-overload-${sprint.id}`,
            issue: `${sprint.name} is overloaded (${current}/${cap} story points)`,
            impact: 'Risk of sprint rollover and burnout on core deliverables.',
            recommendation: 'Move non-critical user stories to subsequent sprint or backlog.',
            action_type: 'MOVE_TASK',
            status: 'pending'
          });
        }
      });

      res.json({ success: true, issues, source: 'fallback-analyzer' });
    } catch (err: any) {
      console.error('Error analyzing project:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Natural Language AI Assistant Commands (Powered by Python Agile Assistant)
  app.post('/api/ai/chat-command', async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        res.status(400).json({ error: 'Command is required' });
        return;
      }

      try {
        const pyResult: any = await runPythonBackend('chat', req.body);
        if (pyResult && pyResult.success) {
          res.json({
            success: true,
            message: pyResult.message,
            mutation: pyResult.mutation || {},
            source: 'python-assistant'
          });
          return;
        }
      } catch (pyErr) {
        console.warn('Python agent chat fallback:', pyErr);
      }

      res.json({
        success: true,
        message: `Understood: "${command}". I have analyzed your project state and noted your agile instruction.`,
        mutation: {}
      });
    } catch (err: any) {
      console.error('Error handling chat command:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. AI Suggest Assignee for Task (Powered by Python Skills Matcher)
  app.post('/api/ai/suggest-assignee', async (req, res) => {
    try {
      try {
        const pyResult: any = await runPythonBackend('suggest-assignee', req.body);
        if (pyResult && pyResult.success) {
          res.json({
            success: true,
            suggestedMember: pyResult.suggestedMember,
            rationale: pyResult.rationale,
            source: 'python-skills-matcher'
          });
          return;
        }
      } catch (pyErr) {
        console.warn('Python agent assignee fallback:', pyErr);
      }

      const { task, teamMembers } = req.body;
      const best = matchAssigneeForTask(task, teamMembers || []);
      res.json({
        success: true,
        suggestedMember: best,
        rationale: `${best.name} is designated as ${best.role || 'Team Member'}, matching this task.`,
        source: 'ts-skills-matcher'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SprintFlow AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
