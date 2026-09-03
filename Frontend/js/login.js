
const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";
 
console.log("LOGIN JS LOADED");
 
const loginForm = document.getElementById("loginForm");
const otpForm = document.getElementById("otpForm");
 
const loginStep = document.getElementById("loginStep");
const otpStep = document.getElementById("otpStep");
 
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const emailInput = document.getElementById("email");
const rememberMeCheckbox = document.getElementById("rememberMe");
const submitBtn = document.getElementById("submitBtn");
const statusMsg = document.getElementById("statusMsg");
 
const otpInput = document.getElementById("otpInput");
const otpSubmitBtn = document.getElementById("otpSubmitBtn");
const otpStatusMsg = document.getElementById("otpStatusMsg");
const otpSubtitle = document.getElementById("otpSubtitle");
const backToLoginLink = document.getElementById("backToLoginLink");
 
// Rocket launch overlay elements
const launchOverlay = document.getElementById("launchOverlay");
const rocket = document.getElementById("rocket");
const launchCaption = document.getElementById("launchCaption");
 
// Remembers what to send with the OTP verification request
let pendingLoginEmail = null;
let pendingRememberMe = false;
 
 
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
// SWITCH TO OTP STEP
// ======================================
 
function showOtpStep(email) {
 
    pendingLoginEmail = email;
 
    otpSubtitle.textContent =
        `We've emailed a 6-digit code to ${email}. Enter it below to finish logging in.`;
 
    loginStep.style.display = "none";
    otpStep.style.display = "block";
 
    otpInput.value = "";
    otpStatusMsg.textContent = "";
    otpInput.focus();
 
}
 
 
function showLoginStep() {
 
    otpStep.style.display = "none";
    loginStep.style.display = "block";
 
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
 
}
 
 
backToLoginLink.addEventListener("click", function (event) {
    event.preventDefault();
    showLoginStep();
});
 
 
// ======================================
// STEP 1 — LOGIN (email + password)
// ======================================
 
loginForm.addEventListener("submit", async function (event) {
 
    event.preventDefault();
 
 
    const email = document
        .getElementById("email")
        .value
        .trim();
 
    const password = document
        .getElementById("password")
        .value;
 
 
    if (!email || !password) {
 
        statusMsg.textContent = "Please enter email and password.";
 
        return;
 
    }
 
    statusMsg.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";
 
 
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
 
 
        if (data.success && data.requiresOtp) {
 
            // Password was correct — now ask for the emailed OTP
            pendingRememberMe = rememberMeCheckbox.checked;
            showOtpStep(data.email || email);
 
        }
 
        else if (data.success) {
 
            // Fallback in case OTP is ever disabled server-side —
            // behaves like the old direct-login flow.
            finishLogin(data, rememberMeCheckbox.checked, email);
 
        }
 
        else {
 
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
            statusMsg.textContent = data.message || "Incorrect email or password.";
 
        }
 
    }
 
    catch (error) {
 
        console.error("Login Error:", error);
 
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
 
        statusMsg.textContent =
            "Unable to connect to the server. " +
            "Please make sure Node.js server is running.";
 
    }
 
});
 
 
// ======================================
// STEP 2 — VERIFY LOGIN OTP
// ======================================
 
otpForm.addEventListener("submit", async function (event) {
 
    event.preventDefault();
 
    const otp = otpInput.value.trim();
 
    if (!otp) {
        otpStatusMsg.textContent = "Please enter the code.";
        return;
    }
 
    otpStatusMsg.textContent = "";
    otpSubmitBtn.disabled = true;
    otpSubmitBtn.textContent = "Verifying…";
 
    try {
 
        const response = await fetch(
            `${API_BASE_URL}/api/login/verify-otp`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: pendingLoginEmail,
                    otp: otp
                })
            }
        );
 
        const data = await response.json();
 
        if (data.success) {
 
            finishLogin(data, pendingRememberMe, pendingLoginEmail);
 
        } else {
 
            otpSubmitBtn.disabled = false;
            otpSubmitBtn.textContent = "Verify & Login";
            otpStatusMsg.textContent = data.message || "Incorrect or expired code.";
 
        }
 
    } catch (error) {
 
        console.error("OTP Verify Error:", error);
 
        otpSubmitBtn.disabled = false;
        otpSubmitBtn.textContent = "Verify & Login";
        otpStatusMsg.textContent = "Unable to connect to the server. Please try again.";
 
    }
 
});
 
 
// ======================================
// FINISH LOGIN (shared by both paths)
// ======================================
 
function finishLogin(data, rememberMe, email) {
 
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
 
    if (rememberMe) {
 
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
 
    const firstName = (data.user && (data.user.full_name || data.user.name || data.user.username)) || "";
    playLaunchScene(firstName);
 
}
 
