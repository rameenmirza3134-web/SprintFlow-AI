from typing import Dict, Any, List, Optional

class AssigneeSuggester:
    """
    Skills & Workload Matcher Agent.
    Evaluates developer profiles, known competencies, and role designations
    against task complexity and requirements to suggest optimal assignees.
    """

    def suggest(self, task: Dict[str, Any], team_members: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not team_members:
            return {
                "suggestedMember": None,
                "rationale": "No team members currently enrolled in project roster."
            }

        best_match = self.find_best_assignee(task, team_members)
        matched_role = best_match.get("role", "Team Member")
        rationale = f"{best_match.get('name')} is designated as {matched_role}, making them ideal for this assignment."

        return {
            "suggestedMember": best_match,
            "rationale": rationale
        }

    @staticmethod
    def find_best_assignee(task: Dict[str, Any], team: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not team:
            return {"name": "Team Member", "role": "Developer"}

        title = (task.get("title") or "").lower()
        desc = (task.get("description") or "").lower()
        stage = (task.get("stage") or "").lower()
        task_text = f"{title} {desc} {stage}"

        # Classify task nature with strict priority
        is_database_backend = any(w in task_text for w in [
            "database", "schema", "migration", "api", "rest", "backend",
            "endpoint", "controller", "server", "crud", "query", "sql", "postgres", "auth service"
        ])

        is_frontend_ui = any(w in task_text for w in [
            "frontend", "client ui", "user interface", "react", "component",
            "state engine", "views", "screens", "css", "tailwind", "client-side", "responsive"
        ])

        is_product_reqs = any(w in task_text for w in [
            "user story", "user stories", "requirements", "product owner",
            "acceptance criteria", "scope", "backlog grooming", "sprint planning",
            "user acceptance", "uat", "specifications", "journey map", "user story mapping"
        ])

        is_design_ui = (
            (stage == "designing" and not is_product_reqs)
            or any(w in task_text for w in [
                "design system", "ui/ux", "ux design", "ui design", "wireframe", "figma",
                "prototype", "mockup", "theme system", "typography"
            ])
        )

        is_devops_cloud = (
            stage == "deployment"
            or any(w in task_text for w in [
                "ci/cd", "docker", "cloud", "deploy", "staging",
                "infrastructure", "infra", "kubernetes", "hosting", "dns", "ssl", "monitoring", "sre", "cloud deployment"
            ])
        ) and not is_database_backend

        is_qa_testing = (
            stage == "testing"
            or any(w in task_text for w in [
                "unit test", "integration test", "e2e", "qa", "bug bash",
                "regression", "test suite", "cross-browser", "audit", "security validation"
            ])
        ) and not is_database_backend and not is_frontend_ui

        best_member = team[0]
        highest_score = -999

        for member in team:
            score = 0
            role = (member.get("role") or "").lower()
            skills = [str(s).lower() for s in member.get("skills", [])]
            all_member_info = f"{role} {' '.join(skills)}"

            # 1. Product Requirements & User Stories
            if is_product_reqs:
                if any(w in role for w in ["product owner", "po", "product manager", "pm", "scrum master"]):
                    score += 200
                elif any(w in role for w in ["designer", "ui/ux"]):
                    score += 40
                elif any(w in role for w in ["backend", "devops"]):
                    score -= 80

            # 2. UI/UX Design
            if is_design_ui:
                if any(w in role for w in ["designer", "ui/ux", "ux", "ui designer"]):
                    score += 200
                elif any(w in role for w in ["frontend"]):
                    score += 80
                elif any(w in role for w in ["product owner", "po", "scrum master"]):
                    score += 40
                elif any(w in role for w in ["devops", "backend"]):
                    score -= 100

            # 3. Backend Development & Database
            if is_database_backend:
                if any(w in role for w in ["backend", "database", "architect", "data engineer"]):
                    score += 200
                elif "full stack" in role:
                    score += 70
                elif any(w in role for w in ["devops", "cloud"]):
                    score -= 80
                elif any(w in role for w in ["designer", "ui/ux", "product owner"]):
                    score -= 120

            # 4. Frontend Development
            if is_frontend_ui:
                if any(w in role for w in ["frontend", "ui developer", "client"]):
                    score += 200
                elif "full stack" in role:
                    score += 70
                elif any(w in role for w in ["designer", "ui/ux"]):
                    score += 40
                elif any(w in role for w in ["backend", "devops", "product owner"]):
                    score -= 80

            # 5. DevOps & Cloud
            if is_devops_cloud:
                if any(w in role for w in ["devops", "cloud", "infra", "sre", "sysadmin"]):
                    score += 200
                elif "backend" in role or "full stack" in role:
                    score += 30
                elif any(w in role for w in ["designer", "ui/ux", "product owner", "frontend"]):
                    score -= 120

            # 6. QA & Testing
            if is_qa_testing:
                if any(w in role for w in ["qa", "tester", "testing", "quality"]):
                    score += 200
                elif any(w in role for w in ["product owner", "po"]):
                    score += 60
                elif "frontend" in role or "full stack" in role:
                    score += 40
                elif any(w in role for w in ["designer", "ui/ux"]):
                    score -= 50

            # Match explicit skills
            for skill in skills:
                if skill and skill in task_text:
                    score += 20

            if score > highest_score:
                highest_score = score
                best_member = member

        return best_member
