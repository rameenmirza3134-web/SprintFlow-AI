import json
from typing import Dict, Any, List, Optional
from .gemini_client import GeminiClient

class ScrumMaster:
    """
    Continuous Agile Scrum Master Inspection Agent.
    Audits active project state, identifies workload bottlenecks, missing deadlines,
    unassigned critical path tasks, and dependency deadlocks with concrete recommendations.
    """

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.ai = gemini_client or GeminiClient()

    def analyze(self, state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Runs comprehensive agile project inspection.
        """
        issues: List[Dict[str, Any]] = []

        project = state.get("project", {})
        sprints = state.get("sprints", [])
        backlog_items = state.get("backlogItems", [])
        team_members = state.get("teamMembers", [])
        dependencies = state.get("dependencies", [])

        # 1. Inspect Sprint Workloads & Capacities
        sprint_points_map: Dict[str, int] = {}
        for item in backlog_items:
            s_id = item.get("sprint_id")
            pts = int(item.get("story_points") or 0)
            if s_id:
                sprint_points_map[s_id] = sprint_points_map.get(s_id, 0) + pts

        for sprint in sprints:
            s_id = sprint.get("id")
            cap = int(sprint.get("capacity") or 20)
            allocated = sprint_points_map.get(s_id, 0)

            if allocated > cap:
                diff = allocated - cap
                # Find an item in this sprint to suggest moving
                movable = [item for item in backlog_items if item.get("sprint_id") == s_id and item.get("priority") != "critical"]
                suggested_item = movable[-1] if movable else None

                issues.append({
                    "id": f"issue-sprint-overload-{s_id}",
                    "issue": f"{sprint.get('name')} is overloaded ({allocated}/{cap} pts, +{diff} over capacity)",
                    "impact": "Team runs a high risk of spillover, burnout, or delivering compromised feature quality.",
                    "recommendation": f"Move lower-priority story '{suggested_item.get('title', 'feature') if suggested_item else 'item'}' to the next planned sprint or backlog.",
                    "action_type": "MOVE_TASK",
                    "action_payload": {
                        "task_id": suggested_item.get("id") if suggested_item else None,
                        "to_sprint_id": None
                    },
                    "status": "pending"
                })

        # 2. Check for Missing Target Deadline (Rule 3: Highlight unprovided facts)
        deadline = project.get("deadline")
        if not deadline:
            issues.append({
                "id": "issue-missing-deadline",
                "issue": "No target delivery deadline specified for this project",
                "impact": "Without an explicit release target, sprint velocity cannot be mapped against milestone commitments.",
                "recommendation": "Click to set a target deadline in the Project Overview block to enable burndown projections.",
                "action_type": "SET_DEADLINE",
                "status": "pending"
            })

        # 3. Check for Unassigned Critical / High Priority Tasks
        unassigned_critical = [
            item for item in backlog_items
            if not item.get("assignee_id") and item.get("priority") in ["critical", "high"] and item.get("sprint_id")
        ]

        for item in unassigned_critical[:3]:
            issues.append({
                "id": f"issue-unassigned-{item.get('id')}",
                "issue": f"High-priority task '{item.get('title')}' is unassigned in active sprint",
                "impact": "Critical path stories without designated engineering owners face kickoff delays.",
                "recommendation": f"Assign qualified team member to '{item.get('title')}' to ensure sprint commitments are met.",
                "action_type": "ASSIGN_TASK",
                "action_payload": {
                    "task_id": item.get("id")
                },
                "status": "pending"
            })

        # 4. Detect Dependency Sequencing Inversions
        item_sprint_index_map = {}
        sprint_number_map = {s.get("id"): s.get("sprint_number", 1) for s in sprints}

        for item in backlog_items:
            s_id = item.get("sprint_id")
            item_sprint_index_map[item.get("id")] = sprint_number_map.get(s_id, 999) if s_id else 999

        for dep in dependencies:
            src_id = dep.get("source_item_id")
            tgt_id = dep.get("target_item_id")
            src_sprint_num = item_sprint_index_map.get(src_id, 999)
            tgt_sprint_num = item_sprint_index_map.get(tgt_id, 999)

            # If dependent task (target) is in an earlier sprint than prerequisite (source)
            if tgt_sprint_num < src_sprint_num and tgt_sprint_num != 999 and src_sprint_num != 999:
                tgt_item = next((i for i in backlog_items if i.get("id") == tgt_id), None)
                src_item = next((i for i in backlog_items if i.get("id") == src_id), None)
                issues.append({
                    "id": f"issue-dep-inversion-{dep.get('id')}",
                    "issue": f"Dependency Inversion: '{tgt_item.get('title', 'Task')}' is scheduled in Sprint {tgt_sprint_num} before prerequisite '{src_item.get('title', 'Prerequisite')}' in Sprint {src_sprint_num}",
                    "impact": "Work cannot begin on the dependent item until the prerequisite is completed, creating blocking idle time.",
                    "recommendation": f"Reschedule '{tgt_item.get('title', 'Task')}' to Sprint {src_sprint_num} or later.",
                    "action_type": "MOVE_TASK",
                    "action_payload": {
                        "task_id": tgt_id,
                        "to_sprint_id": next((s.get("id") for s in sprints if s.get("sprint_number") == src_sprint_num), None)
                    },
                    "status": "pending"
                })

        # 5. Gemini Enrichment if available
        if self.ai.is_configured and len(issues) < 2:
            gemini_issues = self._enrich_with_gemini(project, sprints, backlog_items)
            issues.extend(gemini_issues)

        return issues

    def _enrich_with_gemini(self, project: Dict[str, Any], sprints: List[Any], backlog: List[Any]) -> List[Dict[str, Any]]:
        prompt = f"""
Audit this agile project state and return up to 2 strategic scrum improvements in JSON format.
Project: {project.get('name')}
Sprints: {len(sprints)}
Backlog stories: {len(backlog)}

Return an array of objects matching:
[
  {{
    "issue": "Brief problem statement",
    "impact": "Concrete consequence",
    "recommendation": "Agile coaching advice"
  }}
]
"""
        res = self.ai.generate_content(prompt=prompt, response_mime_type="application/json", model="gemini-3-flash-preview")
        if not res:
            return []

        try:
            clean = res.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean)
            enriched = []
            for idx, g in enumerate(parsed[:2]):
                enriched.append({
                    "id": f"issue-gemini-{idx + 1}",
                    "issue": g.get("issue", "Agile Improvement"),
                    "impact": g.get("impact", "Process efficiency impact"),
                    "recommendation": g.get("recommendation", "Consider refining sprint backlog"),
                    "action_type": "CUSTOM",
                    "status": "pending"
                })
            return enriched
        except Exception:
            return []
