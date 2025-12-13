#!/usr/bin/env python3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import subprocess
import json
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class CodeRequest(BaseModel):
    code: str

class QuizRequest(BaseModel):
    topic_name: str
    difficulty: int = 2

class JoinClassroomRequest(BaseModel):
    username: str
    classroom_name: str

class CompleteChapterRequest(BaseModel):
    username: str
    chapter_title: str

@app.post("/api/execute")
def execute_code(req: CodeRequest):
    import sys
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jac', delete=False, encoding='utf-8') as f:
            f.write(req.code)
            temp_path = f.name
        
        result = subprocess.run(
            [sys.executable, "-m", "jaclang", "check", temp_path],
            capture_output=True, text=True, timeout=5
        )
        
        try:
            os.unlink(temp_path)
        except:
            pass
        
        error_output = result.stderr.strip() if result.stderr else result.stdout.strip()
        
        if result.returncode == 0 and not error_output:
            return {"success": True, "output": "Code is valid"}
        
        if error_output:
            return {"success": False, "error": error_output}
        
        return {"success": False, "error": "Syntax error in code"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/topics")
def get_topics():
    # Return all topics including old names for compatibility
    return {
        "topics": [
            {
                "name": "Jac Basics",
                "description": "Hello World, Nodes, Edges",
                "difficulty": 1
            },
            {
                "name": "Walkers",
                "description": "Graph traversal and abilities",
                "difficulty": 2
            },
            {
                "name": "OSP Graphs",
                "description": "Variables, control flow, functions",
                "difficulty": 3
            },
            {
                "name": "byLLM Agents",
                "description": "Imports and testing",
                "difficulty": 4
            },
            {
                "name": "Jac Client",
                "description": "Frontend integration",
                "difficulty": 5
            }
        ]
    }

@app.post("/api/quiz")
def generate_quiz(req: QuizRequest):
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "generate_quiz", "--args", f"topic_name={req.topic_name}"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"type": "error", "quiz": "Failed to generate quiz"}
    except Exception as e:
        return {"type": "error", "quiz": str(e)}

@app.get("/api/progress/{username}")
def get_progress(username: str):
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "get_learner_progress", "--args", f"username={username}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"username": username, "progress": []}
    except:
        return {"username": username, "progress": []}

@app.get("/api/recommend/{username}")
def recommend_topics(username: str):
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "recommend_next_topic", "--args", f"username={username}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"username": username, "unlocked": [], "locked": []}
    except:
        return {"username": username, "unlocked": [], "locked": []}

@app.get("/api/dashboard/{username}")
def get_dashboard(username: str):
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "get_dashboard_data", "--args", f"username={username}"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"username": username, "study_streak": 0, "total_time": 0, "completed_chapters": 0, "total_chapters": 0, "enrolled_classrooms": []}
    except:
        return {"username": username, "study_streak": 0, "total_time": 0, "completed_chapters": 0, "total_chapters": 0, "enrolled_classrooms": []}

@app.get("/api/classrooms")
def get_classrooms():
    return {
        "classrooms": [
            {
                "name": "Jac Basics Virtual Lab",
                "instructor": "Dr. Sarah Chen",
                "capacity": 30,
                "active_students": 15,
                "available_spots": 15,
                "meeting_url": "https://meet.jaseci.org/jac-basics",
                "is_live": True,
                "whiteboard_content": "Today: Hello World & Node Creation",
                "chat_enabled": True,
                "recording_enabled": True,
                "breakout_rooms": 3,
                "screen_sharing": True,
                "current_presenter": "Dr. Sarah Chen",
                "participants": [
                    {"username": "Alice", "role": "student", "is_muted": False, "camera_on": True, "hand_raised": False},
                    {"username": "Bob", "role": "student", "is_muted": True, "camera_on": False, "hand_raised": True}
                ]
            },
            {
                "name": "Advanced Jac Workshop",
                "instructor": "Prof. Michael Rodriguez",
                "capacity": 25,
                "active_students": 8,
                "available_spots": 17,
                "meeting_url": "https://meet.jaseci.org/advanced-jac",
                "is_live": False,
                "whiteboard_content": "Next Session: Walker Patterns",
                "chat_enabled": True,
                "recording_enabled": True,
                "breakout_rooms": 2,
                "screen_sharing": False,
                "current_presenter": "",
                "participants": [
                    {"username": "David", "role": "student", "is_muted": False, "camera_on": True, "hand_raised": False}
                ]
            }
        ]
    }

@app.get("/api/schedule")
def get_schedule():
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "get_schedule"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"events": []}
    except:
        return {"events": []}

@app.get("/api/test")
def test_endpoint():
    return {"status": "working", "message": "Server is running"}

