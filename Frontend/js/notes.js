const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";


// ==========================================
// GET CONTENT ID
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
// GET TOKEN
// ==========================================

function getToken() {

    // First try user object
    const userData = localStorage.getItem("user");

    if (userData) {

        try {

            const user = JSON.parse(userData);

            if (user.token) {
                return user.token;
            }

            if (user.accessToken) {
                return user.accessToken;
            }

            if (user.jwt) {
                return user.jwt;
            }

        } catch (error) {

            console.error(
                "User JSON error:",
                error
            );

        }
    }


    // Also check standalone token
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        null
    );
}


// ==========================================
// LOAD NOTES
// ==========================================

async function loadNotes() {

    try {

        notesContainer.innerHTML =
            "<p>Loading notes...</p>";


        const response = await fetch(
            `${API_BASE_URL}/api/subjects/content/${contentId}/notes`
        );


        const data = await response.json();


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
                        ${escapeHTML(
                            note.title ||
                            "Untitled Note"
                        )}
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


                    <button
                        class="progress-btn"
                        id="progress-${note.id}"
                        onclick="toggleProgress(${contentId})"
                    >
                        ⏳ Mark as Completed
                    </button>

                </div>

            `;


            notesContainer.appendChild(noteCard);


            // Check bookmark
            checkBookmark(note.id);


            // Check progress
            checkProgress(contentId);

        }

    }

    catch (error) {

        console.error(
            "Load notes error:",
            error
        );

        notesContainer.innerHTML = `

            <div class="note-card">

                <h3>
                    Unable to load notes
                </h3>

                <p>
                    Please check your internet connection
                    and try again.
                </p>

            </div>

        `;

    }

}


// ==========================================
// BOOKMARK STATUS
// ==========================================

async function checkBookmark(noteId) {

    const token = getToken();

    const button =
        document.getElementById(
            `bookmark-${noteId}`
        );


    if (!button) {
        return;
    }


    if (!token) {

        button.textContent =
            "🔖 Login to Save";

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

    const token = getToken();


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
        // REMOVE
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
        // ADD
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
// CHECK PROGRESS
// ==========================================

async function checkProgress(contentId) {

    const token = getToken();

    const button =
        document.getElementById(
            `progress-${getFirstNoteId()}`
        );


    if (!button) {
        return;
    }


    if (!token) {

        button.textContent =
            "🔒 Login to Track Progress";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/progress/check/${contentId}`,
                {
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
            data.completed
        ) {

            button.textContent =
                "✅ Completed";

            button.classList.add(
                "completed"
            );

        } else {

            button.textContent =
                "⏳ Mark as Completed";

            button.classList.remove(
                "completed"
            );

        }

    }

    catch (error) {

        console.error(
            "Check progress error:",
            error
        );

    }

}


// ==========================================
// GET FIRST NOTE ID
// ==========================================

function getFirstNoteId() {

    const button =
        document.querySelector(
            ".progress-btn"
        );

    if (!button) {
        return null;
    }


    const id =
        button.id.replace(
            "progress-",
            ""
        );

    return id;

}


// ==========================================
// TOGGLE PROGRESS
// ==========================================

async function toggleProgress(contentId) {

    const token = getToken();


    if (!token) {

        alert(
            "Please login to track your progress."
        );

        return;
    }


    const progressButton =
        document.querySelector(
            ".progress-btn"
        );


    if (!progressButton) {
        return;
    }


    const completed =
        progressButton.classList.contains(
            "completed"
        );


    try {

        progressButton.disabled = true;


        const response =
            await fetch(
                `${API_BASE_URL}/api/progress/${contentId}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        completed:
                            !completed
                    })
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            alert(
                data.message ||
                "Unable to update progress."
            );

            return;
        }


        if (data.completed) {

            progressButton.textContent =
                "✅ Completed";

            progressButton.classList.add(
                "completed"
            );

        } else {

            progressButton.textContent =
                "⏳ Mark as Completed";

            progressButton.classList.remove(
                "completed"
            );

        }

    }

    catch (error) {

        console.error(
            "Progress error:",
            error
        );

        alert(
            "Unable to connect to server."
        );

    }

    finally {

        progressButton.disabled = false;

    }

}


// ==========================================
// FORMAT NOTE BODY
// ==========================================

function formatNoteBody(body) {

    if (!body) {

        return `
            <p>
                No note content available.
            </p>
        `;

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
// START
// ==========================================

loadNotes();