const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const multer = require("multer");
// const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const port = 3000;

const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static(path.join(__dirname, "public")));

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

//USERS
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

app.get("/api/project-image/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT image FROM projects WHERE id = ?",
      [req.params.id]
    );
    if (results.length === 0 || !results[0].image) {
      return res.status(404).send("Image not found");
    }

    res.setHeader("Content-Type", "image/png"); // atau image/jpeg jika sesuai
    res.send(results[0].image); // langsung kirim binary image
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/api/project-image/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT image FROM projects WHERE id = ?",
      [req.params.id]
    );
    if (results.length === 0 || !results[0].image) {
      return res.status(404).send("Image not found");
    }

    res.setHeader("Content-Type", "image/png"); // atau image/jpeg jika sesuai
    res.send(results[0].image); // langsung kirim binary image
  } catch (err) {
    res.status(500).send(err);
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
    res.json({ message: "User berhasil diupdate" });
  } catch (err) {
    res.status(500).send(err);
  }
});

// PUT update project
app.put("/api/projects/:id", upload.single("image"), async (req, res) => {
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

    const imageBuffer = req.file ? req.file.buffer : null;

    let query = `
      UPDATE projects SET
        title = ?, subtitle = ?, description = ?, features = ?, technologies = ?,
        slug = ?, release_date = ?, development_time = ?, platforms = ?, source_code = ?,
        trailer_url = ?, team = ?, logic_js = ?, genre = ?
    `;

    const values = [
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
    ];

    if (imageBuffer) {
      query += `, image = ?`;
      values.push(imageBuffer);
    }

    query += ` WHERE id = ?`;
    values.push(req.params.id);

    const [result] = await db.query(query, values);
    res.json({ success: true, message: "Project berhasil diperbarui" });
  } catch (error) {
    console.error("Gagal update project:", error);
    res.status(500).json({ success: false, message: "Gagal update project" });
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

app.delete("/spritesheet/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM spritesheet WHERE id = ?", [req.params.id]);
    res.send("Spritesheet berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// DELETE project
app.delete("/api/projects/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Ambil slug dari project yang akan dihapus
    const [projects] = await db.query(
      "SELECT slug FROM projects WHERE id = ?",
      [id]
    );
    if (projects.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
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
    res
      .status(500)
      .json({ success: false, message: "Server error", detail: error.message });
  }
});

// POST project with image upload
app.post("/api/projects", upload.single("image"), async (req, res) => {
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

    const image = req.file ? req.file.buffer : null; // ambil buffer file gambar

    const query = `
      INSERT INTO projects
      (title, subtitle, image, description, features, technologies, slug, release_date, development_time, platforms, source_code, trailer_url, team, logic_js, genre)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      title,
      subtitle,
      image,
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
app.post("/gambar", upload.single("image"), async (req, res) => {
  if (!req.file || !req.body.slug)
    return res.status(400).send("❌ File atau slug tidak ditemukan");

  const { originalname, mimetype, buffer } = req.file;
  const { slug } = req.body;

  try {
    await db.query(
      "INSERT INTO images (name, type, data, slug) VALUES (?, ?, ?, ?)",
      [originalname, mimetype, buffer, slug]
    );
    res.redirect("/dashboard.html#images");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Gagal menyimpan ke database");
  }
});

app.post("/spr", upload.single("image"), async (req, res) => {
  if (!req.file || !req.body.slug)
    return res.status(400).send("❌ File atau slug tidak ditemukan");

  const { originalname, mimetype, buffer } = req.file;
  const { slug, width, height } = req.body;

  // console.log("Uploading:", {
  //   filename: originalname,
  //   type: mimetype,
  //   dataSize: buffer?.length,
  //   slug,
  //   width,
  //   height,
  // });

  try {
    await db.query(
      "INSERT INTO spritesheet (filename, type, data, slug, width, height) VALUES (?, ?, ?, ?, ?, ?)",
      [originalname, mimetype, buffer, slug, width || null, height || null]
    );
    res.redirect("/dashboard.html#spritesheet");
  } catch (err) {
    console.error("❌ Gagal menyimpan ke database:", err);
    res.status(500).send("❌ Gagal menyimpan ke database");
  }
});

app.get("/images", async (req, res) => {
  try {
    const [images] = await db.query("SELECT id, name, type, slug FROM images");
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal mengambil gambar");
  }
});

// Endpoint untuk menampilkan gambar berdasarkan ID
app.get("/image/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM images WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).send("Gambar tidak ditemukan");

    const image = rows[0];
    res.setHeader("Content-Type", image.type);
    res.send(image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menampilkan gambar");
  }
});

// Endpoint untuk hapus
app.delete("/image/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM images WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).send("Gambar tidak ditemukan");
    res.send("Gambar berhasil dihapus");
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menghapus gambar");
  }
});

app.get("/image/:slug/:name", async (req, res) => {
  const { slug, name } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM images WHERE slug = ? AND name = ?",
      [slug, name]
    );
    if (rows.length === 0)
      return res.status(404).send("Gambar tidak ditemukan");

    const image = rows[0];
    res.setHeader("Content-Type", image.type);
    res.send(image.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menampilkan gambar");
  }
});

app.get("/slugs", async (req, res) => {
  const [rows] = await db.query("SELECT slug FROM projects");
  res.json(rows);
});

app.get("/game/:slug", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM projects WHERE slug = ?", [
    req.params.slug,
  ]);
  if (rows.length === 0)
    return res.status(404).json({ error: "Game not found" });

  res.json({
    fullCode: rows[0].logic_js, // ini adalah string JavaScript lengkap
  });
});

app.get("/spritesheet", async (req, res) => {
  try {
    const [spritesheet] = await db.query(
      "SELECT id, filename, type, slug, width, height FROM spritesheet"
    );
    res.json(spritesheet);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal mengambil spritesheet");
  }
});

// Endpoint untuk menampilkan gambar berdasarkan ID
app.get("/spritesheet/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM spritesheet WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).send("Spritesheet tidak ditemukan");

    const spritesheet = rows[0];
    res.setHeader("Content-Type", spritesheet.type);
    res.send(spritesheet.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menampilkan spritesheet");
  }
});

app.get("/spritesheet/:slug/:filename", async (req, res) => {
  const { slug, name } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM spritehseet WHERE slug = ? AND filename = ? AND width = ? AND height = ?",
      [slug, name]
    );
    if (rows.length === 0)
      return res.status(404).send("Spritesheet tidak ditemukan");

    const spritesheet = rows[0];
    res.setHeader("Content-Type", spritesheet.type);
    res.send(spritesheet.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menampilkan spritesheet");
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
