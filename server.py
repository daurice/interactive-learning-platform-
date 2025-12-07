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

@app.post("/api/execute")
def execute_code(req: CodeRequest):
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jac', delete=False) as f:
            f.write(req.code)
            temp_path = f.name
        
        result = subprocess.run(
            ["jac", "check", temp_path],
            capture_output=True, text=True, timeout=5
        )
        
        os.unlink(temp_path)
        
        if result.returncode == 0:
            return {"success": True, "output": "Code is valid"}
        return {"success": False, "error": result.stderr or result.stdout}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/topics")
def get_topics():
    try:
        result = subprocess.run(
            ["jac", "run", "main.jac", "-w", "get_topics"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return {"topics": []}
    except:
        return {"topics": []}

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

if __name__ == "__main__":
    print("Server: http://localhost:8000")
    print("Frontend: http://localhost:3000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
