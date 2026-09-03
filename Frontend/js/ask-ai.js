/* =====================================================
   ASK AI — UNIVERSAL FLOATING CHAT WIDGET
   Drop this one file into every page (see instructions).
===================================================== */

(function () {

    const API_BASE_URL =
        window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : "https://college-notes-website-f64v.onrender.com";

    const ASK_AI_URL = `${API_BASE_URL}/api/ai/ask`;


    // ---------- STYLES ----------
    const style = document.createElement("style");
    style.textContent = `
        #askAiBtn {
            position: fixed;
            bottom: 20px;
            right: 86px;
            z-index: 999999;
            height: 52px;
            padding: 0 18px;
            border-radius: 26px;
            border: none;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        #askAiBtn:hover {
            opacity: 0.9;
        }

        #askAiPanel {
            position: fixed;
            bottom: 84px;
            right: 20px;
            z-index: 999999;
            width: 380px;
            max-width: calc(100vw - 40px);
            height: 500px;
            max-height: calc(100vh - 120px);
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.25);
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: Arial, Helvetica, sans-serif;
        }

        #askAiPanel.open {
            display: flex;
        }

        #askAiHeader {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            padding: 14px 16px;
            font-weight: bold;
            font-size: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #askAiCloseBtn {
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            line-height: 1;
        }

        #askAiMessages {
            flex: 1;
            overflow-y: auto;
            padding: 14px;
            font-size: 14px;
            color: #1a1a1a;
        }

        .askAiMsg {
            margin-bottom: 12px;
            line-height: 1.5;
        }

        .askAiMsg.user {
            text-align: right;
        }

        .askAiMsg.user .bubble {
            background: #6366f1;
            color: #fff;
            display: inline-block;
            padding: 8px 12px;
            border-radius: 12px 12px 0 12px;
            max-width: 85%;
            text-align: left;
            white-space: pre-wrap;
        }

        .askAiMsg.ai .bubble {
            background: #f0f0f5;
            color: #1a1a1a;
            display: inline-block;
            padding: 10px 14px;
            border-radius: 12px 12px 12px 0;
            max-width: 92%;
        }

        .askAiMsg.ai .bubble p {
            margin: 0 0 8px 0;
        }

        .askAiMsg.ai .bubble ul,
        .askAiMsg.ai .bubble ol {
            margin: 4px 0 8px 0;
            padding-left: 20px;
        }

        .askAiMsg.ai .bubble li {
            margin-bottom: 5px;
        }

        .askAiMsg.ai .bubble p:last-child,
        .askAiMsg.ai .bubble ul:last-child,
        .askAiMsg.ai .bubble ol:last-child {
            margin-bottom: 0;
        }

        .askAiMsg.loading .bubble {
            font-style: italic;
            color: #666;
        }

        #askAiInputRow {
            display: flex;
            border-top: 1px solid #eee;
            padding: 10px;
            gap: 8px;
        }

        #askAiInput {
            flex: 1;
            border: 1px solid #ccc;
            border-radius: 20px;
            padding: 10px 14px;
            font-size: 14px;
            outline: none;
            font-family: inherit;
        }

        #askAiSendBtn {
            background: #6366f1;
            color: #fff;
            border: none;
            border-radius: 20px;
            padding: 0 16px;
            font-weight: bold;
            cursor: pointer;
        }

        #askAiSendBtn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        @media (max-width: 480px) {
            #askAiBtn {
                right: 20px;
                bottom: 84px;
            }
            #askAiPanel {
                right: 10px;
                left: 10px;
                width: auto;
                bottom: 144px;
            }
        }
    `;
    document.head.appendChild(style);


    // ---------- BUILD DOM ----------
    function buildWidget() {

        const btn = document.createElement("button");
        btn.id = "askAiBtn";
        btn.type = "button";
        btn.innerHTML = "✨ Ask AI";
        btn.addEventListener("click", togglePanel);
        document.body.appendChild(btn);

        const panel = document.createElement("div");
        panel.id = "askAiPanel";
        panel.innerHTML = `
            <div id="askAiHeader">
                <span>Ask AI — Study Helper</span>
                <button id="askAiCloseBtn" type="button">&times;</button>
            </div>
            <div id="askAiMessages"></div>
            <div id="askAiInputRow">
                <input id="askAiInput" type="text" placeholder="Ask any study question..." />
                <button id="askAiSendBtn" type="button">Send</button>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById("askAiCloseBtn").addEventListener("click", togglePanel);
        document.getElementById("askAiSendBtn").addEventListener("click", sendQuestion);
        document.getElementById("askAiInput").addEventListener("keydown", function (e) {
            if (e.key === "Enter") sendQuestion();
        });

        addAiMessage("Hi! I'm your study assistant. Ask me anything — a concept you're stuck on, a definition, or help understanding a topic.");

    }


    function togglePanel() {
        document.getElementById("askAiPanel").classList.toggle("open");
    }


    // ---------- PLAIN USER MESSAGE ----------
    function addUserMessage(text) {

        const messages = document.getElementById("askAiMessages");

        const wrap = document.createElement("div");
        wrap.className = "askAiMsg user";

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = text;

        wrap.appendChild(bubble);
        messages.appendChild(wrap);

        messages.scrollTop = messages.scrollHeight;

    }


    // ---------- LOADING MESSAGE ----------
    function addLoadingMessage() {

        const messages = document.getElementById("askAiMessages");

        const wrap = document.createElement("div");
        wrap.className = "askAiMsg loading";

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = "Thinking...";

        wrap.appendChild(bubble);
        messages.appendChild(wrap);

        messages.scrollTop = messages.scrollHeight;

        return wrap;

    }


    // ---------- AI MESSAGE (renders **bold**, - bullets, 1. numbered lists) ----------
    function addAiMessage(rawText) {

        const messages = document.getElementById("askAiMessages");

        const wrap = document.createElement("div");
        wrap.className = "askAiMsg ai";

        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.innerHTML = formatAiText(rawText);

        wrap.appendChild(bubble);
        messages.appendChild(wrap);

        messages.scrollTop = messages.scrollHeight;

    }


    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }


    function inlineFormat(line) {
        // **bold** -> <strong>bold</strong>
        return escapeHtml(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    }


    function formatAiText(text) {

        const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

        let html = "";
        let listType = null; // "ul" | "ol" | null

        function closeList() {
            if (listType) {
                html += listType === "ul" ? "</ul>" : "</ol>";
                listType = null;
            }
        }

        lines.forEach((line) => {

            const bulletMatch = line.match(/^[-*]\s+(.*)/);
            const numberedMatch = line.match(/^\d+[\.\)]\s+(.*)/);

            if (bulletMatch) {

                if (listType !== "ul") {
                    closeList();
                    html += "<ul>";
                    listType = "ul";
                }
                html += `<li>${inlineFormat(bulletMatch[1])}</li>`;

            } else if (numberedMatch) {

                if (listType !== "ol") {
                    closeList();
                    html += "<ol>";
                    listType = "ol";
                }
                html += `<li>${inlineFormat(numberedMatch[1])}</li>`;

            } else {

                closeList();
                html += `<p>${inlineFormat(line)}</p>`;

            }

        });

        closeList();

        return html || escapeHtml(text);

    }


    async function sendQuestion() {

        const input = document.getElementById("askAiInput");
        const sendBtn = document.getElementById("askAiSendBtn");

        const question = input.value.trim();

        if (!question) return;

        addUserMessage(question);
        input.value = "";

        sendBtn.disabled = true;

        const loadingEl = addLoadingMessage();

        try {

            const response = await fetch(ASK_AI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            loadingEl.remove();

            if (!data.success) {
                addAiMessage(data.message || "Something went wrong. Please try again.");
            } else {
                addAiMessage(data.answer);
            }

        } catch (error) {

            loadingEl.remove();
            addAiMessage("Unable to reach the AI service right now. Please try again in a moment.");

        } finally {

            sendBtn.disabled = false;
            input.focus();

        }

    }


    document.addEventListener("DOMContentLoaded", buildWidget);

})();