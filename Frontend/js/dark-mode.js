/* =====================================================
   UNIVERSAL DARK MODE TOGGLE
   Drop this one file into every page (see instructions).
   No changes needed to existing CSS files.
===================================================== */

(function () {

    // ---------- INJECT STYLES ----------
    const style = document.createElement("style");
    style.textContent = `
        html.dark-mode {
            filter: invert(1) hue-rotate(180deg);
            background: #fff;
        }

        /* Re-invert images/videos/icons so they don't look like photo negatives */
        html.dark-mode img,
        html.dark-mode video,
        html.dark-mode iframe,
        html.dark-mode svg {
            filter: invert(1) hue-rotate(180deg);
        }

        #darkModeToggleBtn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: none;
            background: #1a1a1a;
            color: #fff;
            font-size: 22px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        html.dark-mode #darkModeToggleBtn {
            /* keep the button looking correct even though the page is inverted */
            filter: invert(1) hue-rotate(180deg);
        }

        #darkModeToggleBtn:hover {
            opacity: 0.85;
        }
    `;
    document.head.appendChild(style);


    // ---------- CREATE TOGGLE BUTTON ----------
    function createButton() {

        const btn = document.createElement("button");
        btn.id = "darkModeToggleBtn";
        btn.type = "button";
        btn.title = "Toggle dark mode";
        btn.textContent = isDarkMode() ? "☀️" : "🌙";

        btn.addEventListener("click", toggleDarkMode);

        document.body.appendChild(btn);

    }


    // ---------- STATE HELPERS ----------
    function isDarkMode() {
        return localStorage.getItem("darkMode") === "on";
    }

    function applyDarkMode(on) {

        if (on) {
            document.documentElement.classList.add("dark-mode");
        } else {
            document.documentElement.classList.remove("dark-mode");
        }

        const btn = document.getElementById("darkModeToggleBtn");
        if (btn) {
            btn.textContent = on ? "☀️" : "🌙";
        }

    }

    function toggleDarkMode() {

        const nowOn = !isDarkMode();

        localStorage.setItem("darkMode", nowOn ? "on" : "off");

        applyDarkMode(nowOn);

    }


    // ---------- INIT ----------
    // Apply saved preference immediately (before button exists) to avoid a flash
    applyDarkMode(isDarkMode());

    document.addEventListener("DOMContentLoaded", createButton);

})();