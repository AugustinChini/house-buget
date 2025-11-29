const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const categoryRoutes = require("./routes/categories");
const expenseRoutes = require("./routes/expenses");
const notesRoutes = require("./routes/notes");

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "10mb";
const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(
  express.json({
    limit: JSON_BODY_LIMIT,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: JSON_BODY_LIMIT,
  })
);
app.use("/uploads", express.static(uploadsPath));

// Routes
app.use("/categories", categoryRoutes);
app.use("/expenses", expenseRoutes);
app.use("/notes", notesRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
