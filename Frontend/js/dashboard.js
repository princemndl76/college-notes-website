// ==========================================
// CHECK LOGIN
// ==========================================

const userData = localStorage.getItem("user");

if (!userData) {
    window.location.href = "/";
}

let user;

try {
    user = JSON.parse(userData);
} catch (error) {
    console.error("Invalid user data:", error);
    localStorage.removeItem("user");
    window.location.href = "/";
}

console.log(
    "Logged in as:",
    user.full_name,
    "| Role:",
    user.role
);


// ==========================================
// WELCOME MESSAGE
// ==========================================

const welcomeMessage =
    document.getElementById("welcomeMessage");

if (welcomeMessage) {
    welcomeMessage.textContent =
        `Welcome, ${user.full_name}! 👋`;
}


// ==========================================
// ADMIN / FEEDBACK
// ==========================================

const adminActionsEl =
    document.getElementById("adminActions");

const feedbackActionsEl =
    document.getElementById("feedbackActions");

if (user.role === "admin") {

    if (adminActionsEl) {
        adminActionsEl.style.display = "inline";
    }

} else {

    if (feedbackActionsEl) {
        feedbackActionsEl.style.display = "inline";
    }

}


// ==========================================
// API
// ==========================================

const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

const ACADEMIC_API =
    `${API_BASE_URL}/api/academic`;

const SUBJECTS_API =
    `${API_BASE_URL}/api/subjects`;

const SEARCH_API =
    `${API_BASE_URL}/api/search`;


// ==========================================
// DOM
// ==========================================

const breadcrumbEl =
    document.getElementById("breadcrumb");

const sectionTitleEl =
    document.getElementById("sectionTitle");

const browseContainer =
    document.getElementById("browseContainer");


// ==========================================
// NAVIGATION STATE
// ==========================================

const state = {
    course: null,
    year: null,
    semester: null
};


// ==========================================
// CREATE SEARCH BOX
// ==========================================

function createSearchBox() {

    let searchInput =
        document.getElementById("globalSearch");

    if (searchInput) {
        return searchInput;
    }

    const topbar =
        document.getElementById("topbar");

    if (!topbar) {
        console.error("Topbar not found.");
        return null;
    }

    const searchWrapper =
        document.createElement("div");

    searchWrapper.id = "searchWrapper";

    searchWrapper.innerHTML = `
        <div class="global-search-box">

            <span class="search-icon">🔍</span>

            <input
                id="globalSearch"
                type="text"
                placeholder="Search subjects, notes, semesters..."
                autocomplete="off"
            >

            <button
                id="clearSearch"
                type="button"
                title="Clear search"
            >
                ×
            </button>

        </div>

        <div
            id="searchResults"
            class="search-results"
        ></div>
    `;

    topbar.insertBefore(
        searchWrapper,
        topbar.lastElementChild
    );

    searchInput =
        document.getElementById("globalSearch");

    addSearchStyles();

    setupSearchEvents();

    return searchInput;
}


// ==========================================
// SEARCH CSS
// ==========================================

function addSearchStyles() {

    if (document.getElementById("globalSearchStyles")) {
        return;
    }

    const style =
        document.createElement("style");

    style.id = "globalSearchStyles";

    style.textContent = `

        #searchWrapper {
            position: relative;
            width: min(470px, 45vw);
            z-index: 100;
        }

        .global-search-box {
            height: 44px;
            background: white;
            border: 2px solid #818cf8;
            border-radius: 14px;
            display: flex;
            align-items: center;
            padding: 0 12px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.10);
        }

        .search-icon {
            font-size: 18px;
            margin-right: 8px;
        }

        #globalSearch {
            flex: 1;
            border: none;
            outline: none;
            font-size: 14px;
            background: transparent;
            min-width: 0;
        }

        #clearSearch {
            border: none;
            background: transparent;
            font-size: 20px;
            cursor: pointer;
            color: #64748b;
            display: none;
        }

        .search-results {
            position: absolute;
            top: 52px;
            left: 0;
            right: 0;
            background: white;
            border-radius: 14px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.20);
            max-height: 430px;
            overflow-y: auto;
            display: none;
        }

        .search-result {
            padding: 14px 16px;
            border-bottom: 1px solid #eef0f4;
            cursor: pointer;
        }

        .search-result:last-child {
            border-bottom: none;
        }

        .search-result:hover {
            background: #f5f7ff;
        }

        .search-result-title {
            font-weight: 700;
            color: #1e1b4b;
            margin-bottom: 4px;
        }

        .search-result-type {
            font-size: 11px;
            color: #4f46e5;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .search-result-meta {
            font-size: 12px;
            color: #64748b;
        }

        .search-message {
            padding: 18px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }

        @media (max-width: 700px) {

            #searchWrapper {
                width: 100%;
                order: 3;
            }

            #topbar {
                flex-wrap: wrap;
            }

        }
    `;

    document.head.appendChild(style);
}


