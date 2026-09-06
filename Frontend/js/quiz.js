document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL =
        window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : "https://college-notes-website-f64v.onrender.com";

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!userData || !token) {
        alert("Please login to take the quiz.");
        window.location.href = "/";
        return;
    }

    function authHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    }

    const container = document.getElementById("quizContainer");

    let selectedSemester = "all";
    let currentAttemptId = null;
    let currentQuestions = [];
    let userAnswers = {};

    // ==========================================
    // STEP 1: SHOW SEMESTER PICKER
    // ==========================================

    async function loadSemesterPicker() {

        container.innerHTML = `<p style="color:white; text-align:center;">Loading semesters...</p>`;

        try {

            const res = await fetch(`${API_BASE_URL}/api/subjects/semesters`);
            const data = await res.json();

            if (!data.success) {
                container.innerHTML = `<div class="quiz-card"><p class="error-text">Unable to load semesters.</p></div>`;
                return;
            }

            renderSemesterPicker(data.semesters || []);

        } catch (error) {
            console.error("Load Semesters Error:", error);
            container.innerHTML = `<div class="quiz-card"><p class="error-text">Unable to connect to server.</p></div>`;
        }

    }

    function renderSemesterPicker(semesters) {

        container.innerHTML = `
            <div class="quiz-card">

                <h3>Choose a semester, or take questions from all semesters:</h3>

                <div class="semester-grid" id="semesterGrid">

                    <button class="semester-btn selected" data-value="all">All Semesters</button>

                    ${semesters.map(sem => `
                        <button class="semester-btn" data-value="${sem.id}">
                            Semester ${sem.semester_number}
                        </button>
                    `).join("")}

                </div>

                <button class="start-btn" id="startQuizBtn">Start Today's Quiz</button>

                <div id="quizError"></div>

            </div>
        `;

        const buttons = document.querySelectorAll(".semester-btn");

        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedSemester = btn.getAttribute("data-value");
            });
        });

        document.getElementById("startQuizBtn").addEventListener("click", startQuiz);

    }

    // ==========================================
    // STEP 2: START / LOAD TODAY'S QUIZ
    // ==========================================

    async function startQuiz() {

        const startBtn = document.getElementById("startQuizBtn");
        const errorBox = document.getElementById("quizError");

        startBtn.disabled = true;
        startBtn.textContent = "Loading...";
        errorBox.innerHTML = "";

        try {

            const res = await fetch(
                `${API_BASE_URL}/api/quiz/daily?semester=${encodeURIComponent(selectedSemester)}`,
                { headers: authHeaders() }
            );

            const data = await res.json();

            if (!data.success) {
                errorBox.innerHTML = `<p class="error-text">${data.message || "Server error."}</p>`;
                startBtn.disabled = false;
                startBtn.textContent = "Start Today's Quiz";
                return;
            }

            if (!data.questions || data.questions.length === 0) {
                errorBox.innerHTML = `<p class="error-text">${data.message || "No questions available for this semester yet."}</p>`;
                startBtn.disabled = false;
                startBtn.textContent = "Start Today's Quiz";
                return;
            }

            currentAttemptId = data.attempt_id;
            currentQuestions = data.questions;

            if (data.completed) {
                renderResult({
                    score: data.score,
                    correct_count: data.correct_count,
                    incorrect_count: data.incorrect_count,
                    total_questions: data.total_questions
                });
            } else {
                renderQuiz(data.questions);
            }

        } catch (error) {
            console.error("Start Quiz Error:", error);
            errorBox.innerHTML = `<p class="error-text">Unable to connect to server.</p>`;
            startBtn.disabled = false;
            startBtn.textContent = "Start Today's Quiz";
        }

    }

    // ==========================================
    // STEP 3: RENDER QUIZ QUESTIONS
    // ==========================================

    function renderQuiz(questions) {

        userAnswers = {};

        container.innerHTML = `
            <div class="quiz-card">

                ${questions.map((q, index) => `
                    <div class="question-block">

                        <div class="question-number">Question ${index + 1} of ${questions.length}</div>

                        <div class="question-text">${escapeHTML(q.question)}</div>

                        <div class="options" data-question-id="${q.question_id}">

                            ${["a", "b", "c", "d"].map(letter => `
                                <button
                                    class="option-btn"
                                    data-question-id="${q.question_id}"
                                    data-option="${letter.toUpperCase()}"
                                >
                                    ${escapeHTML(q["option_" + letter])}
                                </button>
                            `).join("")}

                        </div>

                    </div>
                `).join("")}

                <button class="submit-btn" id="submitQuizBtn" disabled>
                    Submit Quiz (0 / ${questions.length} answered)
                </button>

                <div id="submitError"></div>

            </div>
        `;

        document.querySelectorAll(".option-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                const questionId = btn.getAttribute("data-question-id");
                const option = btn.getAttribute("data-option");

                // Deselect siblings for this question
                document
                    .querySelectorAll(`.option-btn[data-question-id="${questionId}"]`)
                    .forEach(b => b.classList.remove("selected"));

                btn.classList.add("selected");

                userAnswers[questionId] = option;

                updateSubmitButton(questions.length);

            });

        });

        document.getElementById("submitQuizBtn").addEventListener("click", submitQuiz);

    }

    function updateSubmitButton(totalQuestions) {

        const answeredCount = Object.keys(userAnswers).length;
        const submitBtn = document.getElementById("submitQuizBtn");

        submitBtn.textContent = `Submit Quiz (${answeredCount} / ${totalQuestions} answered)`;
        submitBtn.disabled = answeredCount < totalQuestions;

    }

    // ==========================================
    // STEP 4: SUBMIT QUIZ
    // ==========================================

    async function submitQuiz() {

        const submitBtn = document.getElementById("submitQuizBtn");
        const errorBox = document.getElementById("submitError");

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        const answers = Object.keys(userAnswers).map(questionId => ({
            question_id: Number(questionId),
            selected_option: userAnswers[questionId]
        }));

        try {

            const res = await fetch(
                `${API_BASE_URL}/api/quiz/daily/${currentAttemptId}/submit`,
                {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({ answers })
                }
            );

            const data = await res.json();

            if (!data.success) {
                errorBox.innerHTML = `<p class="error-text">${data.message || "Unable to submit quiz."}</p>`;
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Quiz";
                return;
            }

            renderResult(data);

        } catch (error) {
            console.error("Submit Quiz Error:", error);
            errorBox.innerHTML = `<p class="error-text">Unable to connect to server.</p>`;
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Quiz";
        }

    }

    // ==========================================
    // STEP 5: SHOW RESULT
    // ==========================================

    function renderResult(result) {

        const total = result.total_questions || 0;
        const correct = result.correct_count !== undefined ? result.correct_count : result.score;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        container.innerHTML = `
            <div class="quiz-card result-card">

                <h3>Quiz Completed! 🎉</h3>

                <div class="result-score">${correct} / ${total}</div>

                <div class="result-sub">${accuracy}% accuracy</div>

                <button class="start-btn" onclick="window.location.href='dashboard.html'">
                    Back to Dashboard
                </button>

            </div>
        `;

    }

    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    loadSemesterPicker();

});