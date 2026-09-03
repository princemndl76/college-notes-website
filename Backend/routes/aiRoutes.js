const express = require("express");
const router = express.Router();

// Fastest model first (flash-lite), then flash as a quality/availability fallback.
const MODEL_CANDIDATES = [
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-2.5-flash"
];

async function callGemini(model, question) {

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    "You are a study assistant for college students. Answer briefly and clearly — " +
                                    "a short paragraph or a few bullet points is enough. Avoid long essays.\n\n" +
                                    "Question: " + question
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 350,
                    temperature: 0.4
                }
            })
        }
    );

    const data = await response.json();

    return { ok: response.ok, status: response.status, data };

}


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

    let lastError = null;

    for (const model of MODEL_CANDIDATES) {

        try {

            const result = await callGemini(model, question);

            if (result.ok) {

                const answer =
                    result.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                    "Sorry, I couldn't generate an answer. Please try rephrasing your question.";

                return res.json({ success: true, answer, modelUsed: model });

            }

            console.warn(`Gemini model ${model} failed (status ${result.status}):`, result.data?.error?.message);
            lastError = result.data;

        } catch (error) {

            console.error(`Gemini request error for model ${model}:`, error);
            lastError = error;

        }

    }

    console.error("All Gemini models failed. Last error:", lastError);

    res.status(502).json({
        success: false,
        message: "AI is experiencing high demand right now. Please try again in a moment."
    });

});


module.exports = router;