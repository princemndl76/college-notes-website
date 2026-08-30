const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

// ======================================
// REGISTRATION FORM
// ======================================

const registerForm =
    document.getElementById("registerForm");


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
// REGISTER USER
// ======================================

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // Get values

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

        if (
            !full_name ||
            !email ||
            !passwordValue ||
            !confirmPasswordValue
        ) {

            alert(
                "Please fill all fields."
            );

            return;

        }


        if (
            passwordValue !==
            confirmPasswordValue
        ) {

            alert(
                "Passwords do not match!"
            );

            return;

        }


        if (passwordValue.length < 6) {

            alert(
                "Password must contain at least 6 characters."
            );

            return;

        }


        if (!terms) {

            alert(
                "Please agree to the Terms & Conditions."
            );

            return;

        }


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


            // ==================================
            // SUCCESS
            // ==================================

            if (data.success) {

                alert(
                    "Account created successfully!"
                );


                // Go to login page

                window.location.href =
                    "login.html";

            }

            else {

                alert(data.message);

            }

        }

        catch (error) {

            console.error(error);

            alert(
                "Unable to connect to the server."
            );

        }

    }
);