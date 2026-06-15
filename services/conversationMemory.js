const history = [];

/*
history = [
  {
    role: "user",
    content: "How many annual leaves do employees get?"
  },
  {
    role: "assistant",
    content: "Employees receive 20 annual leaves every year.",
    sources: [
      {
        source: "employee_handbook",
        chunkIndex: 0
      }
    ]
  }
]
*/

export function addMessage(
    role,
    content,
    sources = []
) {
    history.push({
        role,
        content,
        sources,
        timestamp: new Date().toISOString(),
    });
}

export function getRecentHistory(limit = 6) {
    return history.slice(-limit);
}

export function clearHistory() {
    history.length = 0;
}

export function getHistory() {
    return history;
}

/*export function buildSearchQuery(
    currentQuestion
) {
    const recentMessages =
        getRecentHistory();

    return [
        ...recentMessages.map(
            (msg) => msg.content
        ),
        currentQuestion,
    ].join("\n");
}*/

export function buildSearchQuery(currentQuestion) {
    const recentUserQuestions = getRecentHistory()
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.content);
  
    return [...recentUserQuestions, currentQuestion].join("\n");
  }

export function printHistory() {
    console.log(
        "\n====== Conversation ======\n"
    );

    for (const msg of history) {
        console.log(
            `${msg.role.toUpperCase()}:`
        );

        console.log(msg.content);

        if (
            msg.sources &&
            msg.sources.length
        ) {
            console.log("Sources:");

            for (const src of msg.sources) {
                console.log(
                    `- ${src.source} (chunk ${src.chunkIndex})`
                );
            }
        }

        console.log();
    }
}