document.addEventListener("DOMContentLoaded", () => {

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

    // Fetches and renders notes uploaded directly to the whole subject
    // (not tied to any specific unit).
    async function loadSubjectNotes(subjectId) {
        try {
            const response = await fetch(`/api/subjects/${subjectId}/subject-notes`);
            const data = await response.json();

            const area = document.getElementById("subjectNotesArea");
            if (!area) return; // subject card hasn't rendered yet, safe to skip

            if (!data.success || !data.subject_notes || data.subject_notes.length === 0) {
                return; // nothing to show
            }

            area.innerHTML = `
                <div style="margin-top:14px;">
                    <strong>Subject Notes:</strong>
                    ${data.subject_notes.map(note => `
                        <div style="background:#fff7e6; padding:10px; border-radius:6px; margin-top:6px;">
                            <strong>${note.title}</strong>
                            ${note.body ? `<p style="margin:6px 0;">${note.body}</p>` : ""}
                            ${note.file_url ? `<a href="${note.file_url}" target="_blank">📄 Open File</a>` : ""}
                        </div>
                    `).join("")}
                </div>
            `;
        } catch (error) {
            console.error("Load Subject Notes Error:", error);
            // Fail silently here — unit notes below are more important
            // and shouldn't be blocked by this optional section.
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

    // Fetches the notes for a single topic and returns how many there are.
    // Used to decide whether a topic should be shown at all.
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

            // Build HTML for unit-level short notes (if any)
            let shortNotesHtml = "";
            if (shortNotes.length > 0) {
                shortNotesHtml = `
                    <div style="margin-bottom:14px;">
                        <strong>Unit Notes:</strong>
                        ${shortNotes.map(note => `
                            <div style="background:#f0f4ff; padding:10px; border-radius:6px; margin-top:6px;">
                                <strong>${note.title}</strong>
                                ${note.body ? `<p style="margin:6px 0;">${note.body}</p>` : ""}
                                ${note.file_url ? `<a href="${note.file_url}" target="_blank">📄 Open File</a>` : ""}
                            </div>
                        `).join("")}
                    </div>
                `;
            }

            if (!data.contents || data.contents.length === 0) {
                target.innerHTML = shortNotesHtml || "<p>No topics added yet.</p>";
                return;
            }

            // Check every topic's note count in parallel, then keep only
            // the ones that actually have notes uploaded.
            const counts = await Promise.all(
                data.contents.map(c => getNoteCount(c.id))
            );

            const contentsWithNotes = data.contents.filter((c, i) => counts[i] > 0);

            if (contentsWithNotes.length === 0 && shortNotes.length === 0) {
                target.innerHTML = "<p>No notes uploaded yet for this unit.</p>";
                return;
            }

            target.innerHTML = shortNotesHtml + `
                <ul style="list-style:none; padding-left:0;">
                    ${contentsWithNotes.map(c => `
                        <li style="margin-bottom:10px;">
                            <strong>${c.content_number}. ${c.content_name}</strong>
                            <button onclick="viewNotes(${c.id})" style="margin-left:10px; padding:4px 10px; font-size:13px;">View Notes</button>
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

            target.innerHTML = data.notes.map(note => `
                <div style="background:#f0f4ff; padding:10px; border-radius:6px; margin-bottom:6px;">
                    <strong>${note.title}</strong>
                    ${note.body ? `<p style="margin:6px 0;">${note.body}</p>` : ""}
                    ${note.file_url ? `<a href="${note.file_url}" target="_blank">📄 Open File</a>` : ""}
                </div>
            `).join("");
        } catch (error) {
            console.error("Load Notes Error:", error);
            target.innerHTML = "<p>Something went wrong while loading notes.</p>";
        }
    };

});