console.log("🔥 SERVER FILE AKTIF:", __filename);

require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

/* ===== Middlewares Global ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== Static Files ===== */
app.use(express.static(path.join(__dirname, "public")));

/* ===== Database Init ===== */
try {
  require("./config/db");
  console.log("✅ Database connected");
} catch (err) {
  console.error("❌ Database connection error:", err.message);
  process.exit(1);
}

/* ===== Debug Middleware (Optional - untuk development) ===== */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.url}`);
    next();
  });
}

/* ===== Load Routes ===== */
let projectRoutes, userRoutes;

try {
  projectRoutes = require("./routes/projects.routes");
  console.log("✅ Project routes loaded");
} catch (err) {
  console.error("❌ Error loading projects.routes:", err.message);
  process.exit(1);
}

try {
  userRoutes = require("./routes/users.routes");
  console.log("✅ User routes loaded");
} catch (err) {
  console.error("❌ Error loading users.routes:", err.message);
  process.exit(1);
}

/* ===== Register API Routes ===== */
// API routes should be registered FIRST (more specific)
app.use("/api/projects", projectRoutes);
console.log("✅ /api/projects registered");

app.use("/api/users", userRoutes);
console.log("✅ /api/users registered");

/* ===== Register Legacy/Old Routes (if needed) ===== */
// Keep old routes for backward compatibility
// Remove these if you're only using /api/* routes
app.use("/users", userRoutes);
console.log("✅ /users registered (legacy)");

// If you have a /slugs route, it should point to projects
app.get("/slugs", (req, res, next) => {
  // Redirect to new API endpoint
  req.url = "/api/projects/slugs";
  projectRoutes(req, res, next);
});
console.log("✅ /slugs registered (redirect to /api/projects/slugs)");

/* ===== Serve Dashboard Page ===== */
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
console.log("✅ /dashboard page registered");

/* ===== Root Route ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/uploads", express.static("uploads"));

/* ===== 404 Handler ===== */
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    requestedUrl: req.url,
    method: req.method,
    availableRoutes: [
      "GET /api/projects",
      "GET /api/projects/:id",
      "GET /api/projects/image/:id",
      "GET /api/projects/slugs",
      "POST /api/projects",
      "PUT /api/projects/:id",
      "DELETE /api/projects/:id",
      "GET /api/users",
      "POST /api/users",
      "PUT /api/users/:id",
      "DELETE /api/users/:id"
    ]
  });
});

/* ===== Error Handler ===== */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/* ===== Start Server ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log("📁 Available Routes:");
  console.log("   API Routes:");
  console.log("   - /api/projects (GET, POST)");
  console.log("   - /api/projects/:id (GET, PUT, DELETE)");
  console.log("   - /api/projects/image/:id (GET)");
  console.log("   - /api/projects/slugs (GET)");
  console.log("   - /api/users (GET, POST)");
  console.log("   - /api/users/:id (GET, PUT, DELETE)");
  console.log("\n   Pages:");
  console.log("   - / (Home)");
  console.log("   - /dashboard (Dashboard)");
  console.log("=".repeat(60) + "\n");
});