document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL =
        window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : "https://college-notes-website-f64v.onrender.com";

    const userData = localStorage.getItem("user");

    if (!userData) {
        window.location.href = "/";
        return;
    }

    function authHeaders() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        };
    }

    const container = document.getElementById("bookmarksContainer");
    const filterButtons = document.querySelectorAll(".filter-btn");

    let allBookmarks = [];
    let currentFilter = "all";
    let viewerCounter = 0;

    async function loadBookmarks() {

        try {

            const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
                headers: authHeaders()
            });
            const data = await res.json();

            if (!data.success) {
                container.innerHTML = "<p class='empty-msg'>Unable to load bookmarks.</p>";
                return;
            }

            allBookmarks = data.bookmarks || [];
            renderBookmarks();

        } catch (error) {
            console.error("Load Bookmarks Error:", error);
            container.innerHTML = "<p class='empty-msg'>Unable to connect to server.</p>";
        }

    }

    function typeLabel(type) {
        if (type === "subject") return "Subject Note";
        if (type === "unit") return "Unit Note";
        return "Topic Note";
    }

    function renderBookmarks() {

        const filtered = currentFilter === "all"
            ? allBookmarks
            : allBookmarks.filter(b => b.note_type === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <p class="empty-msg">
                    📭 No bookmarks ${currentFilter === "all" ? "yet" : "in this category"}.
                    <br><small>Bookmark notes from any subject page to see them here.</small>
                </p>
            `;
            return;
        }

        container.innerHTML = filtered.map(b => {

            viewerCounter++;
            const viewerId = `viewer-${viewerCounter}`;

            return `
                <div class="bookmark-card">
                    <span class="type-tag type-${b.note_type}">${typeLabel(b.note_type)}</span>
                    <h3>${b.title}</h3>
                    <div class="bookmark-actions">
                        ${b.file_url ? `<button class="open-btn" onclick="togglePdf('${viewerId}', '${b.file_url}')">📄 Open File</button>` : ""}
                        <button class="remove-btn" onclick="removeBookmark(${b.note_id}, '${b.note_type}', this)">✕ Remove</button>
                    </div>
                    <iframe id="${viewerId}" class="pdf-viewer"></iframe>
                </div>
            `;

        }).join("");

    }

    window.togglePdf = function (viewerId, fileUrl) {
        const frame = document.getElementById(viewerId);
        if (frame.style.display === "block") {
            frame.style.display = "none";
            frame.src = "";
        } else {
            frame.src = fileUrl;
            frame.style.display = "block";
        }
    };

    window.removeBookmark = async function (noteId, noteType, btnEl) {

        btnEl.disabled = true;

        try {

            const res = await fetch(
                `${API_BASE_URL}/api/bookmarks/${noteId}?type=${noteType}`,
                { method: "DELETE", headers: authHeaders() }
            );
            const data = await res.json();

            if (data.success) {
                allBookmarks = allBookmarks.filter(
                    b => !(b.note_id === noteId && b.note_type === noteType)
                );
                renderBookmarks();
            } else {
                alert(data.message || "Unable to remove bookmark.");
                btnEl.disabled = false;
            }

        } catch (error) {
            console.error("Remove Bookmark Error:", error);
            alert("Unable to connect to server.");
            btnEl.disabled = false;
        }

    };

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.getAttribute("data-filter");
            renderBookmarks();
        });
    });

    document.getElementById("backButton").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";
    });

    loadBookmarks();

});