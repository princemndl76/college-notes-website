// ==========================================
// GET CONTENT ID FROM URL
// ==========================================

const params = new URLSearchParams(window.location.search);
const contentId = params.get("contentId") || localStorage.getItem("selectedContent");

if (!contentId) {
    window.location.href = "dashboard.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const contentTitle = document.getElementById("contentTitle");
const notesContainer = document.getElementById("notesContainer");


// ==========================================
// LOAD NOTES FROM DATABASE
// ==========================================

async function loadNotes() {

    try {

        const response = await fetch(
            `http://localhost:5000/api/subjects/content/${contentId}/notes`
        );

        const data = await response.json();

        if (!data.success) {
            notesContainer.innerHTML = "<p>Unable to load notes.</p>";
            return;
        }

        contentTitle.textContent =
            `📝 ${data.content.content_name}`;

        notesContainer.innerHTML = "";

        if (!data.notes || data.notes.length === 0) {
            notesContainer.innerHTML =
                "<p>No notes have been added for this content yet.</p>";
            return;
        }

        data.notes.forEach(function (note) {

            const card = document.createElement("div");
            card.className = "note-card";

            let fileHtml = "";

            if (note.file_url) {

                // Uploaded files are relative (e.g. /uploads/notes/...);
                // external links (e.g. https://...) are used as-is.
                const fullUrl = note.file_url.startsWith("http")
                    ? note.file_url
                    : `http://localhost:5000${note.file_url}`;

                // Try to infer a sensible filename for the download attribute
                const fileName = note.file_url.split("/").pop() || "note-attachment";

                fileHtml = `
                    <div class="note-file-actions">
                        <a
                            class="note-file-link"
                            href="${fullUrl}"
                            target="_blank"
                        >
                            📎 Open Attachment
                        </a>
                        <a
                            class="note-download-link"
                            href="${fullUrl}"
                            download="${fileName}"
                        >
                            ⬇ Download
                        </a>
                    </div>
                `;
            }

            card.innerHTML = `
                <h3>${note.title}</h3>
                <div class="note-body">${note.body || ""}</div>
                ${fileHtml}
            `;

            notesContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);

        notesContainer.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


// ==========================================
// BACK BUTTON
// ==========================================

function goBack() {

    const unitId = localStorage.getItem("selectedUnit");

    if (unitId) {
        window.location.href = `contents.html?unitId=${unitId}`;
    } else {
        window.location.href = "dashboard.html";
    }

}


// ==========================================
// START PAGE
// ==========================================

loadNotes();