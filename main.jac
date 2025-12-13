# main.jac – Interactive Learning Platform for Jaseci

import from byllm.lib { Model };

# Configure LLM – works with Gemini.
glob llm = Model(model_name="gemini-1.5-flash", api_key=std.env("GEMINI_API_KEY"),base_url="https://generativelanguage.googleapis.com/v1beta");

# ==================== NODES & EDGES (OSP Graph) ====================
node topic {
    has name: str;
    has description: str;
    has difficulty: int = 1;
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

edge mastery {
    has score: float = 0.0;
}

edge prerequisite {
    has required_score: float = 0.7;
}

edge chapter_progress {
    has completed: bool = false;
    has completion_date: str = "";
}

node virtual_classroom {
    has name: str;
    has instructor: str;
    has capacity: int = 50;
    has active_students: int = 0;
    has meeting_url: str;
    has is_live: bool = false;
    has whiteboard_content: str = "";
    has chat_enabled: bool = true;
    has recording_enabled: bool = true;
    has breakout_rooms: int = 0;
    has screen_sharing: bool = false;
    has current_presenter: str = "";
}

node participant {
    has username: str;
    has role: str = "student";  # student, instructor, moderator
    has is_muted: bool = false;
    has camera_on: bool = true;
    has hand_raised: bool = false;
    has join_time: str;
}

edge classroom_session {
    has joined_at: str;
    has participation_score: float = 0.0;
}

edge breakout_assignment {
    has room_number: int;
    has assigned_at: str;
}

# ==================== INITIAL DATA SEEDER ====================
walker init {
    root {
        take -->;

        # Create core Jaseci topics based on official tour
        basics = spawn here ++> topic(name="Jac Basics", description="Hello World, Nodes, Edges", difficulty=1);
        walkers = spawn here ++> topic(name="Walkers", description="Graph traversal and abilities", difficulty=2);
        advanced = spawn here ++> topic(name="Advanced Jac", description="Variables, control flow, functions", difficulty=3);
        modules = spawn here ++> topic(name="Modules & Testing", description="Imports and testing", difficulty=4);

        # Prerequisites
        walkers <-- prerequisite --> basics;
        advanced <-- prerequisite --> walkers;
        modules <-- prerequisite --> advanced;

        # Chapter 1: Hello World
        ch1 = spawn basics ++> chapter(title="Hello World", content="# Hello World\n\nLet's start with the classic Hello World program in Jac.\n\n```jac\nwalker init {\n    can run {\n        print(\"Hello World!\");\n    }\n}\n```\n\nTo run this program:\n1. Save it as hello.jac\n2. Run: jac run hello.jac\n\nThe walker init is the entry point of your Jac program. When you run the program, it automatically executes the init walker.", order=1);

        # Chapter 2: Nodes
        ch2 = spawn basics ++> chapter(title="Nodes", content="# Nodes\n\nNodes are the fundamental building blocks in Jac. They represent entities in your graph.\n\n## Creating Nodes\n```jac\nnode person {\n    has name: str;\n    has age: int;\n}\n\nwalker init {\n    can run {\n        # Create a person node\n        p = spawn here ++> person(name=\"Alice\", age=25);\n        print(f\"Created person: {p.name}, age {p.age}\");\n    }\n}\n```\n\n## Node Properties\n- Nodes can have properties (attributes) defined with 'has'\n- Properties can have default values\n- Nodes are spawned using the 'spawn' keyword\n\n## Example: Student Node\n```jac\nnode student {\n    has name: str;\n    has grade: float = 0.0;\n    has enrolled: bool = false;\n}\n```", order=2);

        # Chapter 3: Edges
        ch3 = spawn basics ++> chapter(title="Edges", content="# Edges\n\nEdges represent relationships between nodes in your graph.\n\n## Creating Edges\n```jac\nedge friendship {\n    has strength: float = 1.0;\n    has since: str;\n}\n\nnode person {\n    has name: str;\n}\n\nwalker init {\n    can run {\n        alice = spawn here ++> person(name=\"Alice\");\n        bob = spawn here ++> person(name=\"Bob\");\n        \n        # Connect with friendship edge\n        alice ++> friendship(strength=0.8, since=\"2020\") ++> bob;\n        \n        print(\"Alice and Bob are now friends!\");\n    }\n}\n```\n\n## Edge Directions\n- ++> creates a directed edge (one-way)\n- <--> creates a bidirectional edge (two-way)\n- Edges can have properties just like nodes", order=3);

        # Chapter 4: Walkers
        wch1 = spawn walkers ++> chapter(title="Walkers", content="# Walkers\n\nWalkers are the active components in Jac that traverse and operate on your graph.\n\n## Basic Walker\n```jac\nnode person {\n    has name: str;\n}\n\nwalker greet {\n    can speak with person entry {\n        print(f\"Hello {here.name}!\");\n    }\n}\n\nwalker init {\n    can run {\n        alice = spawn here ++> person(name=\"Alice\");\n        spawn here walker greet();\n    }\n}\n```\n\n## Walker Abilities\n- Walkers have 'abilities' defined with 'can'\n- 'entry' ability executes when walker visits a node\n- 'exit' ability executes when walker leaves a node\n- Abilities can be specific to node types\n\n## Walker Variables\n```jac\nwalker counter {\n    has count: int = 0;\n    \n    can increment with entry {\n        count += 1;\n        print(f\"Count: {count}\");\n    }\n}\n```", order=1);

        # Chapter 5: Graph Traversal
        wch2 = spawn walkers ++> chapter(title="Graph Traversal", content="# Graph Traversal\n\nWalkers can traverse graphs using various patterns and filters.\n\n## Basic Traversal\n```jac\nnode person { has name: str; }\nedge friendship { has years: int; }\n\nwalker find_friends {\n    can explore with person entry {\n        print(f\"Exploring {here.name}'s friends:\");\n        \n        # Traverse to all friends\n        for friend in here --> friendship --> person {\n            print(f\"Friend: {friend.name}\");\n        }\n    }\n}\n```\n\n## Filtered Traversal\n```jac\nwalker find_close_friends {\n    can explore with person entry {\n        # Find friends with 5+ years of friendship\n        close_friends = here --> friendship[years >= 5] --> person;\n        \n        for friend in close_friends {\n            print(f\"Close friend: {friend.name}\");\n        }\n    }\n}\n```\n\n## Visiting Nodes\n```jac\nwalker network_explorer {\n    can explore with person entry {\n        for friend in here --> friendship --> person {\n            # Visit each friend node\n            visit [friend]?;\n        }\n    }\n}\n```", order=2);

        # Chapter 6: Abilities
        wch3 = spawn walkers ++> chapter(title="Abilities", content="# Abilities\n\nAbilities define what walkers can do when they encounter different types of nodes.\n\n## Node-Specific Abilities\n```jac\nnode person { has name: str; }\nnode place { has name: str; }\n\nwalker greeter {\n    can greet_person with person entry {\n        print(f\"Hello {here.name}!\");\n    }\n    \n    can visit_place with place entry {\n        print(f\"Visiting {here.name}\");\n    }\n}\n```\n\n## Entry and Exit Abilities\n```jac\nwalker lifecycle_demo {\n    can start with entry {\n        print(\"Walker started\");\n    }\n    \n    can process with person entry {\n        print(f\"Processing person: {here.name}\");\n    }\n    \n    can finish with exit {\n        print(\"Walker finished\");\n    }\n}\n```\n\n## Conditional Abilities\n```jac\nwalker smart_greeter {\n    can greet with person entry {\n        if (here.age >= 18) {\n            print(f\"Hello Mr./Ms. {here.name}\");\n        } else {\n            print(f\"Hi {here.name}!\");\n        }\n    }\n}\n```", order=3);

        # Chapter 7: Variables and Data Types
        ach1 = spawn advanced ++> chapter(title="Variables and Data Types", content="# Variables and Data Types\n\nJac supports various data types for storing and manipulating information.\n\n## Basic Data Types\n```jac\nwalker data_demo {\n    can run {\n        # String\n        name: str = \"Alice\";\n        \n        # Integer\n        age: int = 25;\n        \n        # Float\n        height: float = 5.6;\n        \n        # Boolean\n        is_student: bool = true;\n        \n        print(f\"{name} is {age} years old\");\n    }\n}\n```\n\n## Collections\n```jac\nwalker collections_demo {\n    can run {\n        # List\n        numbers: list = [1, 2, 3, 4, 5];\n        \n        # Dictionary\n        person: dict = {\n            \"name\": \"Bob\",\n            \"age\": 30\n        };\n        \n        print(f\"First number: {numbers[0]}\");\n        print(f\"Person name: {person['name']}\");\n    }\n}\n```\n\n## Node and Walker Variables\n```jac\nnode person {\n    has name: str;\n    has friends: list = [];\n}\n\nwalker social_counter {\n    has friend_count: int = 0;\n    \n    can count with person entry {\n        friend_count = len(here.friends);\n        print(f\"{here.name} has {friend_count} friends\");\n    }\n}\n```", order=1);

        # Chapter 8: Control Flow
        ach2 = spawn advanced ++> chapter(title="Control Flow", content="# Control Flow\n\nJac provides standard control flow constructs for conditional logic and loops.\n\n## Conditional Statements\n```jac\nwalker age_checker {\n    can check with person entry {\n        if (here.age >= 18) {\n            print(f\"{here.name} is an adult\");\n        } elif (here.age >= 13) {\n            print(f\"{here.name} is a teenager\");\n        } else {\n            print(f\"{here.name} is a child\");\n        }\n    }\n}\n```\n\n## Loops\n```jac\nwalker loop_demo {\n    can run {\n        # For loop with range\n        for i in range(5) {\n            print(f\"Count: {i}\");\n        }\n        \n        # For loop with list\n        names: list = [\"Alice\", \"Bob\", \"Charlie\"];\n        for name in names {\n            print(f\"Hello {name}\");\n        }\n        \n        # While loop\n        count: int = 0;\n        while (count < 3) {\n            print(f\"While count: {count}\");\n            count += 1;\n        }\n    }\n}\n```\n\n## Graph Traversal with Conditions\n```jac\nwalker conditional_traversal {\n    can explore with person entry {\n        for friend in here --> friendship --> person {\n            if (friend.age > here.age) {\n                print(f\"{friend.name} is older\");\n                visit [friend]?;\n            }\n        }\n    }\n}\n```", order=2);

        # Chapter 9: Functions and Methods
        ach3 = spawn advanced ++> chapter(title="Functions and Methods", content="# Functions and Methods\n\nJac supports functions for code reusability and organization.\n\n## Basic Functions\n```jac\ncan add_numbers(a: int, b: int) -> int {\n    return a + b;\n}\n\nwalker math_demo {\n    can run {\n        result = add_numbers(5, 3);\n        print(f\"5 + 3 = {result}\");\n    }\n}\n```\n\n## Walker Methods\n```jac\nwalker calculator {\n    has total: float = 0.0;\n    \n    can add(value: float) {\n        total += value;\n    }\n    \n    can multiply(value: float) {\n        total *= value;\n    }\n    \n    can get_result() -> float {\n        return total;\n    }\n    \n    can run {\n        self.add(10);\n        self.multiply(2);\n        print(f\"Result: {self.get_result()}\");\n    }\n}\n```\n\n## Node Methods\n```jac\nnode person {\n    has name: str;\n    has age: int;\n    \n    can greet() {\n        print(f\"Hello, I'm {self.name}\");\n    }\n    \n    can is_adult() -> bool {\n        return self.age >= 18;\n    }\n}\n\nwalker person_demo {\n    can run {\n        p = spawn here ++> person(name=\"Alice\", age=25);\n        p.greet();\n        if (p.is_adult()) {\n            print(\"Alice is an adult\");\n        }\n    }\n}\n```", order=3);

        # Chapter 10: Imports and Modules
        mch1 = spawn modules ++> chapter(title="Imports and Modules", content="# Imports and Modules\n\nJac supports importing functionality from other modules and libraries.\n\n## Standard Library Imports\n```jac\nimport:py from datetime { datetime };\nimport:py from random { randint };\n\nwalker time_demo {\n    can run {\n        now = datetime.now();\n        random_num = randint(1, 100);\n        \n        print(f\"Current time: {now}\");\n        print(f\"Random number: {random_num}\");\n    }\n}\n```\n\n## Jac Module Imports\n```jac\n# In utils.jac\ncan format_name(first: str, last: str) -> str {\n    return f\"{first} {last}\";\n}\n\n# In main.jac\nimport { format_name } from \"utils.jac\";\n\nwalker name_demo {\n    can run {\n        full_name = format_name(\"John\", \"Doe\");\n        print(f\"Full name: {full_name}\");\n    }\n}\n```\n\n## byLLM Integration\n```jac\nimport:jac from byllm { llm };\n\nwalker ai_demo {\n    can run {\n        response = llm.generate(\"What is the capital of France?\");\n        print(f\"AI Response: {response}\");\n    }\n}\n```\n\n## Global Variables\n```jac\nglob app_name: str = \"My Jac App\";\nglob version: str = \"1.0.0\";\n\nwalker app_info {\n    can run {\n        print(f\"{app_name} v{version}\");\n    }\n}\n```", order=1);

        # Chapter 11: Error Handling
        mch2 = spawn modules ++> chapter(title="Error Handling", content="# Error Handling\n\nJac provides mechanisms to handle errors gracefully in your programs.\n\n## Try-Catch Blocks\n```jac\nwalker safe_division {\n    can divide(a: float, b: float) -> float {\n        try {\n            result = a / b;\n            return result;\n        } except ZeroDivisionError {\n            print(\"Error: Cannot divide by zero\");\n            return 0.0;\n        } except Exception as e {\n            print(f\"Unexpected error: {e}\");\n            return 0.0;\n        }\n    }\n    \n    can run {\n        result1 = self.divide(10, 2);\n        result2 = self.divide(10, 0);\n        \n        print(f\"10 / 2 = {result1}\");\n        print(f\"10 / 0 = {result2}\");\n    }\n}\n```\n\n## Validation and Error Prevention\n```jac\nnode person {\n    has name: str;\n    has age: int;\n    \n    can validate() -> bool {\n        if (len(self.name) == 0) {\n            print(\"Error: Name cannot be empty\");\n            return false;\n        }\n        if (self.age < 0 or self.age > 150) {\n            print(\"Error: Invalid age\");\n            return false;\n        }\n        return true;\n    }\n}\n\nwalker person_creator {\n    can create_person(name: str, age: int) {\n        p = spawn here ++> person(name=name, age=age);\n        if (p.validate()) {\n            print(f\"Created person: {p.name}\");\n        } else {\n            # Handle invalid person\n            destroy p;\n        }\n    }\n}\n```", order=2);

        # Chapter 12: Testing
        mch3 = spawn modules ++> chapter(title="Testing", content="# Testing\n\nTesting is crucial for ensuring your Jac programs work correctly.\n\n## Basic Testing\n```jac\ncan add(a: int, b: int) -> int {\n    return a + b;\n}\n\ncan test_add() {\n    result = add(2, 3);\n    assert result == 5, f\"Expected 5, got {result}\";\n    print(\"test_add passed\");\n}\n\nwalker test_runner {\n    can run {\n        test_add();\n        print(\"All tests passed!\");\n    }\n}\n```\n\n## Testing Walkers\n```jac\nnode counter {\n    has value: int = 0;\n}\n\nwalker increment_walker {\n    can increment with counter entry {\n        here.value += 1;\n    }\n}\n\nwalker test_increment {\n    can run {\n        # Create test counter\n        c = spawn here ++> counter(value=5);\n        \n        # Test increment\n        spawn c walker increment_walker();\n        \n        # Verify result\n        assert c.value == 6, f\"Expected 6, got {c.value}\";\n        print(\"test_increment passed\");\n    }\n}\n```\n\n## Graph Testing\n```jac\nnode person { has name: str; }\nedge friendship { has strength: float; }\n\nwalker test_friendship {\n    can run {\n        # Create test graph\n        alice = spawn here ++> person(name=\"Alice\");\n        bob = spawn here ++> person(name=\"Bob\");\n        alice ++> friendship(strength=0.8) ++> bob;\n        \n        # Test traversal\n        friends = alice --> friendship --> person;\n        assert len(friends) == 1, f\"Expected 1 friend, got {len(friends)}\";\n        assert friends[0].name == \"Bob\", f\"Expected Bob, got {friends[0].name}\";\n        \n        print(\"test_friendship passed\");\n    }\n}\n```", order=3);

        # Create modern virtual classrooms
        jac_basics_room = spawn here ++> virtual_classroom(
            name="Jac Basics Virtual Lab",
            instructor="Dr. Sarah Chen",
            capacity=30,
            active_students=15,
            meeting_url="https://meet.jaseci.org/jac-basics",
            is_live=true,
            whiteboard_content="Today: Hello World & Node Creation",
            chat_enabled=true,
            recording_enabled=true,
            breakout_rooms=3,
            screen_sharing=true,
            current_presenter="Dr. Sarah Chen"
        );
        
        advanced_room = spawn here ++> virtual_classroom(
            name="Advanced Jac Workshop",
            instructor="Prof. Michael Rodriguez",
            capacity=25,
            active_students=8,
            meeting_url="https://meet.jaseci.org/advanced-jac",
            is_live=false,
            whiteboard_content="Next Session: Walker Patterns",
            chat_enabled=true,
            recording_enabled=true,
            breakout_rooms=2,
            screen_sharing=false,
            current_presenter=""
        );

        # Create demo learner and participants
        doris = spawn here ++> learner(username="Doris", study_streak=5, total_time=120);
        doris ++> mastery(score=0.95) ++> basics;
        doris ++> mastery(score=0.60) ++> walkers;
        doris ++> chapter_progress(completed=true, completion_date="2024-01-12") ++> ch1;
        doris ++> chapter_progress(completed=true, completion_date="2024-01-14") ++> ch2;
        
        # Create virtual participants
        alice_p = spawn here ++> participant(username="Alice", role="student", is_muted=false, camera_on=true, join_time="09:00 AM");
        bob_p = spawn here ++> participant(username="Bob", role="student", is_muted=true, camera_on=false, join_time="09:05 AM");
        instructor_p = spawn here ++> participant(username="Dr. Sarah Chen", role="instructor", is_muted=false, camera_on=true, join_time="08:55 AM");
        
        # Connect participants to classroom
        alice_p ++> classroom_session(joined_at="2024-01-15 09:00", participation_score=0.85) ++> jac_basics_room;
        bob_p ++> classroom_session(joined_at="2024-01-15 09:05", participation_score=0.72) ++> jac_basics_room;
        instructor_p ++> classroom_session(joined_at="2024-01-15 08:55", participation_score=1.0) ++> jac_basics_room;

        report "Interactive Learning Platform initialized!";
        report "Topics: 4 | Learner: Doris | Chapters: 12 | Virtual Classrooms: 2";
    }
}

# ==================== QUIZ GENERATOR (byLLM) ====================
walker generate_quiz {
    has topic_name: str;
    has difficulty: int = 2;

    can generate with entry {
        topic_node = here --> topic[name==topic_name];
        if (!topic_node) { report "Topic not found"; return; }

        quiz = llm.generate(
            f"""
            Create ONE multiple-choice quiz question about:
            Topic: {topic_node.name}
            Description: {topic_node.description}
            Difficulty: {difficulty} (1=easy, 5=expert)

            Return JSON with: question, options (4 strings), correct (index), explanation
            """
        );

        report {"type":"quiz", "topic":topic_name, "quiz":quiz};
    }
}

# ==================== ANSWER EVALUATOR (byLLM) ====================
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
            Evaluate this answer for Jaseci topic:
            Topic: {topic_node.name}
            Answer: "{user_answer}"

            Return JSON with: score (0.0-1.0), feedback, passed (boolean)
            """
        );

        # Update mastery
        edge m = user --> mastery --> topic_node;
        if (!m) { m = user ++> mastery() ++> topic_node; }
        m.score = (m.score + result.score) / 2.0;

        report {
            "username": username,
            "topic": topic_name,
            "new_mastery": m.score,
            "feedback": result.feedback,
            "passed": result.passed
        };
    }
}

# ==================== API WALKERS ====================
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

walker get_chapters {
    has topic_name: str;

    can fetch with entry {
        chapters = [];
        topic_node = here --> topic[name==topic_name];
        if (!topic_node) { report {"error": "Topic not found"}; return; }

        for ch in topic_node --> chapter {
            chapters.append({
                "title": ch.title,
                "content": ch.content,
                "order": ch.order
            });
        }
        
        # Sort by order
        chapters.sort(key=lambda x: x["order"]);
        report {"topic": topic_name, "chapters": chapters};
    }
}

walker get_virtual_classrooms {
    can fetch with entry {
        classrooms = [];
        for classroom in here --> virtual_classroom {
            participants = [];
            for session in classroom <-- classroom_session {
                participant = session <-- participant;
                if (participant) {
                    participants.append({
                        "username": participant.username,
                        "role": participant.role,
                        "is_muted": participant.is_muted,
                        "camera_on": participant.camera_on,
                        "hand_raised": participant.hand_raised
                    });
                }
            }
            
            classrooms.append({
                "name": classroom.name,
                "instructor": classroom.instructor,
                "capacity": classroom.capacity,
                "active_students": classroom.active_students,
                "meeting_url": classroom.meeting_url,
                "is_live": classroom.is_live,
                "whiteboard_content": classroom.whiteboard_content,
                "chat_enabled": classroom.chat_enabled,
                "recording_enabled": classroom.recording_enabled,
                "breakout_rooms": classroom.breakout_rooms,
                "screen_sharing": classroom.screen_sharing,
                "current_presenter": classroom.current_presenter,
                "participants": participants
            });
        }
        report {"virtual_classrooms": classrooms};
    }
}

# ==================== TEST WALKER ====================
walker complete_chapter {
    has username: str = "Doris";
    has chapter_title: str;

    can complete with entry {
        report {
            "success": true,
            "message": f"Chapter '{chapter_title}' completed for {username}!",
            "username": username,
            "chapter_title": chapter_title
        };
    }
}

walker join_virtual_classroom {
    has username: str;
    has classroom_name: str;
    has role: str = "student";

    can join with entry {
        classroom = here --> virtual_classroom[name==classroom_name];
        if (!classroom) { report {"error": "Classroom not found"}; return; }
        
        if (classroom.active_students >= classroom.capacity) {
            report {"error": "Classroom is full"};
            return;
        }
        
        # Create participant
        participant = spawn here ++> participant(
            username=username,
            role=role,
            is_muted=true,
            camera_on=false,
            join_time="now"
        );
        
        # Join session
        participant ++> classroom_session(
            joined_at="2024-01-15 10:00",
            participation_score=0.0
        ) ++> classroom;
        
        classroom.active_students += 1;
        
        report {
            "success": true,
            "message": f"{username} joined {classroom_name}",
            "meeting_url": classroom.meeting_url,
            "is_live": classroom.is_live
        };
    }
}

walker hello {
    report "Interactive Learning Platform for Jaseci";
    report "Run: jac run main.jac -w init";
    report "Run: jac run main.jac -w get_topics";
    report "Run: jac run main.jac -w get_virtual_classrooms";
    report "Run: jac run main.jac -w generate_quiz --args topic_name=\"Jac Basics\"";
}