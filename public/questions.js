const sectionWiseQuestions = {
    Maths: [
        {
            id: 101,
            question: "If A can do a work in 10 days and B in 15 days, in how many days can they finish it together?",
            options: ["5 days", "6 days", "8 days", "9 days"],
            correctAnswer: 1,
            explanation: "Total Work = LCM(10, 15) = 30 units. Combined efficiency = 5 units/day. Time = 30 / 5 = 6 days.",
            shortTrick: "Formula: (A × B) / (A + B) ➔ (10 × 15) / 25 = 6 days."
        }
    ],
    English: [
        {
            id: 201,
            question: "Choose the correct synonym for 'ABANDON':",
            options: ["Adopt", "Forsake", "Keep", "Cherish"],
            correctAnswer: 1,
            explanation: "Abandon means to give up completely or desert, which is synonymous with Forsake.",
            shortTrick: "Root association: Abandon = Leave behind."
        }
    ],
    GK: [
        {
            id: 301,
            question: "Which organ purifies blood in the human body?",
            options: ["Heart", "Lungs", "Kidney", "Liver"],
            correctAnswer: 2,
            explanation: "Kidneys filter waste products and excess fluids from the bloodstream.",
            shortTrick: "Renal system functions specifically as the biological blood filter."
        }
    ],
    Reasoning: [
        {
            id: 401,
            question: "Find the missing number in the series: 2, 4, 8, 16, ?",
            options: ["20", "24", "28", "32"],
            correctAnswer: 3,
            explanation: "Each number is multiplied by 2. 16 × 2 = 32.",
            shortTrick: "Geometric progression with common ratio r = 2."
        }
    ]
};
