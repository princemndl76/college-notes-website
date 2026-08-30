// ==========================================
// GET UNIT ID FROM URL
// ==========================================

const params = new URLSearchParams(window.location.search);
const unitId = params.get("unitId") || localStorage.getItem("selectedUnit");

if (!unitId) {
    window.location.href = "dashboard.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const unitTitle = document.getElementById("unitTitle");
const contentsContainer = document.getElementById("contentsContainer");


// ==========================================
// LOAD CONTENTS FROM DATABASE
// ==========================================

async function loadContents() {

    try {

        const response = await fetch(
            `http://localhost:5000/api/subjects/unit/${unitId}/contents`
        );

        const data = await response.json();

        if (!data.success) {
            contentsContainer.innerHTML = "<p>Unable to load contents.</p>";
            return;
        }

        unitTitle.textContent =
            `📖 Unit ${data.unit.unit_number}: ${data.unit.unit_name}`;

        contentsContainer.innerHTML = "";

        if (!data.contents || data.contents.length === 0) {
            contentsContainer.innerHTML =
                "<p>No contents available yet for this unit.</p>";
            return;
        }

        data.contents.forEach(function (content) {

            const card = document.createElement("div");
            card.className = "content-card";

            card.innerHTML = `
                <div class="content-number">
                    Content ${content.content_number}
                </div>

                <h3>
                    ${content.content_name}
                </h3>

                <button onclick="openContent(${content.id})">
                    View Notes →
                </button>
            `;

            contentsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);

        contentsContainer.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


// ==========================================
// OPEN CONTENT (go to notes page)
// ==========================================

function openContent(contentId) {

    localStorage.setItem("selectedContent", contentId);

    window.location.href = `notes.html?contentId=${contentId}`;

}


// ==========================================
// BACK BUTTON
// ==========================================

function goBack() {

    const subjectId = localStorage.getItem("selectedSubject");

    if (subjectId) {
        window.location.href = `units.html?subjectId=${subjectId}`;
    } else {
        window.location.href = "dashboard.html";
    }

}


// ==========================================
// START PAGE
// ==========================================

loadContents();
