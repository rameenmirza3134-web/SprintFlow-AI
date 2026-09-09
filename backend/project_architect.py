import json
import re
import os
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from .gemini_client import GeminiClient
from .assignee_suggester import AssigneeSuggester

class ProjectArchitect:
    """
    Agile Project Architect Agent.
    Decomposes natural language project descriptions into full agile deliverables:
    Epics, Sprints, Backlog Stories with Story Points, Dependencies, and Risks.
    """

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.ai = gemini_client or GeminiClient()

    def generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point to architect a project from input parameters.
        """
        scenario = params.get("scenario", "").strip()
        project_name = params.get("projectName", "").strip()
        start_date = params.get("startDate")
        deadline = params.get("deadline") # Rule 3: strictly None if not provided
        sprint_duration = int(params.get("sprintDuration") or 2)
        raw_team = params.get("teamMembers") or params.get("team_members") or []
        project_type = params.get("projectType", "").strip()
        tech_stack = params.get("techStack") or []

        if isinstance(tech_stack, str):
            tech_stack = [s.strip() for s in tech_stack.split(",") if s.strip()]

        # Parse team members preserving name and exact role
        parsed_team: List[Dict[str, Any]] = []
        if isinstance(raw_team, str):
            for part in raw_team.split(","):
                part = part.strip()
                if part:
                    match = re.match(r"^([^(]+)\s*\(([^)]+)\)$", part)
                    if match:
                        parsed_team.append({"name": match.group(1).strip(), "role": match.group(2).strip(), "is_ai_suggested": False})
                    else:
                        parsed_team.append({"name": part, "role": "Developer", "is_ai_suggested": False})
        elif isinstance(raw_team, list):
            for m in raw_team:
                if isinstance(m, dict):
                    name = str(m.get("name", "")).strip()
                    if name:
                        parsed_team.append({
                            "name": name,
                            "role": str(m.get("role", "Developer")).strip(),
                            "skills": m.get("skills", []),
                            "is_ai_suggested": bool(m.get("is_ai_suggested", False))
                        })
                elif isinstance(m, str) and m.strip():
                    match = re.match(r"^([^(]+)\s*\(([^)]+)\)$", m.strip())
                    if match:
                        parsed_team.append({"name": match.group(1).strip(), "role": match.group(2).strip(), "is_ai_suggested": False})
                    else:
                        parsed_team.append({"name": m.strip(), "role": "Developer", "is_ai_suggested": False})

        # Try AI Generation first if Gemini is configured
        if self.ai.is_configured:
            ai_result = self._generate_with_gemini(
                scenario=scenario,
                project_name=project_name,
                start_date=start_date,
                deadline=deadline,
                sprint_duration=sprint_duration,
                team_members=parsed_team,
                project_type=project_type,
                tech_stack=tech_stack,
            )
            if ai_result:
                return ai_result

        # Fallback to intelligent rule-based domain synthesizer
        return self._generate_heuristically(
            scenario=scenario,
            project_name=project_name,
            start_date=start_date,
            deadline=deadline,
            sprint_duration=sprint_duration,
            team_members=parsed_team,
            project_type=project_type,
            tech_stack=tech_stack,
        )

    def _generate_with_gemini(
        self,
        scenario: str,
        project_name: str,
        start_date: Optional[str],
        deadline: Optional[str],
        sprint_duration: int,
        team_members: List[Dict[str, Any]],
        project_type: str,
        tech_stack: List[str],
    ) -> Optional[Dict[str, Any]]:
        # Format team members with their stated roles
        team_list_str = ", ".join([f"{m['name']} (Role: {m.get('role', 'Developer')})" for m in team_members]) if team_members else "None specified"
        prompt = f"""
You are an expert Agile Software Architect and Technical Program Manager.
Analyze this user project request and generate a complete agile project structure in strict JSON format.

