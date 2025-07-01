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

// Koneksi ke MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // kosongkan jika root tidak pakai password
  database: "portfolio",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Gagal konek DB:", err);
  } else {
    console.log("✅ Terkoneksi ke database MySQL");
  }
});

// === ROUTES ===

// Izinkan semua resource dari semua sumber (jangan untuk production)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );

  next();
});

app.get("/api/users", (req, res) => {
  console.log("📥 GET /api/users dipanggil");
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("❌ Error DB:", err);
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});

// GET all users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// GET all projects
app.get("/api/projects", (req, res) => {
  db.query("SELECT * FROM projects", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.get("/api/projects/:id", (req, res) => {
  const projectId = req.params.id;
  db.query(
    "SELECT * FROM projects WHERE id = ?",
    [projectId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0)
        return res.status(404).json({ message: "Project not found" });
      res.json(results[0]);
    }
  );
});

// GET user by ID
app.get("/users/:id", (req, res) => {
  db.query(
    "SELECT * FROM users WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0)
        return res.status(404).send("User tidak ditemukan");
      res.json(results[0]);
    }
  );
});

// POST create user
app.post("/users", (req, res) => {
  const { name, email } = req.body;
  db.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, name, email });
    }
  );
});

// PUT update user
app.put("/users/:id", (req, res) => {
  const { name, email } = req.body;
  db.query(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    [name, email, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("User berhasil diupdate");
    }
  );
});

// DELETE user
app.delete("/users/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("User berhasil dihapus");
  });
});

// DELETE project
const util = require("util");
const query = util.promisify(db.query).bind(db);

app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM projects WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("❌ Error deleting project:", error.message, "↩️", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", detail: error.message });
  }
});

app.post("/projects", (req, res) => {
  const {
    title,
    subtitle,
    image_url,
    description,
    features,
    technologies,
    release_date,
    development_time,
    team,
    genre,
    platforms,
    play_url,
    source_code_url,
    trailer_url,
  } = req.body;

  const sql = `
    INSERT INTO projects (
      title, subtitle, image_url, description, features, technologies, release_date,
      development_time, team, genre, platforms, play_url, source_code_url, trailer_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    title,
    subtitle,
    image_url,
    description,
    features,
    technologies,
    release_date,
    development_time,
    team,
    genre,
    platforms,
    play_url,
    source_code_url,
    trailer_url,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error insert project:", err);
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

app.get("/", (req, res) => {
  res.send("🟢 REST API kamu aktif. Coba akses /users");
});

app.get("/debug", (req, res) => {
  res.send("🛠️ Debug route bekerja");
});

app.get("/asset/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT mime_type, data FROM project_assets WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send("Asset not found");
    const { mime_type, data } = results[0];
    res.setHeader("Content-Type", mime_type);
    res.send(data);
  });
});

app.get("/game/:slug", (req, res) => {
  const slug = req.params.slug;

  const sql = `
    SELECT p.id, p.logic_js, p.physics, p.spine, a.id AS asset_id, a.type, a.key
    FROM projects p
    LEFT JOIN project_assets a ON p.id = a.project_id
    WHERE p.slug = ?
  `;

  db.query(sql, [slug], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Game not found" });

    const { logic_js, physics, spine } = results[0];
    const assets = results
      .filter(r => r.asset_id)
      .map(row => ({
        type: row.type,
        key: row.key,
        url: `/asset/${row.asset_id}`
      }));

    res.json({
      logic: logic_js || "",
      physics: physics || "arcade",
      spine: !!spine,
      assets
    });
  });
});

app.use(express.static("public"));

// Mulai server
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
