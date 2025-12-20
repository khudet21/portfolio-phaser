const db = require("../config/db");

// GET all projects
exports.getAll = async (req, res) => {
  console.log("📥 GET /api/projects dipanggil");
  try {
    const [rows] = await db.query("SELECT * FROM projects");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error DB:", err);
    res.status(500).json({ message: "Database error" });
  }
};

// GET project by ID
exports.getById = async (req, res) => {
  console.log("📥 GET /api/projects/:id dipanggil, ID:", req.params.id);
  try {
    const [results] = await db.query("SELECT * FROM projects WHERE id = ?", [
      req.params.id,
    ]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET project image by ID
exports.getImage = async (req, res) => {
  console.log("🖼️ GET /api/project-image/:id dipanggil, ID:", req.params.id);
  try {
    const [results] = await db.query(
      "SELECT image FROM projects WHERE id = ?",
      [req.params.id]
    );
    
    if (results.length === 0 || !results[0].image) {
      return res.status(404).send("Image not found");
    }

    res.setHeader("Content-Type", "image/png");
    res.send(results[0].image);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).send(err);
  }
};

// GET all slugs
exports.getAllSlugs = async (req, res) => {
  console.log("📥 GET /slugs dipanggil");
  try {
    const [rows] = await db.query("SELECT slug FROM projects");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST create project with image upload
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      features,
      technologies,
      slug,
      release_date,
      development_time,
      platforms,
      source_code,
      trailer_url,
      team,
      logic_js,
      genre,
    } = req.body;

    if (!title || !slug) {
      return res.status(400).json({
        success: false,
        message: "Title dan slug wajib diisi",
      });
    }

    // ✅ PATH RELATIF KE /public
    const image_path = req.file
      ? `/upload/projects/${req.file.filename}`
      : null;

    const query = `
      INSERT INTO projects
      (title, subtitle, image_path, description, features, technologies, slug,
       release_date, development_time, platforms, source_code, trailer_url,
       team, logic_js, genre)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      title,
      subtitle,
      image_path,
      description,
      features,
      technologies,
      slug,
      release_date || null,
      development_time,
      platforms,
      source_code,
      trailer_url,
      team,
      logic_js,
      genre,
    ];

    const [result] = await db.query(query, values);

    res.json({
      success: true,
      message: "Project berhasil ditambahkan",
      projectId: result.insertId,
    });

  } catch (error) {
    console.error("❌ Gagal simpan project:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT update project
const fs = require("fs");
const path = require("path");

exports.update = async (req, res) => {
  console.log("✏️ Updating project ID:", req.params.id);

  try {
    const {
      title,
      subtitle,
      description,
      features,
      technologies,
      slug,
      release_date,
      development_time,
      platforms,
      source_code,
      trailer_url,
      team,
      logic_js,
      genre,
    } = req.body;

    // Ambil data lama (untuk hapus image lama jika perlu)
    const [rows] = await db.query(
      "SELECT image_path FROM projects WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project tidak ditemukan",
      });
    }

    const oldImagePath = rows[0].image_path;

    // Jika upload image baru
    let image_path = oldImagePath;

    if (req.file) {
      image_path = `/upload/projects/${req.file.filename}`;

      // Hapus file lama (jika ada)
      if (oldImagePath) {
        const oldFile = path.join(
          __dirname,
          "../public",
          oldImagePath
        );

        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      }
    }

    const query = `
      UPDATE projects SET
        title = ?, subtitle = ?, image_path = ?, description = ?, features = ?, technologies = ?,
        slug = ?, release_date = ?, development_time = ?, platforms = ?, source_code = ?,
        trailer_url = ?, team = ?, logic_js = ?, genre = ?
      WHERE id = ?
    `;

    const values = [
      title,
      subtitle,
      image_path,
      description,
      features,
      technologies,
      slug,
      release_date || null,
      development_time,
      platforms,
      source_code,
      trailer_url,
      team,
      logic_js,
      genre,
      req.params.id,
    ];

    await db.query(query, values);

    res.json({
      success: true,
      message: "Project berhasil diperbarui",
    });

  } catch (error) {
    console.error("❌ Gagal update project:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE project and related assets
exports.delete = async (req, res) => {
  console.log("🗑️ Deleting project ID:", req.params.id);
  const { id } = req.params;

  try {
    // 1️⃣ Ambil slug dari project yang akan dihapus
    const [projects] = await db.query(
      "SELECT slug FROM projects WHERE id = ?",
      [id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }
    
    const slug = projects[0].slug;

    // 2️⃣ Hapus project
    await db.query("DELETE FROM projects WHERE id = ?", [id]);

    // 3️⃣ Hapus semua asset dari tabel images yang memiliki slug yang sama
    await db.query("DELETE FROM images WHERE slug = ?", [slug]);

    // 4️⃣ Sukses
    res.status(200).json({
      success: true,
      message: `Project dan asset dengan slug '${slug}' dihapus`,
    });
  } catch (error) {
    console.error("❌ Error deleting project & assets:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      detail: error.message 
    });
  }
};