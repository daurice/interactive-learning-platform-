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
    has study_streak: int = 0;
    has total_time: int = 0;
}

node chapter {
    has title: str;
    has content: str;
    has order: int;
}

node classroom {
    has name: str;
    has instructor: str;
    has capacity: int = 30;
    has active_students: int = 0;
}

node schedule_event {
    has title: str;
    has date: str;
    has time: str;
    has type: str;  # "class", "quiz", "assignment"
}

edge mastery {
    has score: float = 0.0;            # 0.0 – 1.0
}

edge prerequisite {
    has required_score: float = 0.7;
}

edge enrollment {
    has joined_date: str;
}

edge chapter_progress {
    has completed: bool = false;
    has completion_date: str = "";
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

        # Create chapters for Jac Basics
        ch1 = spawn basics ++> chapter(title="Introduction to Jac", content="Learn the basics of Jac programming language", order=1);
        ch2 = spawn basics ++> chapter(title="Nodes and Edges", content="Understanding graph structures in Jac", order=2);
        ch3 = spawn basics ++> chapter(title="Variables and Types", content="Working with data in Jac", order=3);

        # Create virtual classrooms
        beginner_class = spawn here ++> classroom(name="Jac Beginners", instructor="Dr. Smith", capacity=25, active_students=12);
        advanced_class = spawn here ++> classroom(name="Advanced OSP", instructor="Prof. Johnson", capacity=20, active_students=8);

        # Create schedule events
        event1 = spawn here ++> schedule_event(title="Jac Basics Workshop", date="2024-01-15", time="10:00 AM", type="class");
        event2 = spawn here ++> schedule_event(title="OSP Quiz", date="2024-01-17", time="2:00 PM", type="quiz");
        event3 = spawn here ++> schedule_event(title="Walker Assignment", date="2024-01-20", time="11:59 PM", type="assignment");

        # Create a demo learner
        doris = spawn here ++> learner(username="Doris", study_streak=5, total_time=120);
        doris ++> mastery(score=0.95) ++> basics;
        doris ++> mastery(score=0.60) ++> walkers;
        doris ++> enrollment(joined_date="2024-01-10") ++> beginner_class;
        doris ++> chapter_progress(completed=true, completion_date="2024-01-12") ++> ch1;
        doris ++> chapter_progress(completed=true, completion_date="2024-01-14") ++> ch2;

        report "Interactive Learning Platform initialized!";
        report "Topics: 5 | Learner: Doris | Chapters: 3 | Classrooms: 2 | Events: 3";
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

walker recommend_next_topic {
    has username: str;

    can analyze with entry {
        user = here --> learner[username==username];
        if (!user) { report {"error": "User not found"}; return; }

        unlocked = [];
        locked = [];

        for t in here --> topic {
            can_access = true;
            missing = [];
            current_score = 0.0;
            
            for m in user --> mastery {
                check_topic = m --> topic;
                if (check_topic and check_topic.name == t.name) {
                    current_score = m.score;
                    break;
                }
            }

            for prereq_edge in t <-- prerequisite {
                prereq_topic = prereq_edge <-- topic;
                if (prereq_topic) {
                    user_has_mastery = false;
                    user_score = 0.0;
                    
                    for m in user --> mastery {
                        check_topic = m --> topic;
                        if (check_topic and check_topic.name == prereq_topic.name) {
                            user_has_mastery = true;
                            user_score = m.score;
                            break;
                        }
                    }
                    
                    if (!user_has_mastery or user_score < prereq_edge.required_score) {
                        can_access = false;
                        missing.append({"topic": prereq_topic.name, "required": prereq_edge.required_score});
                    }
                }
            }

            if (can_access and current_score < 0.8) {
                unlocked.append({"name": t.name, "difficulty": t.difficulty, "current_score": current_score});
            } else {
                if (!can_access) {
                    locked.append({"name": t.name, "missing_prereqs": missing});
                }
            }
        }

        report {"username": username, "unlocked": unlocked, "locked": locked};
    }
}

walker complete_chapter {
    has username: str;
    has chapter_title: str;

    can complete with entry {
        user = here --> learner[username==username];
        if (!user) { report {"error": "User not found"}; return; }

        chapter_node = None;
        for ch in here --> topic --> chapter {
            if (ch.title == chapter_title) {
                chapter_node = ch;
                break;
            }
        }
        
        if (!chapter_node) { report {"error": "Chapter not found"}; return; }
        
        progress = user --> chapter_progress --> chapter_node;
        if (!progress) {
            progress = user ++> chapter_progress(completed=true, completion_date="2024-01-15") ++> chapter_node;
        } else {
            progress.completed = true;
            progress.completion_date = "2024-01-15";
        }
        
        user.study_streak += 1;
        user.total_time += 30;
        
        report {"success": true, "message": f"Chapter '{chapter_title}' completed!"};
    }
}

# ==================== NEW FEATURE WALKERS ====================
walker get_dashboard_data {
    has username: str;

    can fetch with entry {
        user = here --> learner[username==username];
        if (!user) { report {"error": "User not found"}; return; }

        # Get user stats
        completed_chapters = 0;
        total_chapters = 0;
        for ch in here --> topic --> chapter {
            total_chapters += 1;
            progress = user --> chapter_progress --> ch;
            if (progress and progress.completed) {
                completed_chapters += 1;
            }
        }

        # Get enrolled classrooms
        classrooms = [];
        for enrollment_edge in user --> enrollment {
            classroom = enrollment_edge --> classroom;
            if (classroom) {
                classrooms.append({"name": classroom.name, "instructor": classroom.instructor});
            }
        }

        report {
            "username": username,
            "study_streak": user.study_streak,
            "total_time": user.total_time,
            "completed_chapters": completed_chapters,
            "total_chapters": total_chapters,
            "enrolled_classrooms": classrooms
        };
    }
}

walker get_classrooms {
    can fetch with entry {
        classrooms = [];
        for c in here --> classroom {
            classrooms.append({
                "name": c.name,
                "instructor": c.instructor,
                "capacity": c.capacity,
                "active_students": c.active_students,
                "available_spots": c.capacity - c.active_students
            });
        }
        report {"classrooms": classrooms};
    }
}

walker get_schedule {
    can fetch with entry {
        events = [];
        for e in here --> schedule_event {
            events.append({
                "title": e.title,
                "date": e.date,
                "time": e.time,
                "type": e.type
            });
        }
        report {"events": events};
    }
}

walker get_chapters {
    has topic_name: str;

    can fetch with entry {
        topic_node = here --> topic[name==topic_name];
        if (!topic_node) { report {"error": "Topic not found"}; return; }

        chapters = [];
        for ch in topic_node --> chapter {
            chapters.append({
                "title": ch.title,
                "content": ch.content,
                "order": ch.order
            });
        }
        report {"topic": topic_name, "chapters": chapters};
    }
}

walker join_classroom {
    has username: str;
    has classroom_name: str;

    can join with entry {
        user = here --> learner[username==username];
        classroom = here --> classroom[name==classroom_name];
        
        if (!user or !classroom) { report {"error": "User or classroom not found"}; return; }
        if (classroom.active_students >= classroom.capacity) { report {"error": "Classroom is full"}; return; }
        
        # Check if already enrolled
        existing = user --> enrollment --> classroom;
        if (existing) { report {"error": "Already enrolled"}; return; }
        
        user ++> enrollment(joined_date="2024-01-15") ++> classroom;
        classroom.active_students += 1;
        
        report {"success": true, "message": f"Joined {classroom_name} successfully"};
    }
}

# ==================== SIMPLE TEST WALKER ====================
walker hello {
    report "Project 1 running perfectly on Jac 0.9.3";
    report "Run: jac run main.jac -w init        → seed data";
    report "Run: jac run main.jac -w get_dashboard_data --args username=\"Doris\"";
}