@app.post("/api/join-classroom")
def join_classroom(req: dict):
    username = req.get('username', 'Student')
    classroom_name = req.get('classroom_name', 'Unknown')
    return {
        "success": True,
        "message": f"{username} joined {classroom_name}",
        "meeting_url": "https://meet.jaseci.org/jac-basics",
        "is_live": True
    }

@app.get("/api/chapters/{topic_name}")
def get_chapters(topic_name: str):
    # Return new Jaseci documentation tour structure
    if topic_name == "Jac Basics":
        return {
            "topic": "Jac Basics",
            "chapters": [
                {
                    "title": "Hello World",
                    "content": "# Hello World\n\nLet's start with the classic Hello World program in Jac.\n\n```jac\nwalker init {\n    can run {\n        print(\"Hello World!\");\n    }\n}\n```\n\nTo run this program:\n1. Save it as hello.jac\n2. Run: jac run hello.jac\n\nThe walker init is the entry point of your Jac program.",
                    "order": 1
                },
                {
                    "title": "Nodes",
                    "content": "# Nodes\n\nNodes are the fundamental building blocks in Jac.\n\n## Creating Nodes\n```jac\nnode person {\n    has name: str;\n    has age: int;\n}\n\nwalker init {\n    can run {\n        p = spawn here ++> person(name=\"Alice\", age=25);\n        print(f\"Created person: {p.name}, age {p.age}\");\n    }\n}\n```\n\n## Node Properties\n- Nodes can have properties defined with 'has'\n- Properties can have default values\n- Nodes are spawned using the 'spawn' keyword",
                    "order": 2
                },
                {
                    "title": "Edges",
                    "content": "# Edges\n\nEdges represent relationships between nodes.\n\n## Creating Edges\n```jac\nedge friendship {\n    has strength: float = 1.0;\n    has since: str;\n}\n\nnode person {\n    has name: str;\n}\n\nwalker init {\n    can run {\n        alice = spawn here ++> person(name=\"Alice\");\n        bob = spawn here ++> person(name=\"Bob\");\n        alice ++> friendship(strength=0.8, since=\"2020\") ++> bob;\n    }\n}\n```\n\n## Edge Directions\n- ++> creates a directed edge\n- <--> creates a bidirectional edge",
                    "order": 3
                }
            ]
        }
    elif topic_name == "Walkers":
        return {
            "topic": "Walkers",
            "chapters": [
                {
                    "title": "Walkers",
                    "content": "# Walkers\n\nWalkers are active components that traverse graphs.\n\n## Basic Walker\n```jac\nnode person {\n    has name: str;\n}\n\nwalker greet {\n    can speak with person entry {\n        print(f\"Hello {here.name}!\");\n    }\n}\n```\n\n## Walker Abilities\n- Walkers have 'abilities' defined with 'can'\n- 'entry' ability executes when walker visits a node\n- Abilities can be specific to node types",
                    "order": 1
                },
                {
                    "title": "Graph Traversal",
                    "content": "# Graph Traversal\n\nWalkers can traverse graphs using various patterns.\n\n## Basic Traversal\n```jac\nnode person { has name: str; }\nedge friendship { has years: int; }\n\nwalker find_friends {\n    can explore with person entry {\n        for friend in here --> friendship --> person {\n            print(f\"Friend: {friend.name}\");\n        }\n    }\n}\n```\n\n## Filtered Traversal\n```jac\nwalker find_close_friends {\n    can explore with person entry {\n        close_friends = here --> friendship[years >= 5] --> person;\n    }\n}\n```",
                    "order": 2
                },
                {
                    "title": "Abilities",
                    "content": "# Abilities\n\nAbilities define what walkers can do with different node types.\n\n## Node-Specific Abilities\n```jac\nnode person { has name: str; }\nnode place { has name: str; }\n\nwalker greeter {\n    can greet_person with person entry {\n        print(f\"Hello {here.name}!\");\n    }\n    \n    can visit_place with place entry {\n        print(f\"Visiting {here.name}\");\n    }\n}\n```\n\n## Entry and Exit Abilities\n- entry: Executes when walker starts\n- exit: Executes when walker finishes",
                    "order": 3
                }
            ]
        }
    elif topic_name == "Advanced Jac":
        return {
            "topic": "Advanced Jac",
            "chapters": [
                {
                    "title": "Variables and Data Types",
                    "content": "# Variables and Data Types\n\nJac supports various data types.\n\n## Basic Data Types\n```jac\nwalker data_demo {\n    can run {\n        name: str = \"Alice\";\n        age: int = 25;\n        height: float = 5.6;\n        is_student: bool = true;\n    }\n}\n```\n\n## Collections\n```jac\nnumbers: list = [1, 2, 3, 4, 5];\nperson: dict = {\"name\": \"Bob\", \"age\": 30};\n```",
                    "order": 1
                },
                {
                    "title": "Control Flow",
                    "content": "# Control Flow\n\nJac provides standard control flow constructs.\n\n## Conditional Statements\n```jac\nwalker age_checker {\n    can check with person entry {\n        if (here.age >= 18) {\n            print(f\"{here.name} is an adult\");\n        } elif (here.age >= 13) {\n            print(f\"{here.name} is a teenager\");\n        } else {\n            print(f\"{here.name} is a child\");\n        }\n    }\n}\n```\n\n## Loops\n```jac\nfor i in range(5) {\n    print(f\"Count: {i}\");\n}\n```",
                    "order": 2
                },
                {
                    "title": "Functions and Methods",
                    "content": "# Functions and Methods\n\nJac supports functions for code reusability.\n\n## Basic Functions\n```jac\ncan add_numbers(a: int, b: int) -> int {\n    return a + b;\n}\n\nwalker math_demo {\n    can run {\n        result = add_numbers(5, 3);\n        print(f\"5 + 3 = {result}\");\n    }\n}\n```\n\n## Walker Methods\n```jac\nwalker calculator {\n    has total: float = 0.0;\n    \n    can add(value: float) {\n        total += value;\n    }\n}\n```",
                    "order": 3
                }
            ]
        }
    elif topic_name == "Modules & Testing":
        return {
            "topic": "Modules & Testing",
            "chapters": [
                {
                    "title": "Imports and Modules",
                    "content": "# Imports and Modules\n\nJac supports importing functionality from other modules.\n\n## Standard Library Imports\n```jac\nimport:py from datetime { datetime };\nimport:py from random { randint };\n\nwalker time_demo {\n    can run {\n        now = datetime.now();\n        random_num = randint(1, 100);\n    }\n}\n```\n\n## Jac Module Imports\n```jac\nimport { format_name } from \"utils.jac\";\n```",
                    "order": 1
                },
                {
                    "title": "Error Handling",
                    "content": "# Error Handling\n\nJac provides mechanisms to handle errors gracefully.\n\n## Try-Catch Blocks\n```jac\nwalker safe_division {\n    can divide(a: float, b: float) -> float {\n        try {\n            result = a / b;\n            return result;\n        } except ZeroDivisionError {\n            print(\"Error: Cannot divide by zero\");\n            return 0.0;\n        }\n    }\n}\n```\n\n## Validation\n- Check input parameters\n- Validate data before processing",
                    "order": 2
                },
                {
                    "title": "Testing",
                    "content": "# Testing\n\nTesting is crucial for ensuring your Jac programs work correctly.\n\n## Basic Testing\n```jac\ncan add(a: int, b: int) -> int {\n    return a + b;\n}\n\ncan test_add() {\n    result = add(2, 3);\n    assert result == 5, f\"Expected 5, got {result}\";\n    print(\"test_add passed\");\n}\n```\n\n## Testing Walkers\n```jac\nwalker test_increment {\n    can run {\n        c = spawn here ++> counter(value=5);\n        spawn c walker increment_walker();\n        assert c.value == 6;\n    }\n}\n```",
                    "order": 3
                }
            ]
        }
    # Support old topic names for backward compatibility
    elif topic_name == "OSP Graphs":
        return {
            "topic": "OSP Graphs",
            "chapters": [
                {
                    "title": "Variables and Data Types",
                    "content": "# Variables and Data Types\n\nJac supports various data types.\n\n## Basic Data Types\n```jac\nwalker data_demo {\n    can run {\n        name: str = \"Alice\";\n        age: int = 25;\n        height: float = 5.6;\n        is_student: bool = true;\n    }\n}\n```\n\n## Collections\n```jac\nnumbers: list = [1, 2, 3, 4, 5];\nperson: dict = {\"name\": \"Bob\", \"age\": 30};\n```",
                    "order": 1
                },
                {
                    "title": "Control Flow",
                    "content": "# Control Flow\n\nJac provides standard control flow constructs.\n\n## Conditional Statements\n```jac\nwalker age_checker {\n    can check with person entry {\n        if (here.age >= 18) {\n            print(f\"{here.name} is an adult\");\n        } elif (here.age >= 13) {\n            print(f\"{here.name} is a teenager\");\n        } else {\n            print(f\"{here.name} is a child\");\n        }\n    }\n}\n```\n\n## Loops\n```jac\nfor i in range(5) {\n    print(f\"Count: {i}\");\n}\n```",
                    "order": 2
                },
                {
                    "title": "Functions and Methods",
                    "content": "# Functions and Methods\n\nJac supports functions for code reusability.\n\n## Basic Functions\n```jac\ncan add_numbers(a: int, b: int) -> int {\n    return a + b;\n}\n\nwalker math_demo {\n    can run {\n        result = add_numbers(5, 3);\n        print(f\"5 + 3 = {result}\");\n    }\n}\n```\n\n## Walker Methods\n```jac\nwalker calculator {\n    has total: float = 0.0;\n    \n    can add(value: float) {\n        total += value;\n    }\n}\n```",
                    "order": 3
                }
            ]
        }
    elif topic_name == "byLLM Agents":
        return {
            "topic": "byLLM Agents",
            "chapters": [
                {
                    "title": "Imports and Modules",
                    "content": "# Imports and Modules\n\nJac supports importing functionality from other modules.\n\n## Standard Library Imports\n```jac\nimport:py from datetime { datetime };\nimport:py from random { randint };\n\nwalker time_demo {\n    can run {\n        now = datetime.now();\n        random_num = randint(1, 100);\n    }\n}\n```\n\n## Jac Module Imports\n```jac\nimport { format_name } from \"utils.jac\";\n```",
                    "order": 1
                },
                {
                    "title": "Error Handling",
                    "content": "# Error Handling\n\nJac provides mechanisms to handle errors gracefully.\n\n## Try-Catch Blocks\n```jac\nwalker safe_division {\n    can divide(a: float, b: float) -> float {\n        try {\n            result = a / b;\n            return result;\n        } except ZeroDivisionError {\n            print(\"Error: Cannot divide by zero\");\n            return 0.0;\n        }\n    }\n}\n```\n\n## Validation\n- Check input parameters\n- Validate data before processing",
                    "order": 2
                },
                {
                    "title": "Testing",
                    "content": "# Testing\n\nTesting is crucial for ensuring your Jac programs work correctly.\n\n## Basic Testing\n```jac\ncan add(a: int, b: int) -> int {\n    return a + b;\n}\n\ncan test_add() {\n    result = add(2, 3);\n    assert result == 5, f\"Expected 5, got {result}\";\n    print(\"test_add passed\");\n}\n```\n\n## Testing Walkers\n```jac\nwalker test_increment {\n    can run {\n        c = spawn here ++> counter(value=5);\n        spawn c walker increment_walker();\n        assert c.value == 6;\n    }\n}\n```",
                    "order": 3
                }
            ]
        }
    elif topic_name == "Jac Client":
        return {
            "topic": "Jac Client",
            "chapters": [
                {
                    "title": "Imports and Modules",
                    "content": "# Imports and Modules\n\nJac supports importing functionality from other modules.\n\n## Standard Library Imports\n```jac\nimport:py from datetime { datetime };\nimport:py from random { randint };\n\nwalker time_demo {\n    can run {\n        now = datetime.now();\n        random_num = randint(1, 100);\n    }\n}\n```\n\n## Jac Module Imports\n```jac\nimport { format_name } from \"utils.jac\";\n```",
                    "order": 1
                },
                {
                    "title": "Error Handling",
                    "content": "# Error Handling\n\nJac provides mechanisms to handle errors gracefully.\n\n## Try-Catch Blocks\n```jac\nwalker safe_division {\n    can divide(a: float, b: float) -> float {\n        try {\n            result = a / b;\n            return result;\n        } except ZeroDivisionError {\n            print(\"Error: Cannot divide by zero\");\n            return 0.0;\n        }\n    }\n}\n```\n\n## Validation\n- Check input parameters\n- Validate data before processing",
                    "order": 2
                },
                {
                    "title": "Testing",
                    "content": "# Testing\n\nTesting is crucial for ensuring your Jac programs work correctly.\n\n## Basic Testing\n```jac\ncan add(a: int, b: int) -> int {\n    return a + b;\n}\n\ncan test_add() {\n    result = add(2, 3);\n    assert result == 5, f\"Expected 5, got {result}\";\n    print(\"test_add passed\");\n}\n```\n\n## Testing Walkers\n```jac\nwalker test_increment {\n    can run {\n        c = spawn here ++> counter(value=5);\n        spawn c walker increment_walker();\n        assert c.value == 6;\n    }\n}\n```",
                    "order": 3
                }
            ]
        }
    else:
        return {"topic": topic_name, "chapters": []}

@app.post("/api/complete-chapter")
def complete_chapter(req: dict):
    username = req.get('username', 'Doris')
    chapter_title = req.get('chapter_title', 'Unknown Chapter')
    
    return {
        "success": True, 
        "message": f"Chapter '{chapter_title}' completed!",
        "username": username,
        "chapter_title": chapter_title
    }

if __name__ == "__main__":
    # Initialize data on startup
    print("Initializing data...")
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "init"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            print("Data initialized successfully")
        else:
            print(f"Init warning: {result.stderr}")
    except Exception as e:
        print(f"Init error: {e}")
    
    print("Server: http://localhost:8000")
    print("Frontend: http://localhost:3000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
