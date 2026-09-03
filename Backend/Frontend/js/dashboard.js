// ==========================================
// CHECK LOGIN
// ==========================================

const userData = localStorage.getItem("user");

if (!userData) {
    window.location.href = "/";
}

const user = JSON.parse(userData);


// ==========================================
// WELCOME MESSAGE
// ==========================================

const welcomeMessage =
    document.getElementById("welcomeMessage");

welcomeMessage.textContent =
    `Welcome, ${user.full_name}! 👋`;


// ==========================================
// SUBJECT CONTAINER
// ==========================================

const subjectsContainer =
    document.getElementById("subjectsContainer");


// ==========================================
// LOAD SUBJECTS FROM DATABASE
// ==========================================

async function loadSubjects() {

    try {

        const response =
            await fetch("/api/subjects");

        const data =
            await response.json();


        if (!data.success) {

            subjectsContainer.innerHTML =
                "<p>Unable to load subjects.</p>";

            return;
        }


        // Remove loading message

        subjectsContainer.innerHTML = "";


        // Create cards

        data.subjects.forEach(function(subject) {

            const card =
                document.createElement("div");

           card.className = "subject-card";

card.setAttribute(
    "data-search",
    `
    ${subject.subject_name || ""}
    ${subject.subject_code || ""}
    ${subject.description || ""}
    `.toLowerCase()
);


            card.innerHTML = `

                <h3>
                    📚 ${subject.subject_name}
                </h3>

                <p class="subject-code">
                    ${subject.subject_code}
                </p>

                <p>
                    ${subject.description}
                </p>

                <button
                    onclick="openSubject(${subject.id})"
                >
                    View Subject →
                </button>

            `;


            subjectsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);

        subjectsContainer.innerHTML =
            "<p>Unable to connect to server.</p>";

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


    // Temporary message

    alert(
        "Subject selected! Units will be added next."
    );

}


// ==========================================
// LOGOUT
// ==========================================

const logoutButton =
    document.getElementById("logoutButton");

logoutButton.addEventListener(
    "click",
    function() {

        localStorage.removeItem("user");

        localStorage.removeItem(
            "selectedSubject"
        );

        window.location.href = "/";

    }
);


// ==========================================
// START DASHBOARD
// ==========================================

loadSubjects();