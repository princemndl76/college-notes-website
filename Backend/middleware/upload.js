const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ==========================================
// MAKE SURE UPLOAD FOLDER EXISTS
// ==========================================

const uploadDir = path.join(__dirname, "..", "uploads", "notes");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// ==========================================
// STORAGE CONFIG
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        // Unique name: timestamp + original name (spaces removed)
        const safeName =
            Date.now() + "-" + file.originalname.replace(/\s+/g, "_");

        cb(null, safeName);

    }

});


// ==========================================
// FILE TYPE FILTER
// (allow PDFs and common image types)
// ==========================================

function fileFilter(req, file, cb) {

    const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and image files are allowed."));
    }

}


// ==========================================
// EXPORT CONFIGURED MULTER INSTANCE
// ==========================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 15 * 1024 * 1024 // 15 MB max
    }

});


module.exports = upload;
