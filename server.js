const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

// ✅ Aktifkan CORS lebih awal
app.use(
  cors({
    origin: "http://localhost:3000", // Atau port tempat game.html dijalankan
  })
);

app.use(bodyParser.json());

// Koneksi ke MySQL (pakai Promise)
const db = mysql
  .createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "portfolio",
  })
  .promise();

// === ROUTES ===

// Izinkan semua resource dari semua sumber (jangan untuk production)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );

  next();
});

app.get("/api/users", async (req, res) => {
  console.log("📥 GET /api/users dipanggil");
  try {
    const [results] = await db.query("SELECT * FROM users");
    res.json(results);
  } catch (err) {
    console.error("❌ Error DB:", err);
    res.status(500).json({ error: err });
  }
});

// GET all users
app.get("/users", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users");
    res.json(results);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET all projects
app.get("/api/projects", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM projects");
    res.json(results);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM projects WHERE id = ?", [
      req.params.id,
    ]);
    if (results.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// GET user by ID
app.get("/users/:id", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (results.length === 0) {
      return res.status(404).send("User tidak ditemukan");
    }
    res.json(results[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});

// POST create user
app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
    res.json({ id: result.insertId, name, email });
  } catch (err) {
    res.status(500).send(err);
  }
});

// PUT update user
app.put("/users/:id", async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [
      name,
      email,
      req.params.id,
    ]);
    res.send("User berhasil diupdate");
  } catch (err) {
    res.status(500).send(err);
  }
});

// DELETE user
app.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.send("User berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// DELETE project
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM projects WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("❌ Error deleting project:", error.message, "↩️", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", detail: error.message });
  }
});

// POST project
app.post("/api/projects", async (req, res) => {
  try {
    const {
      title,
      subtitle,
      image_url,
      description,
      features,
      technologies,
      slug,
      release_date,
      development_time,
      platforms,
      source_code, // ✅ BUKAN source_code_url
      trailer_url,
      team,
      physics,
      logic_js,
      genre,
      play_url,
    } = req.body;

    const query = `
  INSERT INTO projects
  (title, subtitle, image_url, description, features, technologies, slug, release_date, development_time, platforms, source_code, trailer_url, team, physics, logic_js, genre, play_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

    const values = [
      title,
      subtitle,
      image_url,
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
      physics,
      logic_js,
      genre,
      play_url,
    ];
    const [result] = await db.query(query, values);
    res.json({
      success: true,
      message: "Project berhasil ditambahkan",
      projectId: result.insertId,
    });
  } catch (error) {
    console.error("Gagal simpan project:", error);
    res.status(500).json({ success: false, message: "Gagal simpan project" });
  }
});

// POST upload asset
app.get("/asset/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [results] = await db.query(
      "SELECT mime_type, data FROM project_assets WHERE id = ?",
      [id]
    );
    if (results.length === 0) return res.status(404).send("Asset not found");
    const { mime_type, data } = results[0];
    res.setHeader("Content-Type", mime_type);
    res.send(data);
  } catch (err) {
    res.status(500).send("Error saat ambil asset");
  }
});

app.get("/game/:slug", async (req, res) => {
  const slug = req.params.slug;

  const sql = `
    SELECT p.id, p.logic_js, p.physics, p.spine, a.id AS asset_id, a.type, a.key
    FROM projects p
    LEFT JOIN project_assets a ON p.id = a.project_id
    WHERE p.slug = ?
  `;

  try {
    const [results] = await db.query(sql, [slug]);
    if (results.length === 0)
      return res.status(404).json({ error: "Game not found" });

    const { logic_js, physics, spine } = results[0];
    const assets = results
      .filter((r) => r.asset_id)
      .map((row) => ({
        type: row.type,
        key: row.key,
        url: `/asset/${row.asset_id}`,
      }));

    res.json({
      logic: logic_js || "",
      physics: physics || "arcade",
      spine: !!spine,
      assets,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.error(error);
  }
});

app.get("/", (req, res) => {
  res.send("🟢 REST API kamu aktif. Coba akses /users");
});

app.get("/debug", (req, res) => {
  res.send("🛠️ Debug route bekerja");
});

app.use(express.static("public"));

// Mulai server
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
