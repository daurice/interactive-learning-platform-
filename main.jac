# main.jac
walker recommend_next {
    has user: User;

    can analyze_graph {
        # Traverse: Find weak areas (low score edges)
        weak_topics = [];
        for topic in root [--> Topic] {
            mastery = self.user [--> ? topic].score;
            if (mastery < 0.5) { weak_topics.append(topic); }
        }
        # Use byLLM to suggest
        def suggest_revision(weaks: list[Topic]) -> str by llm();
        return suggest_revision(weak_topics);
    }
}