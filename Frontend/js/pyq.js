const params = new URLSearchParams(window.location.search);
const semesterId = params.get("semesterId");
const semesterName = params.get("semesterName") || "Semester";

document.getElementById("semesterTitle").textContent = semesterName;

const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

const yearGrid = document.getElementById("yearGrid");
const papersContainer = document.getElementById("papersContainer");

const START_YEAR = 2020;
const END_YEAR = 2030;

async function init() {

    let availableYears = [];

    try {
        const res = await fetch(`${API_BASE_URL}/api/pyq/semester/${semesterId}/years`);
        const data = await res.json();
        if (data.success) availableYears = data.availableYears;
    } catch (err) {
        console.error("Load available years error:", err);
    }

    renderYearButtons(availableYears);
}

function renderYearButtons(availableYears) {

    yearGrid.innerHTML = "";

    for (let year = END_YEAR; year >= START_YEAR; year--) {

        const btn = document.createElement("button");
        btn.className = "year-btn" + (availableYears.includes(year) ? " has-papers" : "");
        btn.textContent = `${year}-${year + 1}`;
        btn.addEventListener("click", () => loadPapers(year));

        yearGrid.appendChild(btn);
    }
}

async function loadPapers(year) {

    papersContainer.innerHTML = "<p style='color:white;'>Loading papers...</p>";

    try {
        const res = await fetch(`${API_BASE_URL}/api/pyq/semester/${semesterId}/year/${year}`);
        const data = await res.json();

        if (!data.success) {
            papersContainer.innerHTML = "<p style='color:white;'>Unable to load papers.</p>";
            return;
        }

        if (!data.papers || data.papers.length === 0) {
            papersContainer.innerHTML = `<p style='color:white;'>No papers uploaded yet for ${year}-${year + 1}.</p>`;
            return;
        }

        papersContainer.innerHTML = data.papers.map(paper => `
            <div class="paper-card">
                <h3>${paper.paper_title}</h3>
                <p><strong>${paper.subject_name}</strong> (${paper.subject_code})</p>
                ${paper.description ? `<p>${paper.description}</p>` : ""}
                ${paper.file_url ? `<a href="${paper.file_url}" target="_blank">📄 Open Paper</a>` : ""}
            </div>
        `).join("");

    } catch (err) {
        console.error("Load papers error:", err);
        papersContainer.innerHTML = "<p style='color:white;'>Something went wrong.</p>";
    }
}

init();