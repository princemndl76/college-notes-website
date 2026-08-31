const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for PYQ papers
const pyqStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "college-notes/pyq",
        resource_type: "raw", // needed for PDFs (non-image files)
        allowed_formats: ["pdf"],
        public_id: (req, file) => {
            const cleanName = file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
            return `${Date.now()}_${cleanName}`;
        },
    },
});

// Storage for regular notes (same idea, separate folder)
const notesStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "college-notes/notes",
        resource_type: "raw",
        allowed_formats: ["pdf"],
        public_id: (req, file) => {
            const cleanName = file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
            return `${Date.now()}_${cleanName}`;
        },
    },
});

module.exports = { cloudinary, pyqStorage, notesStorage };