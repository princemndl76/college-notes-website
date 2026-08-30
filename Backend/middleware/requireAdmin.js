const db = require("../config/db");

// ==================================================
// ADMIN GATE MIDDLEWARE
// Expects the frontend to send the logged-in user's
// email in a custom header: x-user-email
// Looks up that email's role in the users table.
// Blocks the request unless role = 'admin'.
// ==================================================

function requireAdmin(req, res, next) {

    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access only"
        });
    }

    next();
}

module.exports = requireAdmin;