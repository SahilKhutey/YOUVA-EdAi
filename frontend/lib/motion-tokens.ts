export const MotionTokens = {
    // PRESENCE
    cursorLag: 120, // ms smoothing window
    cursorEnterDuration: 0.24, // s
    cursorLeaveDuration: 0.2, // s

    // DRAWING
    strokeDurationMin: 200, // ms
    strokeDurationMax: 600, // ms
    aiStrokeDelay: 150, // ms
    drawingWordRevealDelay: 60, // ms

    // OBJECTS
    objectEnterDuration: 0.24, // s
    objectEnterEase: "ease-decelerate", // custom bezier needed?

    // CONFLICT
    conflictPulseDuration: 0.8, // s (loop)

    // VIEWPORT
    viewportPanDuration: 0.4, // s

    // AI
    aiBreathingDuration: 2, // s (infinite)
    aiSuggestionDuration: 0.6, // s
};

export const MotionEasings = {
    decelerate: [0.0, 0.0, 0.2, 1], // approximate ease-out
    emphasized: [0.2, 0.0, 0.0, 1],
};
