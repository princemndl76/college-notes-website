const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

// ======================================
// STEPS
// ======================================

const registerStep = document.getElementById("registerStep");
const otpStep = document.getElementById("otpStep");


// ======================================
// REGISTRATION FORM
// ======================================

const registerForm =
    document.getElementById("registerForm");

const registerSubmitBtn =
    document.getElementById("registerSubmitBtn");

const registerStatusMsg =
    document.getElementById("registerStatusMsg");


// ======================================
// OTP FORM
// ======================================

const otpForm =
    document.getElementById("otpForm");

const otpInput =
    document.getElementById("otpInput");

const otpSubmitBtn =
    document.getElementById("otpSubmitBtn");

const otpStatusMsg =
    document.getElementById("otpStatusMsg");

const otpSubtitle =
    document.getElementById("otpSubtitle");

const backToRegisterLink =
    document.getElementById("backToRegisterLink");

let pendingEmail = null;


// ======================================
// PASSWORD ELEMENTS
// ======================================

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");


// ======================================
// PASSWORD TOGGLE
// ======================================

const togglePassword =
    document.getElementById("togglePassword");

const toggleConfirmPassword =
    document.getElementById(
        "toggleConfirmPassword"
    );


togglePassword.addEventListener(
    "click",
    function () {

        if (password.type === "password") {

            password.type = "text";

            togglePassword.textContent = "🙈";

        }

        else {

            password.type = "password";

            togglePassword.textContent = "👁";

        }

    }
);


toggleConfirmPassword.addEventListener(
    "click",
    function () {

        if (
            confirmPassword.type ===
            "password"
        ) {

            confirmPassword.type = "text";

            toggleConfirmPassword.textContent =
                "🙈";

        }

        else {

            confirmPassword.type =
                "password";

            toggleConfirmPassword.textContent =
                "👁";

        }

    }
);


// ======================================
// SWITCH TO OTP STEP
// ======================================

function showOtpStep(email) {

    pendingEmail = email;

    otpSubtitle.textContent =
        `We've emailed a 6-digit code to ${email}. Enter it below to activate your account.`;

    registerStep.style.display = "none";
    otpStep.style.display = "block";

    otpInput.value = "";
    otpStatusMsg.textContent = "";
    otpInput.focus();

}


backToRegisterLink.addEventListener("click", function (event) {

    event.preventDefault();

    otpStep.style.display = "none";
    registerStep.style.display = "block";

    registerSubmitBtn.disabled = false;
    registerSubmitBtn.textContent = "Create Account";

});


// ======================================
// STEP 1 — REGISTER USER
// ======================================

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const full_name =
            document.getElementById(
                "name"
            ).value.trim();


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const passwordValue =
            password.value;


        const confirmPasswordValue =
            confirmPassword.value;


        const terms =
            document.getElementById(
                "terms"
            ).checked;


        // ==================================
        // VALIDATION
        // ==================================

        registerStatusMsg.textContent = "";

        if (
            !full_name ||
            !email ||
            !passwordValue ||
            !confirmPasswordValue
        ) {

            registerStatusMsg.textContent =
                "Please fill all fields.";

            return;

        }


        if (
            passwordValue !==
            confirmPasswordValue
        ) {

            registerStatusMsg.textContent =
                "Passwords do not match!";

            return;

        }


        if (passwordValue.length < 6) {

            registerStatusMsg.textContent =
                "Password must contain at least 6 characters.";

            return;

        }


        if (!terms) {

            registerStatusMsg.textContent =
                "Please agree to the Terms & Conditions.";

            return;

        }


        registerSubmitBtn.disabled = true;
        registerSubmitBtn.textContent = "Creating account…";


        // ==================================
        // SEND DATA TO BACKEND
        // ==================================

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/register`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            full_name:
                                full_name,

                            email:
                                email,

                            password:
                                passwordValue

                        })

                    }
                );


            const data =
                await response.json();


            if (data.success) {

                // Move to the "enter your code" step
                showOtpStep(data.email || email);

            }

            else {

                registerSubmitBtn.disabled = false;
                registerSubmitBtn.textContent = "Create Account";
                registerStatusMsg.textContent = data.message;

            }

        }

        catch (error) {

            console.error(error);

            registerSubmitBtn.disabled = false;
            registerSubmitBtn.textContent = "Create Account";
            registerStatusMsg.textContent =
                "Unable to connect to the server.";

        }

    }
);


// ======================================
// STEP 2 — VERIFY SIGNUP OTP
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
            `${API_BASE_URL}/api/verify-signup-otp`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: pendingEmail,
                    otp: otp
                })
            }
        );

        const data = await response.json();

        if (data.success) {

            otpStatusMsg.style.color = "#16803c";
            otpStatusMsg.textContent = "Account verified! Redirecting to login…";

            setTimeout(function () {
                window.location.href = "login.html?verified=true";
            }, 1200);

        } else {

            otpSubmitBtn.disabled = false;
            otpSubmitBtn.textContent = "Verify Account";
            otpStatusMsg.textContent = data.message || "Incorrect or expired code.";

        }

    } catch (error) {

        console.error("OTP Verify Error:", error);

        otpSubmitBtn.disabled = false;
        otpSubmitBtn.textContent = "Verify Account";
        otpStatusMsg.textContent = "Unable to connect to the server. Please try again.";

    }

});