// ==========================================
// SEARCH EVENTS
// ==========================================

function setupSearchEvents() {

    const searchInput =
        document.getElementById("globalSearch");

    const clearButton =
        document.getElementById("clearSearch");

    const resultsBox =
        document.getElementById("searchResults");

    if (!searchInput) {
        return;
    }

    let searchTimer = null;

    searchInput.addEventListener(
        "input",
        function () {

            const query =
                searchInput.value.trim();

            clearButton.style.display =
                query ? "block" : "none";

            clearTimeout(searchTimer);

            if (!query) {
                resultsBox.innerHTML = "";
                resultsBox.style.display = "none";

                showCourses();

                return;
            }

            searchTimer =
                setTimeout(
                    () => performSearch(query),
                    300
                );
        }
    );

    clearButton.addEventListener(
        "click",
        function () {

            searchInput.value = "";

            clearButton.style.display = "none";

            resultsBox.innerHTML = "";

            resultsBox.style.display = "none";

            showCourses();

            searchInput.focus();

        }
    );

    document.addEventListener(
        "click",
        function (event) {

            if (!searchInput.contains(event.target) &&
                !resultsBox.contains(event.target)) {

                resultsBox.style.display = "none";
            }

        }
    );

}


// ==========================================
// SEARCH DATABASE
// ==========================================

async function performSearch(query) {

    const resultsBox =
        document.getElementById("searchResults");

    if (!resultsBox) {
        return;
    }

    resultsBox.style.display = "block";

    resultsBox.innerHTML =
        `<div class="search-message">
            🔎 Searching for "${escapeHTML(query)}"...
        </div>`;

    try {

        const response =
            await fetch(
                `${SEARCH_API}?q=${encodeURIComponent(query)}`
            );

        const data =
            await response.json();

        console.log("Search response:", data);

        if (!response.ok || !data.success) {

            resultsBox.innerHTML =
                `<div class="search-message">
                    Unable to search right now.
                </div>`;

            return;
        }

        if (!data.results ||
            data.results.length === 0) {

            resultsBox.innerHTML =
                `<div class="search-message">
                    No results found for
                    "<strong>${escapeHTML(query)}</strong>"
                </div>`;

            return;
        }

        resultsBox.innerHTML = "";

        data.results.forEach(function (result) {

            const item =
                document.createElement("div");

            item.className = "search-result";

            const type =
                result.type || "result";

            const title =
                result.title ||
                result.name ||
                result.subject_name ||
                result.content_name ||
                "Untitled";

            let meta = "";

            if (result.code) {
                meta = result.code;
            }

            if (result.description) {

                meta += meta
                    ? ` • ${result.description}`
                    : result.description;
            }

            item.innerHTML = `
                <div class="search-result-type">
                    ${escapeHTML(type)}
                </div>

                <div class="search-result-title">
                    ${escapeHTML(title)}
                </div>

                ${
                    meta
                        ? `<div class="search-result-meta">
                            ${escapeHTML(meta)}
                           </div>`
                        : ""
                }
            `;

            item.addEventListener(
                "click",
                function () {
                    openSearchResult(result);
                }
            );

            resultsBox.appendChild(item);

        });

    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        resultsBox.innerHTML =
            `<div class="search-message">
                ❌ Unable to connect to search server.
            </div>`;
    }
}


// ==========================================
// OPEN SEARCH RESULT
// ==========================================

