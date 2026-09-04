const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";


// ==========================================
// GET SUBJECT ID
// ==========================================

const params = new URLSearchParams(window.location.search);

const subjectId =
    params.get("subjectId") ||
    localStorage.getItem("selectedSubject");

if (!subjectId) {
    window.location.href = "dashboard.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const subjectTitle =
    document.getElementById("subjectTitle");

const unitsContainer =
    document.getElementById("unitsContainer");


// ==========================================
// LOAD UNITS
// ==========================================

async function loadUnits() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/subjects/${subjectId}/units`
        );

        const data = await response.json();

        if (!data.success) {

            unitsContainer.innerHTML =
                "<p>Unable to load units.</p>";

            return;
        }

        subjectTitle.textContent =
            `📘 ${data.subject.subject_name}`;

        unitsContainer.innerHTML = "";

        if (!data.units || data.units.length === 0) {

            unitsContainer.innerHTML =
                "<p>No units available yet for this subject.</p>";

            return;
        }


        data.units.forEach(function (unit) {

            const card =
                document.createElement("div");

            card.className = "unit-card";

            card.id =
                `unit-card-${unit.id}`;


            card.innerHTML = `

                <h3>
                    Unit ${unit.unit_number}: ${unit.unit_name}
                </h3>

                <p>
                    ${unit.description || ""}
                </p>

                <button
                    id="toggle-btn-${unit.id}"
                    onclick="toggleUnit(${unit.id})"
                >
                    View Topics →
                </button>

                <div
                    id="contents-${unit.id}"
                    class="unit-contents"
                    style="
                        display:none;
                        margin-top:15px;
                    "
                ></div>

            `;

            unitsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "Load units error:",
            error
        );

        unitsContainer.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


// ==========================================
// TOGGLE TOPICS
// ==========================================

async function toggleUnit(unitId) {

    const contentsDiv =
        document.getElementById(
            `contents-${unitId}`
        );

    const toggleBtn =
        document.getElementById(
            `toggle-btn-${unitId}`
        );


    // CLOSE

    if (contentsDiv.style.display === "block") {

        contentsDiv.style.display = "none";

        toggleBtn.textContent =
            "View Topics →";

        return;
    }


    // OPEN

    contentsDiv.style.display = "block";

    contentsDiv.innerHTML =
        "<p>Loading topics...</p>";

    toggleBtn.textContent =
        "Hide Topics ↑";


    localStorage.setItem(
        "selectedUnit",
        unitId
    );


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/subjects/unit/${unitId}/contents`
        );

        const data = await response.json();


        if (!data.success) {

            contentsDiv.innerHTML =
                "<p>Unable to load topics.</p>";

            return;
        }


        if (
            !data.contents ||
            data.contents.length === 0
        ) {

            contentsDiv.innerHTML =
                "<p>No topics available yet.</p>";

            return;
        }


        contentsDiv.innerHTML = "";


        data.contents.forEach(function (content) {

            const item =
                document.createElement("div");

            item.className =
                "content-card";


            item.innerHTML = `

                <div class="content-number">
                    Content ${content.content_number}
                </div>

                <h4>
                    ${content.content_name}
                </h4>

                <button
                    onclick="openContent(${content.id})"
                >
                    📖 View Notes →
                </button>

            `;

            contentsDiv.appendChild(item);

        });

    }

    catch (error) {

        console.error(
            "Load topics error:",
            error
        );

        contentsDiv.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


// ==========================================
// OPEN NOTES
// ==========================================

function openContent(contentId) {

    localStorage.setItem(
        "selectedContent",
        contentId
    );

    window.location.href =
        `notes.html?contentId=${contentId}`;

}


// ==========================================
// BACK BUTTON
// ==========================================

function goBack() {

    window.location.href =
        "dashboard.html";

}


// ==========================================
// START
// ==========================================

loadUnits();