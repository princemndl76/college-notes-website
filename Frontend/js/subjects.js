document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL =
        window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : "https://college-notes-website-f64v.onrender.com";

    function authHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        };
    }

    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("id");

    const subjectContainer = document.getElementById("subjectContainer");
    const unitContainer = document.getElementById("unitContainer");

    if (!subjectId) {
        subjectContainer.innerHTML = "<p>No subject selected.</p>";
        return;
    }

    // ==========================================
    // SUBJECT QUIZ WIDGET
    // Shows one random question tied to this subject,
    // once, when the subject page loads.
    // ==========================================

    const quizCategoryLabels = {
        subject: "📘 Quick Quiz for this Subject"
    };

    function closeSubjectQuizWidget() {
        const overlay = document.getElementById("subjectQuizOverlay");
        if (overlay) {
            overlay.style.display = "none";
        }
    }

    function renderSubjectQuizQuestion(q) {

        const overlay = document.getElementById("subjectQuizOverlay");
        const labelEl = document.getElementById("subjectQuizLabel");
        const questionEl = document.getElementById("subjectQuizQuestion");
        const optionsEl = document.getElementById("subjectQuizOptions");

        labelEl.textContent = quizCategoryLabels.subject;
        questionEl.textContent = q.question;

        const options = [
            { key: "A", text: q.option_a },
            { key: "B", text: q.option_b },
            { key: "C", text: q.option_c },
            { key: "D", text: q.option_d }
        ];

        optionsEl.innerHTML = "";

        options.forEach(function (opt) {

            const btn = document.createElement("button");
            btn.className = "quiz-widget-option";
            btn.textContent = opt.text;
            btn.style.cssText =
                "display:block; width:100%; text-align:left; padding:12px 14px; " +
                "margin-bottom:8px; border:2px solid #e5e7eb; border-radius:10px; " +
                "background:#fff; font-size:14px; color:#374151; cursor:pointer;";

            btn.addEventListener("click", function () {

                const allButtons =
                    optionsEl.querySelectorAll("button");

                allButtons.forEach(function (b) {
                    b.disabled = true;
                });

                if (opt.key === q.correct_option) {

                    btn.style.borderColor = "#10b981";
                    btn.style.background = "#d1fae5";
                    btn.style.color = "#047857";

                    // Correct answer - auto close after a short delay
                    setTimeout(function () {
                        closeSubjectQuizWidget();
                    }, 1000);

                } else {

                    btn.style.borderColor = "#ef4444";
                    btn.style.background = "#fee2e2";
                    btn.style.color = "#b91c1c";

                    allButtons.forEach(function (b, i) {
                        if (options[i].key === q.correct_option) {
                            b.style.borderColor = "#10b981";
                            b.style.background = "#d1fae5";
                            b.style.color = "#047857";
                        }
                    });

                    // Wrong answer - stays open, user closes manually

                }

            });

            optionsEl.appendChild(btn);

        });

        overlay.style.display = "flex";

    }

    async function loadSubjectQuizWidget(subjectId) {

        try {

            const res = await fetch(
                `${API_BASE_URL}/api/quiz/subject-widget/${subjectId}`,
                { headers: authHeaders() }
            );

            const data = await res.json();

            if (!data.success || !data.question) {
                return; // No questions yet for this subject - skip silently
            }

            // Build the overlay markup once, if not already present
            if (!document.getElementById("subjectQuizOverlay")) {

                const overlay = document.createElement("div");
                overlay.id = "subjectQuizOverlay";
                overlay.style.cssText =
                    "display:none; position:fixed; inset:0; background:rgba(0,0,0,0.55); " +
                    "z-index:500; align-items:center; justify-content:center; padding:16px;";

                overlay.innerHTML = `
                    <div style="background:#fff; border-radius:18px; max-width:420px; width:100%; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
                        <div id="subjectQuizLabel" style="font-size:12px; font-weight:700; text-transform:uppercase; color:#4f46e5; margin-bottom:8px;"></div>
                        <div id="subjectQuizQuestion" style="font-size:16px; font-weight:700; color:#1f2937; margin-bottom:16px; line-height:1.4;"></div>
                        <div id="subjectQuizOptions"></div>
                        <button id="subjectQuizCloseBtn" style="margin-top:12px; width:100%; padding:10px; border:none; border-radius:10px; background:#f3f4f6; color:#4b5563; font-weight:600; font-size:13px; cursor:pointer;">Close</button>
                    </div>
                `;

                document.body.appendChild(overlay);

                document.getElementById("subjectQuizCloseBtn")
                    .addEventListener("click", closeSubjectQuizWidget);

                overlay.addEventListener("click", function (event) {
                    if (event.target === overlay) {
                        closeSubjectQuizWidget();
                    }
                });

            }

            renderSubjectQuizQuestion(data.question);

        } catch (error) {
            console.warn("Subject quiz widget unavailable:", error);
        }

    }

    // Trigger the subject quiz widget once, on page load
    loadSubjectQuizWidget(subjectId);

    loadUnits(subjectId);
    loadSubjectNotes(subjectId);

    async function loadUnits(subjectId) {
        try {
            const response = await fetch(`/api/subjects/${subjectId}/units`);
            const data = await response.json();

            if (!data.success) {
                subjectContainer.innerHTML = `<p>${data.message || "Unable to load subject."}</p>`;
                return;
            }

            renderSubject(data.subject);
            renderUnits(data.units);
        } catch (error) {
            console.error("Load Units Error:", error);
            subjectContainer.innerHTML = "<p>Something went wrong while loading this subject.</p>";
        }
    }

    function renderSubject(subject) {
        subjectContainer.innerHTML = `
            <div class="subject-card">
                <h3>${subject.subject_name}</h3>
                <p><strong>Code:</strong> ${subject.subject_code}</p>
                <div id="subjectNotesArea"></div>
            </div>
        `;
    }

    // ==========================================
    // INLINE FILE VIEWER (now with view/download tracking)
    // ==========================================

    let fileViewerCounter = 0;

    function renderFileButton(fileUrl, noteId, noteType, views, downloads) {

        if (!fileUrl) return "";

        fileViewerCounter++;
        const uid = `file-view-${fileViewerCounter}`;

        return `
            <div style="margin-top:8px;">
                <span style="font-size:12px; font-weight:600; color:#4b5563; background:#f3f4f6; padding:3px 8px; border-radius:999px; margin-right:6px;">
                    👁️ ${views || 0} views
                </span>
                <span style="font-size:12px; font-weight:600; color:#4b5563; background:#f3f4f6; padding:3px 8px; border-radius:999px; margin-right:8px;">
                    ⬇️ ${downloads || 0} downloads
                </span>
                <button onclick="toggleFileView('${uid}', ${noteId}, '${noteType}')" style="padding:4px 10px; font-size:13px;">
                    📄 Open File
                </button>
                <button onclick="downloadNote(${noteId}, '${noteType}')" style="padding:4px 10px; font-size:13px; margin-left:6px; background:#16a34a;">
                    ⬇️ Download
                </button>
                <div id="${uid}" style="display:none; margin-top:10px;"></div>
            </div>
        `;

    }

    window.toggleFileView = async function (uid, noteId, noteType) {

        const container = document.getElementById(uid);

        if (container.style.display === "block") {
            container.style.display = "none";
            container.innerHTML = "";
            return;
        }

        try {

            const res = await fetch(
                `${API_BASE_URL}/api/subjects/notes/${noteId}/view?type=${noteType}`
            );
            const data = await res.json();

            if (!data.success || !data.note || !data.note.file_url) {
                container.style.display = "block";
                container.innerHTML = "<p>Unable to load file.</p>";
                return;
            }

            container.style.display = "block";
            container.innerHTML = `
                <iframe
                    src="${data.note.file_url}"
                    style="width:100%; height:600px; border:1px solid #ccc; border-radius:6px;"
                ></iframe>
            `;

        } catch (error) {
            console.error("View file error:", error);
            container.style.display = "block";
            container.innerHTML = "<p>Unable to connect to server.</p>";
        }

    };

    window.downloadNote = function (noteId, noteType) {
        window.location.href =
            `${API_BASE_URL}/api/subjects/notes/${noteId}/download?type=${noteType}`;
    };

    // ==========================================
    // BOOKMARKS
    // Works for all three note types now:
    // 'content' (topic notes), 'unit' (short_notes),
    // 'subject' (subject_notes)
    // ==========================================

    async function isBookmarked(noteId, noteType) {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/bookmarks/check/${noteId}?type=${noteType}`,
                { headers: authHeaders() }
            );
            const data = await res.json();
            return data.success ? data.bookmarked : false;
        } catch (error) {
            console.error("Bookmark Check Error:", error);
            return false;
        }
    }

    // Escapes text so it can safely sit inside an HTML attribute
    function escAttr(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renderBookmarkButton(noteId, noteType, title, fileUrl, bookmarked) {
        return `
            <button
                class="bookmark-btn"
                onclick="toggleBookmark(${noteId}, '${noteType}', '${escAttr(title)}', '${escAttr(fileUrl)}', this)"
                style="margin-left:8px; padding:4px 10px; font-size:13px; background:${bookmarked ? '#fef3c7' : '#f3f4f6'}; border:1px solid #e5e7eb; border-radius:6px; cursor:pointer;"
            >
                ${bookmarked ? "🔖 Bookmarked" : "🔖 Bookmark"}
            </button>
        `;
    }

    window.toggleBookmark = async function (noteId, noteType, title, fileUrl, btnEl) {

        const isCurrentlyBookmarked = btnEl.textContent.includes("Bookmarked");

        btnEl.disabled = true;

        try {

            if (isCurrentlyBookmarked) {

                const res = await fetch(
                    `${API_BASE_URL}/api/bookmarks/${noteId}?type=${noteType}`,
                    { method: "DELETE", headers: authHeaders() }
                );
                const data = await res.json();

                if (data.success) {
                    btnEl.textContent = "🔖 Bookmark";
                    btnEl.style.background = "#f3f4f6";
                }

            } else {

                const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        note_id: noteId,
                        note_type: noteType,
                        title: title,
                        file_url: fileUrl || null
                    })
                });
                const data = await res.json();

                if (data.success || res.status === 409) {
                    btnEl.textContent = "🔖 Bookmarked";
                    btnEl.style.background = "#fef3c7";
                }

            }

        } catch (error) {
            console.error("Toggle Bookmark Error:", error);
            alert("Unable to update bookmark. Please try again.");
        } finally {
            btnEl.disabled = false;
        }

    };

    // ==========================================
    // PROGRESS TRACKING
    // Works for all three note types now:
    // 'content' (topics), 'unit' (short_notes),
    // 'subject' (subject_notes)
    // ==========================================

    async function getProgress(noteId, noteType) {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/progress/check/${noteId}?type=${noteType}`,
                { headers: authHeaders() }
            );
            const data = await res.json();
            return data.success ? data.completed : false;
        } catch (error) {
            console.error("Progress Check Error:", error);
            return false;
        }
    }

    function renderProgressCheckbox(noteId, noteType, completed) {
        return `
            <label style="margin-left:10px; font-size:13px; cursor:pointer; user-select:none;">
                <input
                    type="checkbox"
                    ${completed ? "checked" : ""}
                    onchange="toggleProgress(${noteId}, '${noteType}', this)"
                    style="margin-right:4px; vertical-align:middle;"
                >
                ✅ Mark as Done
            </label>
        `;
    }

    window.toggleProgress = async function (noteId, noteType, checkboxEl) {

        const completed = checkboxEl.checked;
        checkboxEl.disabled = true;

        try {

            const res = await fetch(`${API_BASE_URL}/api/progress/${noteId}`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ completed, note_type: noteType })
            });

            const data = await res.json();

            if (!data.success) {
                checkboxEl.checked = !completed;
                alert(data.message || "Unable to update progress.");
            }

        } catch (error) {
            console.error("Toggle Progress Error:", error);
            checkboxEl.checked = !completed;
            alert("Unable to connect to server.");
        } finally {
            checkboxEl.disabled = false;
        }

    };

    // Fetches and renders notes uploaded directly to the whole subject
    async function loadSubjectNotes(subjectId) {
        try {
            const response = await fetch(`/api/subjects/${subjectId}/subject-notes`);
            const data = await response.json();

            const area = document.getElementById("subjectNotesArea");
            if (!area) return;

            if (!data.success || !data.subject_notes || data.subject_notes.length === 0) {
                return;
            }

            const bookmarkStates = await Promise.all(
                data.subject_notes.map(note => isBookmarked(note.id, "subject"))
            );

            const progressStates = await Promise.all(
                data.subject_notes.map(note => getProgress(note.id, "subject"))
            );

            area.innerHTML = `
                <div style="margin-top:14px;">
                    <strong>Subject Notes:</strong>
                    ${data.subject_notes.map((note, i) => `
                        <div style="background:#fff7e6; padding:10px; border-radius:6px; margin-top:6px;">
                            <strong>${note.title}</strong>
                            ${renderBookmarkButton(note.id, "subject", note.title, note.file_url, bookmarkStates[i])}
                            ${renderProgressCheckbox(note.id, "subject", progressStates[i])}
                            ${note.body ? `<p style="margin:6px 0;">${note.body}</p>` : ""}
                            ${renderFileButton(note.file_url, note.id, "subject", note.views, note.downloads)}
                        </div>
                    `).join("")}
                </div>
            `;
        } catch (error) {
            console.error("Load Subject Notes Error:", error);
        }
    }

    function renderUnits(units) {
        if (!units || units.length === 0) {
            unitContainer.innerHTML = "<p>No units added yet for this subject.</p>";
            return;
        }

        unitContainer.innerHTML = units.map(unit => `
            <div class="unit-card">
                <div class="unit-number">Unit ${unit.unit_number}</div>
                <h3>${unit.unit_name}</h3>
                <button onclick="viewUnitContents(${unit.id})">View Topics</button>
                <div id="contents-${unit.id}"></div>
            </div>
        `).join("");
    }

    async function getNoteCount(contentId) {
        try {
            const response = await fetch(`/api/subjects/content/${contentId}/notes`);
            const data = await response.json();

            if (!data.success || !data.notes) {
                return 0;
            }

            return data.notes.length;
        } catch (error) {
            console.error(`Note Count Error (content ${contentId}):`, error);
            return 0;
        }
    }

    window.viewUnitContents = async function (unitId) {
        const target = document.getElementById(`contents-${unitId}`);
        target.innerHTML = "<p>Loading topics...</p>";

        try {
            const [contentsRes, shortNotesRes] = await Promise.all([
                fetch(`/api/subjects/unit/${unitId}/contents`),
                fetch(`/api/subjects/unit/${unitId}/short-notes`)
            ]);

            const data = await contentsRes.json();
            const shortNotesData = await shortNotesRes.json();

            const shortNotes = (shortNotesData.success && shortNotesData.short_notes)
                ? shortNotesData.short_notes
                : [];

            if (!data.success) {
                target.innerHTML = `<p>${data.message || "Unable to load topics."}</p>`;
                return;
            }

            let shortNotesHtml = "";
            if (shortNotes.length > 0) {

                const shortBookmarkStates = await Promise.all(
                    shortNotes.map(note => isBookmarked(note.id, "unit"))
                );

                const shortProgressStates = await Promise.all(
                    shortNotes.map(note => getProgress(note.id, "unit"))
                );

                shortNotesHtml = `
                    <div style="margin-bottom:14px;">
                        <strong>Unit Notes:</strong>
                        ${shortNotes.map((note, i) => `
                            <div style="background:#f0f4ff; padding:10px; border-radius:6px; margin-top:6px;">
                                <strong>${note.title}</strong>
                                ${renderBookmarkButton(note.id, "unit", note.title, note.file_url, shortBookmarkStates[i])}
                                ${renderProgressCheckbox(note.id, "unit", shortProgressStates[i])}
                                ${note.body ? `<p style="margin:6px 0;">${note.body}</p>` : ""}
                                ${renderFileButton(note.file_url, note.id, "unit", note.views, note.downloads)}
                            </div>
                        `).join("")}
                    </div>
                `;
            }

            if (!data.contents || data.contents.length === 0) {
                target.innerHTML = shortNotesHtml || "<p>No topics added yet.</p>";
                return;
            }

            const counts = await Promise.all(
                data.contents.map(c => getNoteCount(c.id))
            );

            const contentsWithNotes = data.contents.filter((c, i) => counts[i] > 0);

            if (contentsWithNotes.length === 0 && shortNotes.length === 0) {
                target.innerHTML = "<p>No notes uploaded yet for this unit.</p>";
                return;
            }

            const progressStates = await Promise.all(
                contentsWithNotes.map(c => getProgress(c.id, "content"))
            );

            target.innerHTML = shortNotesHtml + `
                <ul style="list-style:none; padding-left:0;">
                    ${contentsWithNotes.map((c, i) => `
                        <li style="margin-bottom:10px;">
                            <strong>${c.content_number}. ${c.content_name}</strong>
                            <button onclick="viewNotes(${c.id})" style="margin-left:10px; padding:4px 10px; font-size:13px;">View Notes</button>
                            ${renderProgressCheckbox(c.id, "content", progressStates[i])}
                            <div id="notes-${c.id}" style="margin-top:8px;"></div>
                        </li>
                    `).join("")}
                </ul>
            `;
        } catch (error) {
            console.error("Load Contents Error:", error);
            target.innerHTML = "<p>Something went wrong while loading topics.</p>";
        }
    };

    window.viewNotes = async function (contentId) {
        const target = document.getElementById(`notes-${contentId}`);
        target.innerHTML = "Loading notes...";

        try {
            const response = await fetch(`/api/subjects/content/${contentId}/notes`);
            const data = await response.json();

            if (!data.success) {
                target.innerHTML = `<p>${data.message || "Unable to load notes."}</p>`;
                return;
            }

            if (!data.notes || data.notes.length === 0) {
                target.innerHTML = "<em>No notes uploaded yet for this topic.</em>";
                return;
            }

            const bookmarkStates = await Promise.all(
                data.notes.map(note => isBookmarked(note.id, "content"))
            );

            target.innerHTML = data.notes.map((note, i) => `
                <div style="background:#f0f4ff; padding:10px; border-radius:6px; margin-bottom:6px;">
                    <strong>${note.title}</strong>
                    ${renderBookmarkButton(note.id, "content", note.title, note.file_url, bookmarkStates[i])}
                    ${note.body ? `<p style="margin:6px 0;">${note.body}</p>` : ""}
                    ${renderFileButton(note.file_url, note.id, "content", note.views, note.downloads)}
                </div>
            `).join("");
        } catch (error) {
            console.error("Load Notes Error:", error);
            target.innerHTML = "<p>Something went wrong while loading notes.</p>";
        }
    };

});