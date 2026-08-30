const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

console.log("LOGIN JS LOADED");

const loginForm = document.getElementById("loginForm");

console.log("LOGIN FORM:", loginForm);

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const emailInput = document.getElementById("email");
const rememberMeCheckbox = document.getElementById("rememberMe");
const submitBtn = document.getElementById("submitBtn");
const statusMsg = document.getElementById("statusMsg");

// Rocket launch overlay elements
const launchOverlay = document.getElementById("launchOverlay");
const rocket = document.getElementById("rocket");
const launchCaption = document.getElementById("launchCaption");


// ======================================
// PRE-FILL REMEMBERED EMAIL ON PAGE LOAD
// ======================================

const rememberedEmail = localStorage.getItem("rememberedEmail");

if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberMeCheckbox.checked = true;
}


// ======================================
// SHOW / HIDE PASSWORD
// ======================================

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.textContent = "🙈";

    } else {

        passwordInput.type = "password";

        togglePassword.textContent = "👁";

    }

});


// ======================================
// ROCKET LAUNCH WELCOME SCENE
// ======================================

function playLaunchScene(name) {

    launchOverlay.classList.add("show");
    launchCaption.textContent = name
        ? `Hello, ${name}! Launching your dashboard…`
        : "Launching your dashboard…";

    // trigger the rocket flight on next frame
    requestAnimationFrame(function () {
        rocket.classList.add("launch");
    });

    // redirect after the flight + fade finishes
    setTimeout(function () {
        window.location.href = "/Frontend/pages/dashboard.html";
    }, 2200);

}


// ======================================
// LOGIN
// ======================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    // Get form values

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;


    // ==================================
    // VALIDATION
    // ==================================

    if (!email || !password) {

        statusMsg.textContent = "Please enter email and password.";

        return;

    }

    statusMsg.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";


    // ==================================
    // SEND LOGIN REQUEST
    // ==================================

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/login`,
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    email: email,

                    password: password

                })

            }
        );


        const data = await response.json();


        console.log("Login Response:", data);


        // ==================================
        // LOGIN SUCCESS
        // ==================================

  if (data.success) {

    // Save logged-in user
    localStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );

    // Save the auth token so future requests can prove who's logged in
    localStorage.setItem("token", data.token);

    // Remember (or forget) the email
    // Note: we only ever store the email,
    // never the password, for security.

    if (rememberMeCheckbox.checked) {
                localStorage.setItem(
                    "rememberedEmail",
                    email
                );

            } else {

                localStorage.removeItem(
                    "rememberedEmail"
                );

            }


            // Play the rocket launch scene,
            // then it redirects to the dashboard itself.

            const firstName = (data.user && (data.user.name || data.user.username)) || "";
            playLaunchScene(firstName);

        }

        else {

            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
            statusMsg.textContent = data.message || "Incorrect email or password.";

        }

    }


    // ==================================
    // SERVER CONNECTION ERROR
    // ==================================

    catch (error) {

        console.error("Login Error:", error);

        submitBtn.disabled = false;
        submitBtn.textContent = "Login";

        statusMsg.textContent =
            "Unable to connect to the server. " +
            "Please make sure Node.js server is running.";

    }

});