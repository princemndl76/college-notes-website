const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;


// ==========================================
// CLOUDINARY CONFIG
// ==========================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// ==========================================
// STORAGE CONFIG
// (files go to Cloudinary instead of local disk)
// ==========================================

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "notes",
        resource_type: "auto", // handles PDFs and images correctly
        public_id: (req, file) => {
            const safeName =
                file.originalname
                    .replace(/\.[^/.]+$/, "") // strip extension
                    .replace(/\s+/g, "_");     // remove spaces

            return Date.now() + "-" + safeName;
        }
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