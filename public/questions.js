const testQuestions = [
    {
        id: 1,
        question: "If A can do a work in 10 days and B in 15 days, in how many days can they finish it together?",
        options: ["5 days", "6 days", "8 days", "9 days"],
        correctAnswer: 1,
        explanation: "Total Work = LCM(10, 15) = 30 units.\nEfficiency of A = 3 units/day, B = 2 units/day.\nCombined efficiency = 5 units/day.\nTime taken = 30 / 5 = 6 days.",
        shortTrick: "Formula: (A × B) / (A + B) ➔ (10 × 15) / (10 + 15) = 150 / 25 = 6 days."
    },
    {
        id: 2,
        question: "What is the capital of India?",
        options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
        correctAnswer: 1,
        explanation: "New Delhi was declared the capital of India in 1911.",
        shortTrick: "Static GK fact — remember the 1911 Delhi Durbar."
    }
];
