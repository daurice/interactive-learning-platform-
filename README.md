# Interactive Learning Platform for Jaseci

AI-powered learning platform built with **Jac 0.9.3** featuring OSP graphs, byLLM integration, and multi-agent systems.

## Features

- **byLLM Integration** - AI quiz generation and answer evaluation
- **OSP Graph** - Knowledge graph with topics, learners, mastery tracking
- **Walkers** - Graph traversal for all business logic
- **Multi-Agent System** - Planner, Generator, Analyzer agents
- **React Frontend** - Modern UI with Monaco code editor

---

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv jac_env
source jac_env/bin/activate  # Linux/Mac
# or
jac_env\Scripts\activate     # Windows

# Install Python packages
pip install -r requirements.txt

# Install Node.js packages
cd frontend
npm install
cd ..
```

### 2. Configure API Key

```bash
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here
# Get free key: https://aistudio.google.com/app/apikey
```

### 3. Initialize Data

```bash
jac run main.jac -w init
```

### 4. Run Application

```bash
# Terminal 1: Backend
python server.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open browser: `http://localhost:3000`

---

## Project Structure

```
interactive-learning-platform/
├── main.jac           # Backend: OSP graph, walkers, byLLM
├── agents.jac         # Multi-agent system
├── server.py          # FastAPI REST API
├── frontend/          # React UI with Monaco editor
├── requirements.txt   # Python dependencies
└── .env.example       # Configuration template
```

---

## Jaseci Features Implemented

### 1. OSP (Object-Spatial Programming)
```jac
node topic { has name: str; has difficulty: int; }
node learner { has username: str; }
edge mastery { has score: float; }
edge prerequisite { has required_score: float; }
```

### 2. byLLM Integration
```jac
walker generate_quiz {
    has topic_name: str;
    can generate with entry {
        quiz = llm.generate(f"Create quiz for {topic_name}");
        report {"type":"quiz", "quiz":quiz};
    }
}
```

### 3. Walkers
- `init` - Initialize knowledge graph
- `generate_quiz` - AI quiz generation
- `evaluate_answer` - Answer assessment
- `execute_code` - Code execution
- `get_topics` - Fetch topics
- `get_learner_progress` - Track mastery

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/execute` | POST | Execute Jac code |
| `/api/topics` | GET | Get all topics |
| `/api/quiz` | POST | Generate AI quiz |
| `/api/evaluate` | POST | Evaluate answer |
| `/api/progress/{username}` | GET | Get user progress |

---

## Testing

```bash
# Test walkers directly
jac run main.jac -w generate_quiz --args topic_name="Walkers"
jac run main.jac -w get_learner_progress --args username="Alice"

# Test API
curl http://localhost:8000/api/topics
curl -X POST http://localhost:8000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{"topic_name": "Walkers", "difficulty": 2}'
```

---

## Hackathon Requirements Met

- Jac programming language as core framework
- OSP implementation (knowledge graph)
- byLLM integration (AI quiz generation)
- Walkers (graph traversal)
- Clean GitHub repository
- README with setup instructions
- Modular code structure
- Working demo

---

## Technologies

- **Jac 0.9.3** - Core language
- **byLLM** - LLM integration
- **FastAPI** - REST API
- **React** - Frontend UI
- **Monaco Editor** - Code editor
- **Gemini AI** - Quiz generation

---

## License

MIT License

**Built with love for Jaseci AI Hackathon**
