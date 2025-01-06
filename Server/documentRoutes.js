const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { createHash } = require("node:crypto");
const Document = require("./models/document");
const Query = require("./models/query");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Calculate file hash using Node.js crypto
const calculateHash = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

// Routes
router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const hash = await calculateHash(req.file.path);

    // Check for duplicate document
    const existingDoc = await Document.findByHash(hash);
    if (existingDoc) {
      // Remove the uploaded file since it's a duplicate
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error removing duplicate file:", err);
      });

      return res.status(409).json({
        error: "Document already exists",
        documentId: existingDoc.id,
      });
    }

    const documentData = {
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      hash: hash,
      metadata: req.body.metadata || {},
    };

    const documentId = await Document.create(documentData);
    res.status(201).json({
      message: "Document uploaded successfully",
      documentId: documentId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error removing file after failed upload:", err);
      });
    }
    res.status(500).json({ error: "Failed to upload document" });
  }
});

router.get("/documents", async (req, res) => {
  try {
    const documents = await Document.getAllDocuments();
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.post("/query/log", async (req, res) => {
  try {
    const { documentId, queryText, relevanceScore } = req.body;
    const queryId = await Query.create(documentId, queryText, relevanceScore);
    res.status(201).json({ queryId });
  } catch (error) {
    console.error("Error logging query:", error);
    res.status(500).json({ error: "Failed to log query" });
  }
});

router.get("/document/:id/queries", async (req, res) => {
  try {
    const queries = await Query.getQueriesForDocument(req.params.id);
    res.json(queries);
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({ error: "Failed to fetch queries" });
  }
});

module.exports = router;
