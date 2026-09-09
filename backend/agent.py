import sys
import platform
from typing import Dict, Any, List, Optional
from .gemini_client import GeminiClient
from .project_architect import ProjectArchitect
from .scrum_master import ScrumMaster
from .assistant import AgileAssistant
from .assignee_suggester import AssigneeSuggester

class SprintFlowAgent:
    """
    SprintFlow Master Python Agent.
    Orchestrates agile planning, Scrum Master continuous audits, natural language canvas commands,
    and skills-based task assignment.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.gemini_client = GeminiClient(api_key=api_key)
        self.architect = ProjectArchitect(gemini_client=self.gemini_client)
        self.scrum_master = ScrumMaster(gemini_client=self.gemini_client)
        self.assistant = AgileAssistant(gemini_client=self.gemini_client)
        self.assignee_suggester = AssigneeSuggester()

    def generate_project(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize project structure from scenario and constraints."""
        return self.architect.generate(params)

    def analyze_project(self, state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Continuous inspection for capacity limits, bottlenecks, and missing deadlines."""
        return self.scrum_master.analyze(state)

    def chat_command(self, command: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process conversational canvas commands."""
        return self.assistant.handle_command(command, state)

    def suggest_assignee(self, task: Dict[str, Any], team_members: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Match task requirements to team member roles and competencies."""
        return self.assignee_suggester.suggest(task, team_members)

    def get_health(self) -> Dict[str, Any]:
        """System health and runtime status."""
        return {
            "status": "ok",
            "runtime": "python",
            "python_version": platform.python_version(),
            "has_gemini_key": self.gemini_client.is_configured,
            "agent": "SprintFlow Python Agent v1.0",
        }
