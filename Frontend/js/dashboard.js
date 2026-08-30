// ==========================================
// CHECK LOGIN
// ==========================================

const userData = localStorage.getItem("user");

if (!userData) {
    window.location.href = "/";
}

const user = JSON.parse(userData);

console.log("Logged in as:", user.full_name, "| Role:", user.role);


// ==========================================
// WELCOME MESSAGE
// ==========================================

const welcomeMessage =
    document.getElementById("welcomeMessage");

welcomeMessage.textContent =
    `Welcome, ${user.full_name}! 👋`;


// ==========================================
// SHOW ADMIN CONTROLS ONLY TO ADMINS
// Everyone else only sees course content
// and a feedback option.
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
// API BASES
// ==========================================

const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

const ACADEMIC_API = `${API_BASE_URL}/api/academic`;
const SUBJECTS_API = `${API_BASE_URL}/api/subjects`;


// ==========================================
// DOM REFS
// ==========================================

const breadcrumbEl = document.getElementById("breadcrumb");
const sectionTitleEl = document.getElementById("sectionTitle");
const browseContainer = document.getElementById("browseContainer");


// ==========================================
// NAVIGATION STATE
// ==========================================

const state = {
    course: null,
    year: null,
    semester: null
};


// ==========================================
// BREADCRUMB
// ==========================================

function renderBreadcrumb() {

    const crumbs = [
        { label: "Courses", onClick: showCourses }
    ];

    if (state.course) {
        crumbs.push({
            label: state.course.course_name,
            onClick: () => showYears(state.course)
        });
    }

    if (state.year) {
        crumbs.push({
            label: state.year.year_name,
            onClick: () => showSemesters(state.year)
        });
    }

    if (state.semester) {
        crumbs.push({
            label: state.semester.semester_name,
            onClick: () => showSubjects(state.semester)
        });
    }

    breadcrumbEl.innerHTML = "";

    crumbs.forEach(function (crumb, index) {

        const isLast = index === crumbs.length - 1;

        const btn = document.createElement("button");
        btn.textContent = crumb.label;
        btn.disabled = isLast;

        if (!isLast) {
            btn.addEventListener("click", crumb.onClick);
        }

        breadcrumbEl.appendChild(btn);

        if (!isLast) {
            const sep = document.createElement("span");
            sep.className = "sep";
            sep.textContent = "›";
            breadcrumbEl.appendChild(sep);
        }

    });

}


// ==========================================
// STEP 1: COURSES
// ==========================================

async function showCourses() {

    state.course = null;
    state.year = null;
    state.semester = null;

    renderBreadcrumb();
    sectionTitleEl.textContent = "Choose Your Course";
    browseContainer.innerHTML = "<p class='empty-msg'>Loading courses...</p>";

    try {

        const res = await fetch(`${ACADEMIC_API}/courses`);
        const data = await res.json();

        if (!data.success) {
            browseContainer.innerHTML = "<p class='empty-msg'>Unable to load courses.</p>";
            return;
        }

        if (data.courses.length === 0) {
            browseContainer.innerHTML = "<p class='empty-msg'>No courses available yet.</p>";
            return;
        }

        browseContainer.innerHTML = "";

        data.courses.forEach(function (course) {

            const card = document.createElement("div");
            card.className = "browse-card";

            card.innerHTML = `
                <h3>🎓 ${course.course_name}</h3>
                <p class="meta">${course.course_code || ""}</p>
                <p>${course.description || ""}</p>
                <button>Browse Years →</button>
            `;

            card.addEventListener("click", () => showYears(course));

            browseContainer.appendChild(card);

        });

    } catch (error) {

        console.error(error);
        browseContainer.innerHTML = "<p class='empty-msg'>Unable to connect to server.</p>";

    }

}


// ==========================================
// STEP 2: ACADEMIC YEARS
// ==========================================

