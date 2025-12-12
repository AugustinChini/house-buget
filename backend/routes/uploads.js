const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const router = express.Router();

// Configuration
const UPLOAD_MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || "104857600", 10); // 100 MB default
const uploadsRoot = path.join(__dirname, "..", "uploads");
const tempRoot = path.join(uploadsRoot, "temp");

// Ensure temp directory exists
if (!fs.existsSync(tempRoot)) {
  fs.mkdirSync(tempRoot, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempRoot);
  },
  filename: (req, file, cb) => {
    const id = randomUUID();
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, "");
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_MAX_SIZE,
  },
});

// Build URL from relative path
const buildUrlFromRelativePath = (relativePath) =>
  `/uploads/${relativePath.replace(/\\/g, "/")}`;

// POST /uploads - Upload a single file
router.post("/", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { filename, originalname, mimetype, size } = req.file;
    const id = path.basename(filename, path.extname(filename));
    const relativePath = path.join("temp", filename);

    const attachment = {
      id,
      name: originalname,
      type: mimetype,
      size,
      url: buildUrlFromRelativePath(relativePath),
      storagePath: relativePath,
      isTemp: true,
    };

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `File too large. Maximum size is ${Math.round(UPLOAD_MAX_SIZE / 1024 / 1024)} MB`,
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;

