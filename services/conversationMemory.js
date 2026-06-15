const conversations = new Map();

/*
Map {
  "session-1" => [
      {...},
      {...}
  ],

  "session-2" => [
      {...},
      {...}
  ]
}
*/

function getSession(sessionId) {
    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
    }

    return conversations.get(sessionId);
}

export function addMessage(
    sessionId,
    role,
    content,
    sources = []
) {
    const history =
        getSession(sessionId);

    history.push({
        role,
        content,
        sources,
        timestamp:
            new Date().toISOString(),
    });
}

export function getRecentHistory(
    sessionId,
    limit = 6
) {
    return getSession(sessionId).slice(
        -limit
    );
}

export function clearHistory(
    sessionId
) {
    conversations.set(sessionId, []);
}

export function getHistory(sessionId) {
    return getSession(sessionId);
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

export function buildSearchQuery(
    currentQuestion,
    sessionId
) {
    const recentUserQuestions =
        getRecentHistory(sessionId)
            .filter(
                (msg) => msg.role === "user"
            )
            .map(
                (msg) => msg.content
            );

    return [
        ...recentUserQuestions,
        currentQuestion,
    ].join("\n");
}

export function printHistory(
    sessionId
) {
    const history =
        getSession(sessionId);

    console.log(history);
}

export function deleteSession(sessionId) {
    conversations.delete(sessionId);
}