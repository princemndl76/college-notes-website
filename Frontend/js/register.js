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
// OTP FORM (keypad-driven box entry)
// ======================================

const otpForm =
    document.getElementById("otpForm");

const otpBoxes =
    Array.from(document.querySelectorAll(".otp-box"));

const keypadButtons =
    Array.from(document.querySelectorAll(".keypad-btn[data-digit]"));

const keypadClearBtn =
    document.getElementById("keypadClear");

const keypadBackBtn =
    document.getElementById("keypadBack");

const otpSubmitBtn =
    document.getElementById("otpSubmitBtn");

const otpStatusMsg =
    document.getElementById("otpStatusMsg");

const otpSubtitle =
    document.getElementById("otpSubtitle");

const otpTimerCount =
    document.getElementById("otpTimerCount");

const resendOtpBtn =
    document.getElementById("resendOtpBtn");

const backToRegisterLink =
    document.getElementById("backToRegisterLink");

let pendingEmail = null;
let otpCountdownInterval = null;


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
// OTP BOXES — read / clear / error flash
// ======================================

function getOtpValue() {
    return otpBoxes.map(box => box.value).join("");
}

function clearOtpBoxes() {
    otpBoxes.forEach(box => {
        box.value = "";
        box.classList.remove("filled", "error");
    });
}

function flashOtpError() {
    otpBoxes.forEach(box => box.classList.add("error"));
    setTimeout(() => {
        otpBoxes.forEach(box => box.classList.remove("error"));
    }, 400);
}

function firstEmptyIndex() {
    return otpBoxes.findIndex(box => !box.value);
}

function lastFilledIndex() {
    for (let i = otpBoxes.length - 1; i >= 0; i--) {
        if (otpBoxes[i].value) return i;
    }
    return -1;
}


// ======================================
// KEYPAD — type a digit into next empty box
// ======================================

function typeDigit(digit) {

    const index = firstEmptyIndex();

    if (index === -1) return; // all boxes already full

    otpBoxes[index].value = digit;
    otpBoxes[index].classList.add("filled");

    otpStatusMsg.textContent = "";

    if (getOtpValue().length === 6) {
        otpForm.requestSubmit();
    }

}

function backspaceDigit() {

    const index = lastFilledIndex();

    if (index === -1) return;

    otpBoxes[index].value = "";
    otpBoxes[index].classList.remove("filled");

}


keypadButtons.forEach(button => {

    button.addEventListener("click", function () {
        typeDigit(button.dataset.digit);
    });

});

keypadClearBtn.addEventListener("click", function () {
    clearOtpBoxes();
});

keypadBackBtn.addEventListener("click", function () {
    backspaceDigit();
});


// ======================================
// PHYSICAL KEYBOARD SUPPORT (bonus — works
// alongside the on-screen keypad while the
// OTP step is visible)
// ======================================

document.addEventListener("keydown", function (event) {

    if (otpStep.style.display === "none") return;

    if (event.key >= "0" && event.key <= "9") {
        typeDigit(event.key);
    }

    if (event.key === "Backspace") {
        backspaceDigit();
    }

});


// ======================================
// COUNTDOWN TIMER (10 minutes, matches backend expiry)
// ======================================

function startOtpCountdown() {

    clearInterval(otpCountdownInterval);

    let secondsLeft = 10 * 60;

    function render() {
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        otpTimerCount.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }

    render();

    resendOtpBtn.disabled = true;

    otpCountdownInterval = setInterval(function () {

        secondsLeft--;

        if (secondsLeft <= 0) {
            clearInterval(otpCountdownInterval);
            otpTimerCount.textContent = "00:00";
            resendOtpBtn.disabled = false;
            return;
        }

        render();

    }, 1000);

}


// ======================================
// SWITCH TO OTP STEP
// ======================================

function showOtpStep(email) {

    pendingEmail = email;

    otpSubtitle.textContent =
        `[ACCESS CODE TRANSMITTED TO ${email}] Enter the 6-digit key to authenticate.`;

    registerStep.style.display = "none";
    otpStep.style.display = "block";

    clearOtpBoxes();
    otpStatusMsg.textContent = "";
    startOtpCountdown();

}


backToRegisterLink.addEventListener("click", function (event) {

    event.preventDefault();

    clearInterval(otpCountdownInterval);

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
// RESEND — requests a fresh signup OTP
// ======================================

resendOtpBtn.addEventListener("click", async function () {

    resendOtpBtn.disabled = true;
    otpStatusMsg.style.color = "";
    otpStatusMsg.textContent = "> requesting new key...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/resend-signup-otp`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: pendingEmail })
            }
        );

        const data = await response.json();

        if (data.success) {
            otpStatusMsg.style.color = "#39ff88";
            otpStatusMsg.textContent = "> new key transmitted.";
            clearOtpBoxes();
            startOtpCountdown();
        } else {
            otpStatusMsg.style.color = "";
            otpStatusMsg.textContent = data.message || "> resend failed.";
            resendOtpBtn.disabled = false;
        }

    } catch (error) {
        console.error(error);
        otpStatusMsg.textContent = "> connection error.";
        resendOtpBtn.disabled = false;
    }

});


// ======================================
// STEP 2 — VERIFY SIGNUP OTP
// ======================================

otpForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const otp = getOtpValue();

    if (otp.length !== 6) {
        otpStatusMsg.textContent = "> enter all 6 digits.";
        return;
    }

    otpStatusMsg.textContent = "";
    otpSubmitBtn.disabled = true;
    otpSubmitBtn.textContent = "> VERIFYING...";

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

            clearInterval(otpCountdownInterval);

            otpStatusMsg.style.color = "#39ff88";
            otpStatusMsg.textContent = "> ACCESS GRANTED. Redirecting…";

            setTimeout(function () {
                window.location.href = "login.html?verified=true";
            }, 1200);

        } else {

            otpSubmitBtn.disabled = false;
            otpSubmitBtn.textContent = "> EXECUTE_VERIFY";
            otpStatusMsg.textContent = "> " + (data.message || "ACCESS DENIED. Incorrect or expired key.");
            flashOtpError();
            clearOtpBoxes();

        }

    } catch (error) {

        console.error("OTP Verify Error:", error);

        otpSubmitBtn.disabled = false;
        otpSubmitBtn.textContent = "> EXECUTE_VERIFY";
        otpStatusMsg.textContent = "> connection error. try again.";

    }

});