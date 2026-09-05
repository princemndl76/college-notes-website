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
    // INLINE FILE VIEWER
    // ==========================================

    let fileViewerCounter = 0;

    function renderFileButton(fileUrl) {

        if (!fileUrl) return "";

        fileViewerCounter++;
        const uid = `file-view-${fileViewerCounter}`;

        return `
            <div style="margin-top:8px;">
                <button onclick="toggleFileView('${uid}', '${fileUrl}')" style="padding:4px 10px; font-size:13px;">
                    📄 Open File
                </button>
                <div id="${uid}" style="display:none; margin-top:10px;"></div>
            </div>
        `;

    }

    window.toggleFileView = function (uid, fileUrl) {

        const container = document.getElementById(uid);

        if (container.style.display === "block") {
            container.style.display = "none";
            container.innerHTML = "";
            return;
        }

        container.style.display = "block";
        container.innerHTML = `
            <iframe
                src="${fileUrl}"
                style="width:100%; height:600px; border:1px solid #ccc; border-radius:6px;"
            ></iframe>
        `;

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
                            ${renderFileButton(note.file_url)}
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
                                ${renderFileButton(note.file_url)}
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
                    ${renderFileButton(note.file_url)}
                </div>
            `).join("");
        } catch (error) {
            console.error("Load Notes Error:", error);
            target.innerHTML = "<p>Something went wrong while loading notes.</p>";
        }
    };

});