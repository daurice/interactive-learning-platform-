#!/usr/bin/env python3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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

@app.post("/api/execute")
def execute_code(req: CodeRequest):
    return {"success": True, "output": f"Code received:\n{req.code}"}

@app.get("/api/topics")
def get_topics():
    return {
        "topics": [
            {"name": "Jac Basics", "description": "Nodes, edges, walkers", "difficulty": 1},
            {"name": "Walkers", "description": "Graph traversal", "difficulty": 2},
            {"name": "OSP Graphs", "description": "Object-Spatial Programming", "difficulty": 3},
            {"name": "byLLM Agents", "description": "LLM-powered walkers", "difficulty": 4},
            {"name": "Jac Client", "description": "Frontend with spawn()", "difficulty": 3}
        ]
    }

@app.post("/api/quiz")
def generate_quiz(req: QuizRequest):
    return {
        "type": "quiz",
        "topic": req.topic_name,
        "quiz": f"Sample quiz for {req.topic_name}\n\nQuestion: What is {req.topic_name}?\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4"
    }

@app.get("/api/progress/{username}")
def get_progress(username: str):
    return {
        "username": username,
        "progress": [
            {"topic": "Jac Basics", "score": 0.95},
            {"topic": "Walkers", "score": 0.60}
        ]
    }

if __name__ == "__main__":
    print("Server: http://localhost:8000")
    print("Frontend: http://localhost:3000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
