# models.jac

sem Topic = "A knowledge topic in Jaseci, e.g., walkers or OSP";

node Topic {
    has name: str;
    has description: str;
    has difficulty: int;  # 1-5 scale
}

sem User = "Learner profile with mastery levels";

node User {
    has username: str;
    has progress: dict[str, float];  # topic_name: mastery_score (0-1)
}

sem Prerequisite = "Edge indicating one topic requires another";

edge Prerequisite {
    has required_mastery: float = 0.5;  # Min score to unlock
}

sem Mastery = "Edge linking user to topic with proficiency score";

edge Mastery {
    has score: float = 0.0;
}

# Build initial graph in seed_data.jac
with entry {
    basics = spawn here ++> Topic(name="Basics", difficulty=1);
    walkers = spawn here ++> Topic(name="Walkers", difficulty=2);
    osp = spawn here ++> Topic(name="OSP", difficulty=3);

    # Edges: walkers requires basics
    walkers <++ Prerequisite(required_mastery=0.7) ++> basics;

    # User example
    user_alice = spawn here ++> User(username="Alice");
    user_alice ++> Mastery(score=0.8) ++> basics;  # Alice mastered basics
}