async function showYears(course) {

    state.course = course;
    state.year = null;
    state.semester = null;

    renderBreadcrumb();
    sectionTitleEl.textContent = `${course.course_name} — Choose Your Year`;
    browseContainer.innerHTML = "<p class='empty-msg'>Loading years...</p>";

    try {

        const res = await fetch(`${ACADEMIC_API}/courses/${course.id}/years`);
        const data = await res.json();

        if (!data.success) {
            browseContainer.innerHTML = "<p class='empty-msg'>Unable to load years.</p>";
            return;
        }

        if (data.years.length === 0) {
            browseContainer.innerHTML = "<p class='empty-msg'>No years added yet for this course.</p>";
            return;
        }

        browseContainer.innerHTML = "";

        data.years.forEach(function (year) {

            const card = document.createElement("div");
            card.className = "browse-card";

            card.innerHTML = `
                <h3>📅 ${year.year_name}</h3>
                <button>Browse Semesters →</button>
            `;

            card.addEventListener("click", () => showSemesters(year));

            browseContainer.appendChild(card);

        });

    } catch (error) {

        console.error(error);
        browseContainer.innerHTML = "<p class='empty-msg'>Unable to connect to server.</p>";

    }

}


// ==========================================
// STEP 3: SEMESTERS
// ==========================================

async function showSemesters(year) {

    state.year = year;
    state.semester = null;

    renderBreadcrumb();
    sectionTitleEl.textContent = `${year.year_name} — Choose Your Semester`;
    browseContainer.innerHTML = "<p class='empty-msg'>Loading semesters...</p>";

    try {

        const res = await fetch(`${ACADEMIC_API}/years/${year.id}/semesters`);
        const data = await res.json();

        if (!data.success) {
            browseContainer.innerHTML = "<p class='empty-msg'>Unable to load semesters.</p>";
            return;
        }

        if (data.semesters.length === 0) {
            browseContainer.innerHTML = "<p class='empty-msg'>No semesters added yet for this year.</p>";
            return;
        }

        browseContainer.innerHTML = "";

        data.semesters.forEach(function (semester) {

            const card = document.createElement("div");
            card.className = "browse-card";

            card.innerHTML = `
                <h3>🗓️ ${semester.semester_name}</h3>
                <button>Browse Subjects →</button>
            `;

            card.addEventListener("click", () => showSubjects(semester));

            browseContainer.appendChild(card);

        });

    } catch (error) {

        console.error(error);
        browseContainer.innerHTML = "<p class='empty-msg'>Unable to connect to server.</p>";

    }

}


// ==========================================
// STEP 4: SUBJECTS
// ==========================================

async function showSubjects(semester) {

    state.semester = semester;

    renderBreadcrumb();
    sectionTitleEl.textContent = `${semester.semester_name} — My Subjects`;
    browseContainer.innerHTML = "<p class='empty-msg'>Loading subjects...</p>";

    try {

        const res = await fetch(`${SUBJECTS_API}/semester/${semester.id}`);
        const data = await res.json();

        if (!data.success) {
            browseContainer.innerHTML = "<p class='empty-msg'>Unable to load subjects.</p>";
            return;
        }

        if (data.subjects.length === 0) {
            browseContainer.innerHTML = "<p class='empty-msg'>No subjects added yet for this semester.</p>";
            return;
        }

        browseContainer.innerHTML = "";

        data.subjects.forEach(function (subject) {

            const card = document.createElement("div");
            card.className = "subject-card";

            card.innerHTML = `
                <h3>📚 ${subject.subject_name}</h3>
                <p class="subject-code">${subject.subject_code}</p>
                <p>${subject.description || ""}</p>
                <button onclick="openSubject(${subject.id})">
                    View Subject →
                </button>
            `;

            browseContainer.appendChild(card);

        });

    } catch (error) {

        console.error(error);
        browseContainer.innerHTML = "<p class='empty-msg'>Unable to connect to server.</p>";

    }

}


// ==========================================
// OPEN SUBJECT
// ==========================================

function openSubject(subjectId) {

    localStorage.setItem(
        "selectedSubject",
        subjectId
    );

    window.location.href = `subject.html?id=${subjectId}`;

}


// ==========================================
// LOGOUT
// ==========================================

const logoutButton =
    document.getElementById("logoutButton");

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem("user");
        localStorage.removeItem("selectedSubject");

        window.location.href = "/";

    }
);


// ==========================================
// START DASHBOARD
// ==========================================

showCourses();