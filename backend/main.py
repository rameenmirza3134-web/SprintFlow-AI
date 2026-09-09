#!/usr/bin/env python3
"""
SprintFlow AI - Python Agent Entry Point & CLI Dispatcher
Invoked by the server to execute agile workflows with Python runtime.
"""

import sys
import os
import json
from pathlib import Path

# Add backend directory to sys.path so relative imports work seamlessly
backend_dir = Path(__file__).resolve().parent
if str(backend_dir.parent) not in sys.path:
    sys.path.insert(0, str(backend_dir.parent))

from backend.agent import SprintFlowAgent

def read_stdin_json():
    try:
        raw = sys.stdin.read()
        if not raw or not raw.strip():
            return {}
        return json.loads(raw)
    except Exception as e:
        print(f"[PythonBackend Error reading stdin]: {e}", file=sys.stderr)
        return {}

def main():
    if len(sys.argv) < 2:
        action = "health"
    else:
        action = sys.argv[1]

    agent = SprintFlowAgent()

    try:
        if action == "health":
            result = agent.get_health()
            print(json.dumps(result))

        elif action == "generate":
            payload = read_stdin_json()
            project_data = agent.generate_project(payload)
            print(json.dumps({"success": True, "project": project_data}))

        elif action == "analyze":
            payload = read_stdin_json()
            issues = agent.analyze_project(payload)
            print(json.dumps({"success": True, "issues": issues}))

        elif action == "chat":
            payload = read_stdin_json()
            command = payload.get("command", "")
            state = payload.get("state", {})
            response = agent.chat_command(command, state)
            print(json.dumps({"success": True, **response}))

        elif action == "suggest-assignee":
            payload = read_stdin_json()
            task = payload.get("task", {})
            team_members = payload.get("teamMembers", [])
            response = agent.suggest_assignee(task, team_members)
            print(json.dumps({"success": True, **response}))

        elif action == "get-code":
            # Returns python backend source files for inspection
            code_files = {}
            py_files = ["agent.py", "project_architect.py", "scrum_master.py", "assistant.py", "assignee_suggester.py", "gemini_client.py", "main.py"]
            for fname in py_files:
                fpath = backend_dir / fname
                if fpath.exists():
                    try:
                        code_files[fname] = fpath.read_text(encoding="utf-8")
                    except Exception:
                        pass
            print(json.dumps({"success": True, "files": code_files}))

        else:
            print(json.dumps({"success": False, "error": f"Unknown action: {action}"}), file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
