const express = require("express");
const router = express.Router();

// ==================================================
// ASK AI — POST /api/ai/ask
// Body: { question: "..." }
// ==================================================
router.post("/ask", async (req, res) => {

    const { question } = req.body;

    if (!question || !question.trim()) {
        return res.status(400).json({ success: false, message: "Question is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set");
        return res.status(500).json({ success: false, message: "AI service is not configured" });
    }

    try {

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text:
                                        "You are a helpful study assistant for college students. " +
                                        "Answer clearly and concisely, using simple language and short paragraphs or bullet points where helpful. " +
                                        "If the question is a numerical/technical problem, show the key steps.\n\n" +
                                        "Student's question: " + question
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return res.status(502).json({ success: false, message: "AI service error. Please try again." });
        }

        const answer =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate an answer. Please try rephrasing your question.";

        res.json({ success: true, answer });

    } catch (error) {
        console.error("Ask AI Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }

});


module.exports = router;