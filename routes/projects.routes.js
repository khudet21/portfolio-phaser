const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const projectController = require("../controllers/projects.controller");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/upload/projects"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, name + ext);
  },
});

const upload = multer({ storage });

console.log("📦 projects.routes.js loaded");
router.use((req, res, next) => {
  console.log("🔥 Projects router hit:", req.method, req.originalUrl);
  next();
});

// Routes untuk projects
console.log("📝 Registering route: GET /");
router.get("/", projectController.getAll); // ✅ Sesuai dengan controller

console.log("📝 Registering route: GET /image/:id");
router.get("/image/:id", projectController.getImage); // ✅ Sesuai dengan controller

console.log("📝 Registering route: GET /slugs");
router.get("/slugs", projectController.getAllSlugs); // ✅ Sesuai dengan controller

console.log("📝 Registering route: GET /:id");
router.get("/:id", projectController.getById); // ✅ Sesuai dengan controller

console.log("📝 Registering route: POST /");
router.post("/", upload.single("image"), projectController.createProject); // ✅ Sesuai dengan controller

console.log("📝 Registering route: PUT /:id");
router.put("/:id", upload.single("image"), projectController.update); // ✅ Sesuai dengan controller

console.log("📝 Registering route: DELETE /:id");
router.delete("/:id", projectController.delete); // ✅ Sesuai dengan controller

console.log("✅ All project routes registered");

module.exports = router;