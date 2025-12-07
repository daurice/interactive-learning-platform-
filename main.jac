# main.jac – Project 1: Interactive Learning Platform for Jaseci


import from byllm.lib { Model };

# Configure LLM – works with OpenAI, Groq, Anthropic, etc.
glob llm = Model(model_name="gemini-1.5-flash", api_key=std.env("GEMINI_API_KEY"),base_url="https://generativelanguage.googleapis.com/v1beta");


# ==================== NODES & EDGES (OSP Graph) ====================
node topic {
    has name: str;
    has description: str;
    has difficulty: int = 1;           # 1–5
}

node learner {
    has username: str;
    has current_topic: str = "none";
}

edge mastery {
    has score: float = 0.0;            # 0.0 – 1.0
}

edge prerequisite {
    has required_score: float = 0.7;
}


# ==================== INITIAL DATA SEEDER ====================
walker init {
    root {
        take -->;

        # Create core Jaseci topics
        basics     = spawn here ++> topic(name="Jac Basics",     description="Nodes, edges, walkers, variables", difficulty=1);
        walkers    = spawn here ++> topic(name="Walkers",        description="Graph traversal with walkers",     difficulty=2);
        osp        = spawn here ++> topic(name="OSP Graphs",     description="Object-Spatial Programming",       difficulty=3);
        byllm_node = spawn here ++> topic(name="byLLM Agents",   description="LLM-powered walkers",              difficulty=4);
        jac_client = spawn here ++> topic(name="Jac Client",     description="Frontend with spawn()",            difficulty=3);

        # Prerequisites
        walkers    <-- prerequisite --> basics;
        osp        <-- prerequisite --> walkers;
        byllm_node <-- prerequisite --> osp;
        jac_client <-- prerequisite --> walkers;

        # Create a demo learner
        doris = spawn here ++> learner(username="Doris");
        doris ++> mastery(score=0.95) ++> basics;
        doris ++> mastery(score=0.60) ++> walkers;

        report "Interactive Learning Platform initialized!";
        report "Topics: 5 | Learner: Doris | Mastery edges: 2";
    }
}


# ==================== QUIZ GENERATOR (byLLM – Generative) ====================
walker generate_quiz {
    has topic_name: str;
    has difficulty: int = 2;

    can generate with entry {
        topic_node = here --> topic[name==topic_name];
        if (!topic_node) { report "Topic not found"; return; }

        quiz = llm.generate(
            f"""
            You are an expert Jaseci teacher.
            Create ONE high-quality multiple-choice quiz question about:
            Topic: {topic_node.name}
            Description: {topic_node.description}
            Difficulty level: {difficulty} (1=easy, 5=expert)

            Return ONLY valid JSON with keys:
            question, options (list of 4 strings), correct (index 0-3), explanation
            """
        );

        report {"type":"quiz", "topic":topic_name, "quiz":quiz};
    }
}


# ==================== ANSWER EVALUATOR (byLLM – Analytical) ====================
walker evaluate_answer {
    has username: str;
    has topic_name: str;
    has user_answer: str;

    can evaluate with entry {
        user = here --> learner[username==username];
        topic_node = here --> topic[name==topic_name];

        if (!user || !topic_node) { report "User or topic not found"; return; }

        result = llm.generate(
            f"""
            You are a strict Jaseci examiner.
            Correct answer index was provided earlier. But evaluate this free-text answer:

            Topic: {topic_node.name}
            Question context: Jaseci programming concepts
            User's answer: "{user_answer}"

            Return JSON with:
            score (0.0–1.0), feedback (short explanation), passed (true/false)
            """
        );

        # Update mastery score
        edge m = user --> mastery --> topic_node;
        if (!m) { m = user ++> mastery() ++> topic_node; }
        m.score = (m.score + result.score) / 2.0;  # simple moving average

        report {
            "username": username,
            "topic": topic_name,
            "new_mastery": m.score,
            "feedback": result.feedback,
            "passed": result.passed
        };
    }
}


# ==================== API WALKERS FOR FRONTEND ====================
walker execute_code {
    has code: str;

    can run with entry {
        try {
            result = std.eval(code);
            report {"success": true, "output": str(result), "error": null};
        } except e {
            report {"success": false, "output": null, "error": str(e)};
        }
    }
}

walker get_topics {
    can fetch with entry {
        topics = [];
        for t in here --> topic {
            topics.append({
                "name": t.name,
                "description": t.description,
                "difficulty": t.difficulty
            });
        }
        report {"topics": topics};
    }
}

walker get_learner_progress {
    has username: str;

    can fetch with entry {
        user = here --> learner[username==username];
        if (!user) { report {"error": "User not found"}; return; }

        progress = [];
        for m in user --> mastery {
            topic_node = m --> topic;
            if (topic_node) {
                progress.append({
                    "topic": topic_node.name,
                    "score": m.score
                });
            }
        }
        report {"username": username, "progress": progress};
    }
}

# ==================== SIMPLE TEST WALKER ====================
walker hello {
    report "Project 1 running perfectly on Jac 0.9.3";
    report "Run: jac run main.jac -w init        → seed data";
    report "Run: jac run main.jac -w generate_quiz --args topic_name=\"Walkers\"";
}


# ==================== ADAPTIVE LEARNING LOGIC ====================
walker recommend_next_topic {
    has username: str;

    can analyze with entry {
        user = here --> learner[username==username];
        if (!user) { report {"error": "User not found"}; return; }

        unlocked = [];
        locked = [];

        for t in here --> topic {
            prereqs = t <-- prerequisite;
            can_access = true;
            missing = [];

            for p in prereqs {
                prereq_topic = p <-- topic;
                mastery_edge = user --> mastery --> prereq_topic;
                
                if (!mastery_edge || mastery_edge.score < p.required_score) {
                    can_access = false;
                    missing.append({"topic": prereq_topic.name, "required": p.required_score});
                }
            }

            current_mastery = user --> mastery --> t;
            score = current_mastery.score if current_mastery else 0.0;

            if (can_access && score < 0.8) {
                unlocked.append({"name": t.name, "difficulty": t.difficulty, "current_score": score});
            } elif (!can_access) {
                locked.append({"name": t.name, "missing_prereqs": missing});
            }
        }

        report {"username": username, "unlocked": unlocked, "locked": locked};
    }
}