USER INPUT:
- Scenario / Requirements: {scenario}
- Provided Project Name: {project_name or "Not provided (infer a professional name)"}
- Provided Start Date: {start_date or "Not provided"}
- Provided Target Deadline: {deadline or "Not provided"}
- Sprint Cadence: {sprint_duration} weeks
- Team Members & Specific Roles: {team_list_str}
- Project Type: {project_type or "Infer from scenario"}
- Tech Stack: {", ".join(tech_stack) if tech_stack else "Infer appropriate modern stack"}

STRICT CRITICAL RULES:
1. RULE 3: Do NOT hallucinate or invent dates or deadlines. If the user did not supply a target deadline, set deadline: null.
2. If no team members were supplied by the user, provide 4 standard agile team members with distinct roles (UI/UX Designer, Frontend Engineer, Backend Engineer, QA/DevOps Specialist) with is_ai_suggested: true.
3. Categorize EVERY backlog item into one of 4 explicit stages:
   - "designing" (UI/UX wireframing, high-fidelity prototypes, design system, user flows)
   - "development" (Frontend components, Backend API endpoints, database schemas, core business logic)
   - "testing" (Unit testing, integration testing, QA verification, bug bash)
   - "deployment" (CI/CD pipelines, staging environments, Docker/cloud infrastructure, launch monitoring)
4. MANDATORY ROLE-BASED TASK ASSIGNMENT:
   You MUST assign each task (assignee_name) to the team member whose designated ROLE matches that task:
   - Backend Developer / Architect: Assign Database Schemas, REST API endpoints, business logic, server controllers. NEVER assign deployment pipelines or wireframes!
   - DevOps & Cloud / Infrastructure: Assign CI/CD pipelines, Docker, cloud deployment, staging environments, live domain launch, monitoring. NEVER assign UI design or wireframes!
   - Frontend Developer: Assign client UI components, responsive layouts, web state engine, client-side interactions.
   - UI/UX Designer: Assign wireframes, component design systems, Figma mockups, visual theme tokens, user journey flows.
   - Product Owner / Scrum Master: Assign user story specifications, requirements mapping, acceptance criteria, backlog grooming, User Acceptance Testing (UAT).
   - QA Engineer: Assign automated unit & integration test suites, end-to-end testing, bug bash, regression verification.
5. For each task, provide:
   - stage: "designing" | "development" | "testing" | "deployment"
   - timing: realistic duration (e.g. "Sprint 1 • 3 days", "Sprint 2 • 4 days")
   - assignee_name: match one of the team member names strictly based on their assigned role
   - story_points: (1, 2, 3, 5, 8)
6. Generate 2 to 4 chronological Sprints (sprint_number: 1, 2, 3, 4) ensuring sprint workload does not exceed capacity (20-25 story points). Set item_indices for each sprint.
7. Provide 2-4 dependencies between items and 2-3 project risks.

