// ==========================================
// GET SUBJECT ID FROM URL
// ==========================================

const params = new URLSearchParams(window.location.search);
const subjectId = params.get("subjectId") || localStorage.getItem("selectedSubject");

if (!subjectId) {
    window.location.href = "dashboard.html";
}


// ==========================================
// ELEMENTS
// ==========================================

const subjectTitle = document.getElementById("subjectTitle");
const unitsContainer = document.getElementById("unitsContainer");


// ==========================================
// LOAD UNITS FROM DATABASE
// ==========================================

async function loadUnits() {

    try {

        const response = await fetch(
            `http://localhost:5000/api/subjects/${subjectId}/units`
        );

        const data = await response.json();

        if (!data.success) {
            unitsContainer.innerHTML = "<p>Unable to load units.</p>";
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

            const card = document.createElement("div");
            card.className = "unit-card";

            card.innerHTML = `
                <h3>
                    Unit ${unit.unit_number}: ${unit.unit_name}
                </h3>

                <p>${unit.description || ""}</p>

                <button onclick="openUnit(${unit.id})">
                    View Contents →
                </button>
            `;

            unitsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);

        unitsContainer.innerHTML =
            "<p>Unable to connect to server.</p>";

    }

}


// ==========================================
// OPEN UNIT (go to contents page)
// ==========================================

function openUnit(unitId) {

    localStorage.setItem("selectedUnit", unitId);

    window.location.href = `contents.html?unitId=${unitId}`;

}


// ==========================================
// BACK BUTTON
// ==========================================

function goBack() {

    window.location.href = "dashboard.html";

}


// ==========================================
// START PAGE
// ==========================================

loadUnits();