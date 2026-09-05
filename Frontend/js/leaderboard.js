document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL =
        window.location.hostname === "localhost"
            ? "http://localhost:5000"
            : "https://college-notes-website-f64v.onrender.com";

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!userData || !token) {
        alert("Please login to view the leaderboard.");
        window.location.href = "/";
        return;
    }

    const container = document.getElementById("leaderboardContainer");

    async function loadLeaderboard() {

        try {

            const res = await fetch(`${API_BASE_URL}/api/subjects/leaderboard`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (!data.success) {
                container.innerHTML = `<p class="empty-msg">Unable to load leaderboard.</p>`;
                return;
            }

            renderLeaderboard(data.leaderboard || []);

        } catch (error) {
            console.error("Load Leaderboard Error:", error);
            container.innerHTML = `<p class="empty-msg">Unable to connect to server.</p>`;
        }

    }

    function rankClass(index) {
        if (index === 0) return "gold";
        if (index === 1) return "silver";
        if (index === 2) return "bronze";
        return "";
    }

    function rankLabel(index) {
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return `#${index + 1}`;
    }

    function renderLeaderboard(leaderboard) {

        if (!leaderboard || leaderboard.length === 0) {

            container.innerHTML = `
                <div class="empty-msg">
                    📭 No contributors yet.
                    <br>
                    <small>Upload notes to be the first on the leaderboard!</small>
                </div>
            `;

            return;
        }

        container.innerHTML = `
            <div class="leaderboard-card">
                ${leaderboard.map((user, index) => `
                    <div class="leaderboard-row">

                        <div class="rank ${rankClass(index)}">
                            ${rankLabel(index)}
                        </div>

                        <div class="contributor-info">

                            <div class="contributor-name">
                                ${escapeHTML(user.full_name || "Unknown")}
                            </div>

                            <div class="contributor-stats">
                                <span class="stat-badge">📤 ${user.upload_count} uploads</span>
                                <span class="stat-badge">👁️ ${user.total_views} views</span>
                                <span class="stat-badge">⬇️ ${user.total_downloads} downloads</span>
                            </div>

                        </div>

                    </div>
                `).join("")}
            </div>
        `;

    }

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value;
        return div.innerHTML;
    }

    loadLeaderboard();

});