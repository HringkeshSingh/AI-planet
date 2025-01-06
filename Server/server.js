const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8000"], // Allow both React and FastAPI
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for documents and queries (replace with database in production)
let documents = [];
let queries = [];

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Initialize multer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

// Routes

// Get all documents
app.get("/api/documents", (req, res) => {
  try {
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Upload document
app.post("/api/upload", upload.single("document"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const document = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date(),
      path: req.file.path,
    };

    documents.push(document);

    res.status(200).json({
      message: "File uploaded successfully",
      documentId: document.id,
      filename: document.filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Log query
app.post("/api/query/log", async (req, res) => {
  try {
    const { documentId, queryText, relevanceScore } = req.body;

    if (!documentId || !queryText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = {
      id: Date.now().toString(),
      documentId,
      queryText,
      relevanceScore: relevanceScore || 0,
      timestamp: new Date(),
    };

    queries.push(query);

    res.status(200).json({
      message: "Query logged successfully",
      queryId: query.id,
    });
  } catch (error) {
    console.error("Query logging error:", error);
    res.status(500).json({ error: "Failed to log query" });
  }
});

// Get queries for a document
app.get("/api/queries/:documentId", (req, res) => {
  try {
    const documentQueries = queries.filter(
      (q) => q.documentId === req.params.documentId
    );
    res.json(documentQueries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch queries" });
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${uploadsDir}`);
});
