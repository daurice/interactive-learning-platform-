# agents.jac

obj Quiz {
    has question: str;
    has options: list[str];
    has correct_answer: int;
}

obj TaskPartition {  #For routing subtasks
    has agent_type: str;
    has task: str;
}

# Planner Agent: Decomposes goals, routes to agents
walker planner {
    has utterance: str;  # e.g., "Learn OSP"

    def plan_tasks(main_task: str) -> list[TaskPartition] by llm(
        method="ReAct",
        incl_info={"topics": "Jaseci topics like walkers, OSP"}
    );  # Prompt: Generate subtasks and assign to analyzer/generator

    can execute with root entry {
        subtasks = self.plan_tasks(self.utterance);
        node_map = {
            "analyzer": analyzer_node,
            "generator": generator_node
        };
        for sub in subtasks {
            target_node = node_map[sub.agent_type];
            if (!here [--> ? target_node]) { here ++> target_node(); }
            visitor.cur_task = sub.task;
            visit [--> ? target_node];  # Traverse to agent
        }
    }
}

# Generator Agent: Creates quizzes (generative use)
node generator_node {
    def generate_quiz(topic: str, difficulty: int) -> Quiz by llm(
        method="Reason",  # Step-by-step for quality
        tools=[get_topic_desc]  # Tool to fetch description
    );  # Prompt: "Create a quiz question on {topic} at difficulty {difficulty}"

    def get_topic_desc(topic: str) -> str {
        # Traverse graph for description
        topic_node = root [--> name==topic];
        return topic_node.description;
    }

    can execute with planner entry {
        quiz = self.generate_quiz(visitor.cur_task.topic, visitor.cur_task.difficulty);
        report quiz;  # Return to caller
    }
}

# Analyzer Agent: Evaluates answers, updates scores (analytical use)
node analyzer_node {
    def evaluate_answer(user_answer: str, correct: str) -> dict[str, any] by llm(
        method="Reason",
        incl_info={"rubric": "Score 0-1 based on accuracy, explain feedback"}
    );  # Returns {score: float, feedback: str}

    can execute with planner entry {
        result = self.evaluate_answer(visitor.cur_task.user_answer, visitor.cur_task.correct);
        #Update graph: Traverse to user node and update Mastery edge
        user_node = root [--> username==visitor.cur_task.user];
        topic_node = root [--> name==visitor.cur_task.topic];
        mastery_edge = user_node [--> ? topic_node];
        if (mastery_edge) { mastery_edge.score = result.score; }
        else { user_node ++> Mastery(score=result.score) ++> topic_node; }
        report result;
    }
}