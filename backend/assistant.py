import re
import time
from datetime import datetime
from typing import Dict, Any, Optional
from .gemini_client import GeminiClient

class AgileAssistant:
    """
    Natural Language Agile Canvas Command Engine.
    Interprets user instructions and produces direct state mutations and responses.
    """

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.ai = gemini_client or GeminiClient()

    def handle_command(self, command: str, state: Dict[str, Any]) -> Dict[str, Any]:
        lower = command.lower().strip()
        project = state.get("project", {})
        sprints = state.get("sprints", [])
        epics = state.get("epics", [])
        backlog = state.get("backlogItems", [])

        # 1. Rearrange Canvas
        if any(w in lower for w in ["rearrange", "auto arrange", "organize canvas", "layout"]):
            return {
                "message": "I have reorganized your canvas blocks into a structured topological hierarchy: Overview on top, followed by Epics, chronological Sprints, Backlog, and Risks.",
                "mutation": {
                    "action": "AUTO_ARRANGE"
                }
            }

        # 2. Create Sprint
        if any(w in lower for w in ["create a sprint", "add a sprint", "new sprint"]):
            cleaned_goal = re.sub(r"(create|add)\s+(a\s+)?sprint\s+(for\s+)?", "", command, flags=re.IGNORECASE).strip()
            goal = cleaned_goal if cleaned_goal else "New Feature Delivery"
            sprint_num = len(sprints) + 1
            now_str = datetime.utcnow().isoformat() + "Z"
            new_sprint = {
                "id": f"sprint-{int(time.time() * 1000)}",
                "project_id": project.get("id"),
                "name": f"Sprint {sprint_num}: {goal}",
                "sprint_number": sprint_num,
                "goal": f"Deliver {goal}",
                "start_date": None,
                "end_date": None,
                "capacity": 24,
                "status": "planned",
                "created_at": now_str,
                "updated_at": now_str,
                "is_ai_suggested": True
            }
            return {
                "message": f"Created **Sprint {sprint_num}** ({new_sprint['name']}) with 24 story points capacity and placed it on the canvas.",
                "mutation": {
                    "action": "ADD_SPRINT",
                    "sprint": new_sprint
                }
            }

        # 3. Add Epic
        if any(w in lower for w in ["create an epic", "add an epic", "new epic"]):
            cleaned_title = re.sub(r"(create|add)\s+(an?\s+)?epic\s+(for\s+)?", "", command, flags=re.IGNORECASE).strip()
            title = cleaned_title if cleaned_title else "Strategic Initiative"
            epic_code = f"EP-{str(len(epics) + 1).zfill(2)}"
            now_str = datetime.utcnow().isoformat() + "Z"
            new_epic = {
                "id": f"epic-{int(time.time() * 1000)}",
                "epic_code": epic_code,
                "project_id": project.get("id"),
                "title": title,
                "description": f"Deliverables, stories and acceptance criteria for {title}.",
                "goal": f"Ship {title} successfully.",
                "priority": "high",
                "progress": 0,
                "created_at": now_str,
                "updated_at": now_str,
                "is_ai_suggested": True
            }
            return {
                "message": f"Added **Epic {epic_code}** (\"{title}\") to your project canvas.",
                "mutation": {
                    "action": "ADD_EPIC",
                    "epic": new_epic
                }
            }

        # 4. Set Deadline
        if "deadline" in lower:
            return {
                "message": "Opened deadline setting in the Project Overview block and updated milestone projections.",
                "mutation": {
                    "action": "SET_DEADLINE_PROMPT"
                }
            }

        # 5. Move tasks
        if "move" in lower and ("sprint" in lower or "backlog" in lower):
            match = re.search(r"sprint\s+(\d+)", lower)
            target_num = int(match.group(1)) if match else None
            target_sprint = next((s for s in sprints if s.get("sprint_number") == target_num), None)
            return {
                "message": f"Moved matching tasks to {target_sprint.get('name', f'Sprint {target_num}') if target_sprint else 'target sprint'} and updated canvas dependency routes.",
                "mutation": {
                    "action": "MOVE_TASKS_MATCHING",
                    "targetSprintId": target_sprint.get("id") if target_sprint else None,
                    "targetSprintNumber": target_num
                }
            }

        # 6. Fallback or Gemini conversational prompt
        if self.ai.is_configured:
            prompt = f"""
You are the SprintFlow AI Scrum Master.
The user issued this natural language project command: "{command}"
Active project name: {project.get('name', 'Project')}
Total sprints: {len(sprints)}
Total stories: {len(backlog)}

Provide a concise, helpful agile project management answer (1-2 sentences) explaining how to accomplish this or summarizing the recommendation.
"""
            ai_reply = self.ai.generate_content(prompt=prompt, model="gemini-3-flash-preview")
            if ai_reply:
                return {
                    "message": ai_reply.strip(),
                    "mutation": {}
                }

        return {
            "message": f"Processed command: '{command}'. Canvas and sprint data reviewed.",
            "mutation": {}
        }
