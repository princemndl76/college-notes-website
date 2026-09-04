const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";


// ==========================================
// GET CONTENT ID FROM URL
// ==========================================

const params = new URLSearchParams(window.location.search);

const contentId =
    params.get("contentId") ||
    localStorage.getItem("selectedContent");


// ==========================================
// CHECK CONTENT ID
// ==========================================

if (!contentId) {
    alert("Content not found.");
    window.location.href = "dashboard.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const contentTitle =
    document.getElementById("contentTitle");

const notesContainer =
    document.getElementById("notesContainer");


// ==========================================
// GET LOGIN TOKEN
// ==========================================

function getToken() {

    const userData =
        localStorage.getItem("user");

    if (!userData) {
        return null;
    }

    try {

        const user =
            JSON.parse(userData);

        return (
            user.token ||
            user.accessToken ||
            user.jwt ||
            null
        );

    } catch (error) {

        console.error(
            "User data error:",
            error
        );

        return null;
    }
}


// ==========================================
// LOAD CONTENT + NOTES
// ==========================================

async function loadNotes() {

    try {

        notesContainer.innerHTML =
            "<p>Loading notes...</p>";


        // ======================================
        // LOAD NOTES
        // ======================================

        const response = await fetch(
            `${API_BASE_URL}/api/subjects/content/${contentId}/notes`
        );

        const data =
            await response.json();


        if (!data.success) {

            notesContainer.innerHTML =
                "<p>Unable to load notes.</p>";

            return;
        }


        // ======================================
        // CONTENT TITLE
        // ======================================

        if (data.content) {

            contentTitle.textContent =
                `📖 ${data.content.content_name}`;

        } else {

            contentTitle.textContent =
                "📖 Study Notes";

        }


        // ======================================
        // NO NOTES
        // ======================================

        if (
            !data.notes ||
            data.notes.length === 0
        ) {

            notesContainer.innerHTML = `
                <div class="note-card">
                    <h3>No notes available</h3>
                    <p>
                        Notes for this topic have not been
                        uploaded yet.
                    </p>
                </div>
            `;

            return;
        }


        // ======================================
        // DISPLAY NOTES
        // ======================================

        notesContainer.innerHTML = "";


        for (const note of data.notes) {

            const noteCard =
                document.createElement("div");

            noteCard.className =
                "note-card";


            noteCard.innerHTML = `

                <div class="note-header">

                    <h3>
                        ${escapeHTML(note.title || "Untitled Note")}
                    </h3>

                </div>


                <div class="note-body">

                    ${formatNoteBody(note.body)}

                </div>


                <div class="note-actions">

                    ${
                        note.file_url
                            ? `
                                <a
                                    href="${note.file_url}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="note-file-btn"
                                >
                                    📄 View File
                                </a>
                              `
                            : ""
                    }


                    <button
                        class="bookmark-btn"
                        id="bookmark-${note.id}"
                        onclick="toggleBookmark(${note.id})"
                    >
                        🔖 Save Note
                    </button>

                </div>

            `;


            notesContainer.appendChild(
                noteCard
            );


            // Check bookmark status

            checkBookmark(
                note.id
            );

        }

    }

    catch (error) {

        console.error(
            "Load notes error:",
            error
        );

        notesContainer.innerHTML = `
            <div class="note-card">
                <h3>Unable to load notes</h3>
                <p>
                    Please check your internet connection
                    and try again.
                </p>
            </div>
        `;

    }

}


// ==========================================
// CHECK BOOKMARK
// ==========================================

async function checkBookmark(noteId) {

    const token =
        getToken();

    const button =
        document.getElementById(
            `bookmark-${noteId}`
        );


    if (!button) {
        return;
    }


    // User is not logged in

    if (!token) {

        button.textContent =
            "🔖 Save Note";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/bookmarks/check/${noteId}`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            data.success &&
            data.bookmarked
        ) {

            button.textContent =
                "✅ Saved";

            button.classList.add(
                "bookmarked"
            );

        } else {

            button.textContent =
                "🔖 Save Note";

            button.classList.remove(
                "bookmarked"
            );

        }

    }

    catch (error) {

        console.error(
            "Check bookmark error:",
            error
        );

    }

}


// ==========================================
// TOGGLE BOOKMARK
// ==========================================

async function toggleBookmark(noteId) {

    const token =
        getToken();


    // ======================================
    // LOGIN CHECK
    // ======================================

    if (!token) {

        alert(
            "Please login to save notes."
        );

        return;
    }


    const button =
        document.getElementById(
            `bookmark-${noteId}`
        );


    if (!button) {
        return;
    }


    const isSaved =
        button.classList.contains(
            "bookmarked"
        );


    try {

        button.disabled = true;


        // ==================================
        // REMOVE BOOKMARK
        // ==================================

        if (isSaved) {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/bookmarks/${noteId}`,
                    {
                        method: "DELETE",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!data.success) {

                alert(
                    data.message ||
                    "Unable to remove bookmark."
                );

                return;
            }


            button.textContent =
                "🔖 Save Note";

            button.classList.remove(
                "bookmarked"
            );

        }


        // ==================================
        // ADD BOOKMARK
        // ==================================

        else {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/bookmarks`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            note_id: noteId
                        })
                    }
                );


            const data =
                await response.json();


            if (!data.success) {

                if (
                    response.status === 409
                ) {

                    button.textContent =
                        "✅ Saved";

                    button.classList.add(
                        "bookmarked"
                    );

                    return;

                }


                alert(
                    data.message ||
                    "Unable to save note."
                );

                return;
            }


            button.textContent =
                "✅ Saved";

            button.classList.add(
                "bookmarked"
            );

        }

    }

    catch (error) {

        console.error(
            "Bookmark error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

    finally {

        button.disabled = false;

    }

}


// ==========================================
// FORMAT NOTE BODY
// ==========================================

function formatNoteBody(body) {

    if (!body) {
        return "<p>No note content available.</p>";
    }


    return escapeHTML(body)
        .replace(/\n/g, "<br>");
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


// ==========================================
// BACK BUTTON
// ==========================================

function goBack() {

    window.history.back();

}


// ==========================================
// START PAGE
// ==========================================

loadNotes();