function openSearchResult(result) {

    const type =
        String(result.type || "")
            .toLowerCase();

    const id =
        result.id;

    const resultsBox =
        document.getElementById("searchResults");

    if (resultsBox) {
        resultsBox.style.display = "none";
    }

    // ------------------------------
    // COURSE
    // ------------------------------

    if (type === "course") {

        showYears({
            id: id,
            course_name:
                result.title ||
                result.name
        });

        return;
    }


    // ------------------------------
    // YEAR
    // ------------------------------

    if (type === "year" ||
        type === "academic_year") {

        showSemesters({
            id: id,
            year_name:
                result.title ||
                result.name
        });

        return;
    }


    // ------------------------------
    // SEMESTER
    // ------------------------------

    if (type === "semester") {

        showSubjects({
            id: id,
            semester_name:
                result.title ||
                result.name
        });

        return;
    }


    // ------------------------------
    // SUBJECT
    // ------------------------------

    if (type === "subject") {

        openSubject(id);

        return;
    }


    // ------------------------------
    // CONTENT
    // ------------------------------

    if (type === "content") {

        localStorage.setItem(
            "selectedContent",
            id
        );

        window.location.href =
            `notes.html?contentId=${id}`;

        return;
    }


    // ------------------------------
    // NOTE
    // ------------------------------

    if (type === "note") {

        if (result.content_id) {

            localStorage.setItem(
                "selectedContent",
                result.content_id
            );

            window.location.href =
                `notes.html?contentId=${result.content_id}`;

        } else {

            alert(
                "This note cannot be opened directly yet."
            );
        }

        return;
    }


    // ------------------------------
    // UNIT
    // ------------------------------

    if (type === "unit") {

        if (result.subject_id) {

            openSubject(
                result.subject_id
            );

        } else {

            alert(
                "This unit cannot be opened directly yet."
            );
        }

        return;
    }

    alert(
        "Search result found, but navigation for this result is not available yet."
    );
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


// ==========================================
// BREADCRUMB
// ==========================================

function renderBreadcrumb() {

    const crumbs = [
        {
            label: "Courses",
            onClick: showCourses
        }
    ];

    if (state.course) {

        crumbs.push({
            label: state.course.course_name,
            onClick: () =>
                showYears(state.course)
        });
    }

    if (state.year) {

        crumbs.push({
            label: state.year.year_name,
            onClick: () =>
                showSemesters(state.year)
        });
    }

    if (state.semester) {

        crumbs.push({
            label:
                state.semester.semester_name,

            onClick: () =>
                showSubjects(state.semester)
        });
    }

    breadcrumbEl.innerHTML = "";

    crumbs.forEach(
        function (crumb, index) {

            const isLast =
                index === crumbs.length - 1;

            const btn =
                document.createElement("button");

            btn.textContent =
                crumb.label;

            btn.disabled =
                isLast;

            if (!isLast) {
                btn.addEventListener(
                    "click",
                    crumb.onClick
                );
            }

            breadcrumbEl.appendChild(btn);

            if (!isLast) {

                const sep =
                    document.createElement("span");

                sep.className = "sep";

                sep.textContent = "›";

                breadcrumbEl.appendChild(sep);
            }

        }
    );
}


// ==========================================
// STEP 1 — COURSES
// ==========================================

async function showCourses() {

    state.course = null;
    state.year = null;
    state.semester = null;

    renderBreadcrumb();

    sectionTitleEl.textContent =
        "Choose Your Course";

    browseContainer.innerHTML =
        "<p class='empty-msg'>Loading courses...</p>";

    try {

        const res =
            await fetch(
                `${ACADEMIC_API}/courses`
            );

        const data =
            await res.json();

        if (!data.success) {

            browseContainer.innerHTML =
                "<p class='empty-msg'>Unable to load courses.</p>";

            return;
        }

        if (!data.courses ||
            data.courses.length === 0) {

            browseContainer.innerHTML =
                "<p class='empty-msg'>No courses available yet.</p>";

            return;
        }

        browseContainer.innerHTML = "";

        data.courses.forEach(
            function (course) {

                const card =
                    document.createElement("div");

                card.className =
                    "browse-card";

                card.innerHTML = `
                    <h3>
                        🎓 ${escapeHTML(course.course_name)}
                    </h3>

                    <p class="meta">
                        ${escapeHTML(course.course_code || "")}
                    </p>

                    <p>
                        ${escapeHTML(course.description || "")}
                    </p>

                    <button>
                        Browse Years →
                    </button>
                `;

                card.addEventListener(
                    "click",
                    () => showYears(course)
                );

                browseContainer.appendChild(card);
            }
        );

    } catch (error) {

        console.error(
            "Load courses error:",
            error
        );

        browseContainer.innerHTML =
            "<p class='empty-msg'>Unable to connect to server.</p>";
    }
}


// ==========================================
// STEP 2 — YEARS
// ==========================================

async function showYears(course) {

    state.course = course;
    state.year = null;
    state.semester = null;

    renderBreadcrumb();

    sectionTitleEl.textContent =
        `${course.course_name} — Choose Your Year`;

    browseContainer.innerHTML =
        "<p class='empty-msg'>Loading years...</p>";

    try {

        const res =
            await fetch(
                `${ACADEMIC_API}/courses/${course.id}/years`
            );

        const data =
            await res.json();

        if (!data.success) {

            browseContainer.innerHTML =
                "<p class='empty-msg'>Unable to load years.</p>";

            return;
        }

        if (!data.years ||
            data.years.length === 0) {

            browseContainer.innerHTML =
                "<p class='empty-msg'>No years added yet for this course.</p>";

            return;
        }

        browseContainer.innerHTML = "";

        data.years.forEach(
            function (year) {

                const card =
                    document.createElement("div");

                card.className =
                    "browse-card";

                card.innerHTML = `
                    <h3>
                        📅 ${escapeHTML(year.year_name)}
                    </h3>

                    <button>
                        Browse Semesters →
                    </button>
                `;

                card.addEventListener(
                    "click",
                    () => showSemesters(year)
                );

                browseContainer.appendChild(card);
            }
        );

    } catch (error) {

        console.error(
            "Load years error:",
            error
        );

        browseContainer.innerHTML =
            "<p class='empty-msg'>Unable to connect to server.</p>";
    }
}


// ==========================================
// STEP 3 — SEMESTERS
// ==========================================

async function showSemesters(year) {

    state.year = year;
    state.semester = null;

    renderBreadcrumb();

    sectionTitleEl.textContent =
        `${year.year_name} — Choose Your Semester`;

    browseContainer.innerHTML =
        "<p class='empty-msg'>Loading semesters...</p>";

    try {

        const res =
            await fetch(
                `${ACADEMIC_API}/years/${year.id}/semesters`
            );

        const data =
            await res.json();

        if (!data.success) {

            browseContainer.innerHTML =
                "<p class='empty-msg'>Unable to load semesters.</p>";

            return;
        }

        if (!data.semesters ||
            data.semesters.length === 0) {

            browseContainer.innerHTML =
                "<p class='empty-msg'>No semesters added yet for this year.</p>";

            return;
        }

        browseContainer.innerHTML = "";

        data.semesters.forEach(
            function (semester) {

                const card =
                    document.createElement("div");

                card.className =
                    "browse-card";

                card.innerHTML = `
                    <h3>
                        🗓️ ${escapeHTML(semester.semester_name)}
                    </h3>

                    <button>
                        Browse Subjects →
                    </button>
                `;

                card.addEventListener(
                    "click",
                    () => showSubjects(semester)
                );

                browseContainer.appendChild(card);
            }
        );

    } catch (error) {

        console.error(
            "Load semesters error:",
            error
        );

        browseContainer.innerHTML =
            "<p class='empty-msg'>Unable to connect to server.</p>";
    }
}


// ==========================================
// STEP 4 — SUBJECTS
// ==========================================

async function showSubjects(semester) {

    state.semester = semester;

    renderBreadcrumb();

    sectionTitleEl.textContent =
        `${semester.semester_name} — My Subjects`;

    browseContainer.innerHTML =
        "<p class='empty-msg'>Loading subjects...</p>";

    const pyqButtonHtml = `
        <div style="margin-bottom:20px;">

            <button
                onclick="openPYQ(
                    ${semester.id},
                    '${String(
                        semester.semester_name || ""
                    ).replace(/'/g, "\\'")}'
                )"
                style="
                    padding:10px 20px;
                    border:none;
                    border-radius:10px;
                    background:rgba(255,255,255,0.92);
                    color:#4338ca;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                📝 Previous Year Questions
            </button>

        </div>
    `;

    try {

        const res =
            await fetch(
                `${SUBJECTS_API}/semester/${semester.id}`
            );

        const data =
            await res.json();

        if (!data.success) {

            browseContainer.innerHTML =
                pyqButtonHtml +
                "<p class='empty-msg'>Unable to load subjects.</p>";

            return;
        }

        if (!data.subjects ||
            data.subjects.length === 0) {

            browseContainer.innerHTML =
                pyqButtonHtml +
                "<p class='empty-msg'>No subjects added yet for this semester.</p>";

            return;
        }

        browseContainer.innerHTML =
            pyqButtonHtml;

        data.subjects.forEach(
            function (subject) {

                const card =
                    document.createElement("div");

                card.className =
                    "subject-card";

                card.innerHTML = `
                    <h3>
                        📚 ${escapeHTML(subject.subject_name)}
                    </h3>

                    <p class="subject-code">
                        ${escapeHTML(subject.subject_code || "")}
                    </p>

                    <p>
                        ${escapeHTML(subject.description || "")}
                    </p>

                    <button>
                        View Subject →
                    </button>
                `;

                card.addEventListener(
                    "click",
                    () => openSubject(subject.id)
                );

                browseContainer.appendChild(card);
            }
        );

    } catch (error) {

        console.error(
            "Load subjects error:",
            error
        );

        browseContainer.innerHTML =
            pyqButtonHtml +
            "<p class='empty-msg'>Unable to connect to server.</p>";
    }
}


// ==========================================
// OPEN PYQ
// ==========================================

function openPYQ(
    semesterId,
    semesterName
) {

    window.location.href =
        `pyq.html?semesterId=${semesterId}&semesterName=${encodeURIComponent(semesterName)}`;
}


// ==========================================
// OPEN SUBJECT
// ==========================================

function openSubject(subjectId) {

    localStorage.setItem(
        "selectedSubject",
        subjectId
    );

    window.location.href =
        `subject.html?id=${subjectId}`;
}


// ==========================================
// LOGOUT
// ==========================================

const logoutButton =
    document.getElementById("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem("user");
            localStorage.removeItem("selectedSubject");
            localStorage.removeItem("selectedContent");

            window.location.href = "/";

        }
    );
}


// ==========================================
// START
// ==========================================

createSearchBox();

showCourses();