Respond ONLY with valid JSON matching this schema:
{{
  "name": "string",
  "description": "string",
  "project_type": "string",
  "tech_stack": ["string"],
  "start_date": "YYYY-MM-DD or null",
  "deadline": "YYYY-MM-DD or null",
  "sprint_duration": {sprint_duration},
  "goals": ["string"],
  "requirements": ["string"],
  "team": [
    {{
      "name": "string",
      "role": "string",
      "skills": ["string"],
      "is_ai_suggested": true
    }}
  ],
  "epics": [
    {{
      "title": "string",
      "description": "string",
      "goal": "string",
      "priority": "high",
      "progress": 0
    }}
  ],
  "backlog_items": [
    {{
      "title": "string",
      "description": "string",
      "stage": "designing",
      "timing": "Sprint 1 • 3 days",
      "assignee_name": "string",
      "priority": "medium",
      "story_points": 3,
      "epic_index": 0,
      "status": "todo"
    }}
  ],
  "sprints": [
    {{
      "name": "Sprint 1: ...",
      "sprint_number": 1,
      "goal": "string",
      "capacity": 22,
      "item_indices": [0, 1, 2]
    }}
  ],
  "dependencies": [
    {{
      "source_item_index": 0,
      "target_item_index": 1,
      "dependency_type": "blocks",
      "description": "string"
    }}
  ],
  "risks": [
    {{
      "title": "string",
      "severity": "high",
      "impact": "string",
      "mitigation": "string"
    }}
  ]
}}
"""
        response_text = self.ai.generate_content(
            prompt=prompt,
            response_mime_type="application/json",
            model="gemini-3-flash-preview"
        )

        if not response_text:
            return None

        try:
            # Clean possible markdown wrapping
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            data = json.loads(clean_text.strip())
            # Enforce null deadline if unprovided
            if not deadline and not data.get("deadline"):
                data["deadline"] = None

            # Enforce team roster and role-based assignee matching
            resolved_team = team_members if team_members else data.get("team", [])
            if team_members:
                data["team"] = team_members

            for item in data.get("backlog_items", []):
                if resolved_team:
                    best = AssigneeSuggester.find_best_assignee(item, resolved_team)
                    if best and best.get("name"):
                        item["assignee_name"] = best["name"]

            return data
        except Exception as e:
            print(f"[ProjectArchitect] Failed to parse Gemini response: {e}", file=os.sys.stderr)
            return None

    def _generate_heuristically(
        self,
        scenario: str,
        project_name: str,
        start_date: Optional[str],
        deadline: Optional[str],
        sprint_duration: int,
        team_members: List[Dict[str, Any]],
        project_type: str,
        tech_stack: List[str],
    ) -> Dict[str, Any]:
        """
        High-fidelity heuristic engine when Gemini is unavailable.
        Generates domain-aware epics, stories, and sprint containers.
        """
        # Extract title
        name = project_name or self._extract_project_name(scenario)
        p_type = project_type or self._detect_project_type(scenario)

        # Detect tech stack
        if not tech_stack:
            tech_stack = self._detect_tech_stack(scenario, p_type)

        today_str = datetime.now().strftime("%Y-%m-%d")
        actual_start = start_date or today_str

        # Team handling - preserve exact user-defined roles
        team: List[Dict[str, Any]] = []
        if team_members:
            for idx, member in enumerate(team_members):
                if isinstance(member, dict):
                    team.append({
                        "name": member.get("name", f"Member {idx+1}"),
                        "role": member.get("role", "Developer"),
                        "skills": member.get("skills", [tech_stack[0] if tech_stack else "TypeScript"]),
                        "is_ai_suggested": member.get("is_ai_suggested", False),
                    })
                else:
                    team.append({
                        "name": str(member),
                        "role": "Developer",
                        "skills": [tech_stack[0] if tech_stack else "TypeScript"],
                        "is_ai_suggested": False,
                    })
        else:
            team = [
                {"name": "Elena Rostova", "role": "UI/UX Designer", "skills": ["Figma", "UI/UX", "Design System"], "is_ai_suggested": True},
                {"name": "Zainab Khan", "role": "Frontend Developer", "skills": ["React", "TypeScript", "TailwindCSS"], "is_ai_suggested": True},
                {"name": "Anees Rahman", "role": "Backend Architect", "skills": ["APIs", "Database Schema", "PostgreSQL"], "is_ai_suggested": True},
                {"name": "Moniba Farooq", "role": "DevOps & Cloud Lead", "skills": ["Docker", "CI/CD", "Cloud Deploy"], "is_ai_suggested": True},
            ]

        # Epics tailored to scenario
        epics = [
            {
                "title": "UI/UX Design & User Journey Flow",
                "description": f"Information architecture, wireframes, user flows, and interactive mockups for {name}.",
                "goal": "Deliver intuitive design systems and validated user interfaces.",
                "priority": "high",
                "progress": 0,
            },
            {
                "title": f"Core {tech_stack[0] if tech_stack else 'System'} Architecture & Features",
                "description": f"Build full-stack functional capability for: {scenario[:90]}.",
                "goal": "Ship robust, scalable core product features.",
                "priority": "critical",
                "progress": 0,
            },
            {
                "title": "Quality Assurance, Security & Testing",
                "description": "Comprehensive automated testing suites, edge cases, and performance audits.",
                "goal": "Ensure 99.9% reliability, zero high-priority defects, and security compliance.",
                "priority": "high",
                "progress": 0,
            },
            {
                "title": "Production Deployment & Infrastructure",
                "description": "Automated CI/CD pipelines, container orchestration, monitoring, and staging verification.",
                "goal": "Achieve frictionless, automated zero-downtime production deployment.",
                "priority": "medium",
                "progress": 0,
            },
        ]

        # 4 Categorized Stages with Timings
        raw_backlog_items = [
            # 1. DESIGNING
            {
                "title": "User Story Mapping & Product Acceptance Criteria",
                "description": "Map user journeys, requirements specifications, and core acceptance criteria.",
                "stage": "designing",
                "timing": "Sprint 1 • Days 1-3",
                "priority": "high",
                "story_points": 3,
                "epic_index": 0,
                "status": "todo",
            },
            {
                "title": "Information Architecture & Wireframe Specifications",
                "description": "Design user flows, screen blueprints, navigation structure, and interface mockups.",
                "stage": "designing",
                "timing": "Sprint 1 • Days 2-4",
                "priority": "high",
                "story_points": 3,
                "epic_index": 0,
                "status": "todo",
            },
            {
                "title": "High-Fidelity UI Design & Component System",
                "description": "Establish typography scale, color tokens, responsive UI components, and asset tokens.",
                "stage": "designing",
                "timing": "Sprint 1 • Days 4-6",
                "priority": "high",
                "story_points": 5,
                "epic_index": 0,
                "status": "todo",
            },
            # 2. DEVELOPMENT
            {
                "title": "Database Schema & Migration Pipeline",
                "description": "Initialize relational entities, indexing, foreign keys, and local container seed data.",
                "stage": "development",
                "timing": "Sprint 1 • Days 2-5",
                "priority": "critical",
                "story_points": 5,
                "epic_index": 1,
                "status": "todo",
            },
            {
                "title": "REST API Endpoints & Business Controllers",
                "description": "Develop typed API endpoints, middleware validation, and session handling.",
                "stage": "development",
                "timing": "Sprint 1 • Days 6-10",
                "priority": "critical",
                "story_points": 5,
                "epic_index": 1,
                "status": "todo",
            },
            {
                "title": "Responsive Client UI & Interactive State Engine",
                "description": f"Build user-facing workflows and real-time state synchronization for {name}.",
                "stage": "development",
                "timing": "Sprint 2 • Days 1-6",
                "priority": "high",
                "story_points": 8,
                "epic_index": 1,
                "status": "todo",
            },
            # 3. TESTING
            {
                "title": "Automated Unit & Integration Test Suite",
                "description": "Write automated test harnesses for critical domain calculation logic and API schemas.",
                "stage": "testing",
                "timing": "Sprint 2 • Days 4-7",
                "priority": "high",
                "story_points": 3,
                "epic_index": 2,
                "status": "todo",
            },
            {
                "title": "End-to-End QA Validation & Bug Bash",
                "description": "Cross-browser verification, mobile viewport audit, and edge-case regression tests.",
                "stage": "testing",
                "timing": "Sprint 2 • Days 8-10",
                "priority": "medium",
                "story_points": 3,
                "epic_index": 2,
                "status": "todo",
            },
            # 4. DEPLOYMENT
            {
                "title": "Automated CI/CD Pipeline & Staging Setup",
                "description": "Configure GitHub Actions / Cloud Build workflows with automated linting and build checks.",
                "stage": "deployment",
                "timing": "Sprint 2 • Days 6-8",
                "priority": "high",
                "story_points": 3,
                "epic_index": 3,
                "status": "todo",
            },
            {
                "title": "Production Cloud Deployment & Live Domain Launch",
                "description": "Set up production environment variables, SSL certificates, health monitoring, and DNS.",
                "stage": "deployment",
                "timing": "Sprint 2 • Days 9-10",
                "priority": "high",
                "story_points": 5,
                "epic_index": 3,
                "status": "todo",
            },
        ]

        # Assign every task strictly based on member role
        backlog_items = []
        for task in raw_backlog_items:
            best = AssigneeSuggester.find_best_assignee(task, team)
            task_copy = dict(task)
            task_copy["assignee_name"] = best.get("name") or team[0]["name"]
            backlog_items.append(task_copy)

        # Sprints
        sprints = [
            {
                "name": "Sprint 1: Design & Core Scaffolding",
                "sprint_number": 1,
                "goal": "Complete UI/UX design tokens, database models, and base API infrastructure.",
                "capacity": 20,
                "item_indices": [0, 1, 2, 3], # 3 + 5 + 5 + 5 = 18 pts
            },
            {
                "name": "Sprint 2: Feature Build, QA & Production Launch",
                "sprint_number": 2,
                "goal": "Ship interactive UI features, achieve full test coverage, and deploy to live production.",
                "capacity": 24,
                "item_indices": [4, 5, 6, 7, 8], # 8 + 3 + 3 + 3 + 5 = 22 pts
            },
        ]

        # Dependencies
        dependencies = [
            {
                "source_item_index": 0,
                "target_item_index": 1,
                "dependency_type": "blocks",
                "description": "API endpoints require base database schema to be migrated first.",
            },
            {
                "source_item_index": 2,
                "target_item_index": 3,
                "dependency_type": "blocks",
                "description": "RBAC permission checks depend on foundational auth session tokens.",
            },
            {
                "source_item_index": 1,
                "target_item_index": 4,
                "dependency_type": "blocks",
                "description": "Frontend canvas queries rely on backend CRUD API endpoints.",
            },
        ]

        # Risks
        risks = [
            {
                "title": "Critical Path Story Allocation",
                "severity": "medium",
                "impact": "Core architectural stories must be assigned early to prevent sprint delay.",
                "mitigation": "Review team competencies and assign tech lead during sprint planning.",
            },
            {
                "title": "External API & Integration Latency",
                "severity": "low",
                "impact": "Third-party service rate limits could affect real-time sync performance.",
                "mitigation": "Implement client-side caching and background retry queues.",
            },
        ]

        return {
            "name": name,
            "description": f"Agile project plan synthesized from scenario: {scenario[:200]}...",
            "project_type": p_type,
            "tech_stack": tech_stack,
            "start_date": actual_start,
            "deadline": deadline, # Rule 3: strictly None if not specified
            "sprint_duration": sprint_duration,
            "goals": [
                f"Successfully architect and deliver {name}",
                "Maintain velocity with balanced sprint workloads",
                "Ensure clean separation of concerns and automated tests",
            ],
            "requirements": [
                f"Target user journey: {scenario[:100]}",
                "Responsive web and mobile layout compliance",
                "Agile sprints tracking with burndown and risk matrix",
            ],
            "team": team,
            "epics": epics,
            "backlog_items": backlog_items,
            "sprints": sprints,
            "dependencies": dependencies,
            "risks": risks,
        }

    def _extract_project_name(self, scenario: str) -> str:
        first_line = scenario.split("\n")[0].strip()
        words = re.findall(r"\b[A-Za-z0-9\-\_]+\b", first_line)
        if len(words) >= 2:
            return " ".join(words[:4]).title()
        return "SprintFlow Initiative"

    def _detect_project_type(self, scenario: str) -> str:
        s = scenario.lower()
        if "mobile" in s or "ios" in s or "android" in s:
            return "Mobile Application"
        if "ecommerce" in s or "store" in s or "cart" in s or "shop" in s:
            return "E-Commerce Platform"
        if "ai" in s or "machine learning" in s or "agent" in s:
            return "AI-Powered Application"
        if "saas" in s or "b2b" in s or "platform" in s:
            return "SaaS Web Application"
        return "Full-Stack Web System"

    def _detect_tech_stack(self, scenario: str, project_type: str) -> List[str]:
        s = scenario.lower()
        stack = []
        if "mobile" in s:
            stack = ["React Native", "TypeScript", "Node.js", "PostgreSQL"]
        elif "python" in s:
            stack = ["Python", "FastAPI", "React", "PostgreSQL"]
        elif "ai" in s:
            stack = ["Python", "Gemini API", "React", "TypeScript", "PostgreSQL"]
        else:
            stack = ["TypeScript", "React", "Python", "Tailwind CSS", "PostgreSQL"]
        return stack
