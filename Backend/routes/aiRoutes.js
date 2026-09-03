const express = require("express");
const router = express.Router();

const MODEL_CANDIDATES = [
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash"
];

const PER_ATTEMPT_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT =
    "You are a friendly, encouraging study assistant for college students. " +
    "Talk like a helpful senior explaining things to a junior — warm, simple, never robotic or overly formal.\n\n" +
    "Formatting rules for every answer:\n" +
    "- Start with a one-line direct answer or definition.\n" +
    "- Then break the explanation into short bullet points (use '- ' for each point).\n" +
    "- Bold key terms using **term** so they stand out.\n" +
    "- Keep each bullet to 1-2 short sentences — no long paragraphs.\n" +
    "- If it's a numerical/technical problem, show the steps as numbered points (1., 2., 3.).\n" +
    "- End with a one-line summary or memory tip if it naturally helps, but skip it if not needed.\n" +
    "- Keep the whole answer concise — aim for under 120 words unless the question truly needs more.\n\n" +
    "Question: ";

async function callGemini(model, question) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);

    try {

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: SYSTEM_PROMPT + question }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 400,
                        temperature: 0.5
                    }
                })
            }
        );

        const data = await response.json();

        return { ok: response.ok, status: response.status, data };

    } finally {
        clearTimeout(timeoutId);
    }

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

            if (error.name === "AbortError") {
                console.warn(`Gemini model ${model} timed out after ${PER_ATTEMPT_TIMEOUT_MS}ms`);
            } else {
                console.error(`Gemini request error for model ${model}:`, error);
            }

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