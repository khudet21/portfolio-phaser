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
    host: "maglev.proxy.rlwy.net",
    user: "root",
    port: 15711,
    password: "LIEkDFHcwmyPbLvcnGYVyqAyXAsoqORr",
    database: "railway",
  })
  .promise();

async function buatTabel() {
  try {
     // Buat tabel spritesheet
    await db.query(`
      CREATE TABLE IF NOT EXISTS spritesheet (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255),
        data LONGBLOB,
        slug VARCHAR(100),
        width INT,
        height INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(100) DEFAULT 'general'
      )
    `);

    // Buat tabel audios
    await db.query(`
      CREATE TABLE IF NOT EXISTS audios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100),
        filename VARCHAR(255),
        data LONGBLOB,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Buat tabel particle
    await db.query(`
      CREATE TABLE IF NOT EXISTS particle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100),
        json_filename VARCHAR(255),
        img_filename VARCHAR(255),
        dJson LONGBLOB,
        dImg LONGBLOB
      )
    `);

    // Buat tabel spine
    await db.query(`
      CREATE TABLE IF NOT EXISTS spine (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100),
        img_filename VARCHAR(255),
        json_filename VARCHAR(255),
        atlas_filename VARCHAR(255),
        dImg LONGBLOB,
        dJson LONGBLOB,
        dAtlas LONGBLOB
      )
    `);

    await db.query(`
      DROP TABLE assetss;
    `);

    console.log("Tabel berhasil dibuat!");
  } catch (err) {
    console.error("Gagal membuat tabel:", err);
  }
}

// buatTabel();

// === ROUTES ===

// Izinkan semua resource dari semua sumber (jangan untuk production)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  );

  next();
});

// ====== USERS ======
//USERS
app.get("/api/users", async (req, res) => {
  console.log("📥 GET /api/users dipanggil");
  try {
    const [results] = await db.query("SELECT * FROM users");
    res.json(results);
    // console.log(results);
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
    // console.log(results);
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
    // console.log(results[0]);
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
    console.error(err); // Tambahkan ini
    res.status(500).send({ error: err.message });
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

// DELETE user
app.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.send("User berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ====== PROJECTS ======
// GET all projects
app.get("/api/projects", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM projects");
    res.json(results);
    console.log(results);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET project by ID
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

// POST create project
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

// Endpoint untuk mendapatkan semua slug dari tabel projects
app.get("/slugs", async (req, res) => {
  const [rows] = await db.query("SELECT slug FROM projects");
  res.json(rows);
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

// ====== IMAGES ======
// GET all images
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

// Endpoint untuk menampilkan gambar berdasarkan slug dan nama
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

// Endpoint untuk mendapatkan semua slug dari tabel images
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

// POST gambar asset
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

// ====== SPRITESHEET ======
// GET all spritesheet
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

// Endpoint untuk menampilkan spritesheet berdasarkan ID
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

// Endpoint untuk menampilkan spritesheet berdasarkan slug dan nama
app.get("/spritesheet/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM spritesheet WHERE slug = ? AND filename = ?",
      [slug, filename]
    );

    if (rows.length === 0)
      return res.status(404).send("Spritesheet tidak ditemukan");

    const sheet = rows[0];
    res.setHeader("Content-Type", sheet.type);
    res.send(sheet.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal menampilkan spritesheet");
  }
});

// Endpoint metadata saja (tanpa data biner)
app.get("/spritesheet/meta/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT filename, slug, width, height, type FROM spritesheet WHERE slug = ? AND filename = ?",
      [slug, filename]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Metadata tidak ditemukan" });

    const sprite = rows[0];
    res.json({
      url: `/spritesheet/${sprite.slug}/${sprite.filename}`,
      width: sprite.width,
      height: sprite.height,
      type: sprite.type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal mengambil metadata spritesheet");
  }
});

// POST spritesheet
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

// Endpoint untuk hapus spritesheet
app.delete("/spritesheet/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM spritesheet WHERE id = ?", [req.params.id]);
    res.send("Spritesheet berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ====== AUIDIO ======
// GET all audio
app.get("/audios", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, filename, slug FROM audios");
    res.json(rows);
  } catch (err) {
    console.error("Gagal ambil data audio:", err);
    res.status(500).json({ error: "Gagal mengambil data audio" });
  }
});

// Endpoint untuk menampilkan audio berdasarkan ID
app.get("/audio/:id", async (req, res) => {
  const audioId = req.params.id;

  try {
    const [rows] = await db.query("SELECT filename FROM audios WHERE id = ?", [
      audioId,
    ]);

    if (!rows.length) {
      return res.status(404).send("Audio tidak ditemukan");
    }

    const audio = rows[0];

    // Tentukan content type berdasarkan ekstensi file
    const ext = path.extname(audio.filename).toLowerCase();
    let contentType = "audio/mpeg"; // default
    if (ext === ".wav") contentType = "audio/wav";
    else if (ext === ".ogg") contentType = "audio/ogg";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${audio.filename}"`
    );
    res.send(audio.file); // kirim buffer audio langsung
  } catch (err) {
    console.error("Gagal kirim audio:", err);
    res.status(500).send("Gagal memutar audio");
  }
});

// Endpoint untuk mendapatkan semua audio
app.get("/audio/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;
  const [rows] = await db.query(
    "SELECT data, mime_type FROM audios WHERE slug = ? AND filename = ? LIMIT 1",
    [slug, filename]
  );

  if (rows.length === 0) return res.status(404).send("Audio tidak ditemukan");

  res.set("Content-Type", rows[0].mime_type);
  res.send(rows[0].data);
});

// POST audio
app.post("/audio", upload.single("audio"), async (req, res) => {
  try {
    const { slug } = req.body;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "File audio diperlukan" });
    }

    await db.query(
      `INSERT INTO audios (slug, filename, data, mime_type) VALUES (?, ?, ?, ?)`,
      [slug, file.originalname, file.buffer, file.mimetype]
    );

    res.redirect("/dashboard.html#audio");
  } catch (err) {
    console.error("Gagal upload audio:", err);
    res.status(500).json({ success: false, message: "Gagal upload audio" });
  }
});

// Endpoint untuk hapus spritesheet
app.delete("/audio/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM audios WHERE id = ?", [req.params.id]);
    res.send("Audios berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ====== PARTICLE ======
// GET all particle
app.get("/particle", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, img_filename, json_filename, slug FROM particle"
    );
    res.json(rows);
  } catch (err) {
    console.error("Gagal ambil data particle:", err);
    res.status(500).json({ error: "Gagal mengambil data particle" });
  }
});

// Endpoint untuk menampilkan particle berdasarkan ID
app.get("/particle/:id", async (req, res) => {
  const ptcId = req.params.id;

  try {
    const [rows] = await db.query(
      "SELECT img_filename, json_filename, dImg, dJson FROM particle WHERE id = ?",
      [ptcId]
    );

    if (!rows.length) {
      return res.status(404).send("File tidak ditemukan");
    }

    const ptc = rows[0];

    // Tentukan content type berdasarkan ekstensi file
    const jsn = path.extname(ptc.json_filename).toLowerCase();
    const img = path.extname(ptc.img_filename).toLowerCase();
    let contentType = "application/json"; // default untuk .json

    if (img === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; json_filename="${ptc.json_filename}"`
    );
    res.setHeader(
      "Content-Disposition",
      `inline; img_filename="${ptc.img_filename}"`
    );
    res.send(ptc.data); // kirim isi file JSON (atau audio) dari database
  } catch (err) {
    console.error("Gagal kirim file:", err);
    res.status(500).send("Gagal mengambil file");
  }
});

// Endpoint untuk mendapatkan semua particle
app.get("/particle/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;

  const [rows] = await db.query(
    "SELECT json_filename, img_filename, dJson, dImg FROM particle WHERE slug = ? LIMIT 1",
    [slug]
  );

  if (rows.length === 0)
    return res.status(404).send("Particle tidak ditemukan");

  const row = rows[0];

  if (filename === row.json_filename) {
    res.set("Content-Type", "application/json");
    res.send(row.dJson);
  } else if (filename === row.img_filename) {
    res.set("Content-Type", "image/png"); // atau image/webp sesuai formatnya
    res.send(row.dImg);
  } else {
    res.status(404).send("File tidak ditemukan");
  }
});

// Ambil gambar dari particle
app.get("/particle/image/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;
  const [rows] = await db.query(
    "SELECT dImg FROM particle WHERE slug = ? AND img_filename = ? LIMIT 1",
    [slug, filename]
  );

  if (rows.length === 0) return res.status(404).send("Gambar tidak ditemukan");

  res.set("Content-Type", "image/png");
  res.send(rows[0].dImg);
});

// Ambil JSON dari particle
app.get("/particle/json/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;
  const [rows] = await db.query(
    "SELECT dJson FROM particle WHERE slug = ? AND json_filename = ? LIMIT 1",
    [slug, filename]
  );

  if (rows.length === 0) return res.status(404).send("JSON tidak ditemukan");

  res.set("Content-Type", "application/json");
  res.send(rows[0].dJson);
});

// Post endpoint untuk upload JSON
app.post(
  "/particle",
  upload.fields([
    { name: "json", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    const { slug } = req.body;
    const jsonFile = req.files?.json?.[0];
    const imageFile = req.files?.image?.[0];

    if (!slug || !jsonFile || !imageFile) {
      return res.status(400).send("Semua field wajib diisi");
    }

    await db.execute(
      `INSERT INTO particle (slug, json_filename, img_filename, dJson, dImg)
     VALUES (?, ?, ?, ?, ?)`,
      [
        slug,
        jsonFile.originalname,
        imageFile.originalname,
        jsonFile.buffer,
        imageFile.buffer,
      ]
    );

    res.redirect("/dashboard.html#particle");
  }
);

// Endpoint untuk hapus particle
app.delete("/particle/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM particle WHERE id = ?", [req.params.id]);
    res.send("Particle berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ====== SPINE ======
// GET all spine
app.get("/spine", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, slug, img_filename, json_filename, atlas_filename FROM spine"
    );
    res.json(rows);
  } catch (err) {
    console.error("Gagal ambil data spine:", err);
    res.status(500).json({ error: "Gagal mengambil data spine" });
  }
});

// Endpoint untuk menampilkan spine berdasarkan ID
app.get("/spine/:id", async (req, res) => {
  const spnId = req.params.id;

  try {
    const [rows] = await db.query(
      "SELECT slug, img_filename, json_filename, atlas_filename, dImg, dJson, dAtlas FROM spine WHERE id = ?",
      [spnId]
    );

    if (!rows.length) {
      return res.status(404).send("File tidak ditemukan");
    }

    const spn = rows[0];

    // Tentukan content type berdasarkan ekstensi file
    const img = path.extname(spn.img_filename).toLowerCase();
    const jsn = path.extname(spn.json_filename).toLowerCase();
    const ats = path.extname(spn.json_filename).toLowerCase();
    let contentType = "image/png"; // default untuk .png

    if (img === ".png") contentType = "image/png"; // jika file PNG
    if (jsn === ".json") contentType = "application/json"; // jika file JSON
    if (ats === ".atlas") contentType = "application/atlas"; // jika file atlas

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; img_filename="${spn.img_filename}"`
    );
    res.setHeader(
      "Content-Disposition",
      `inline; json_filename="${spn.json_filename}"`
    );
    res.setHeader(
      "Content-Disposition",
      `inline; atlas_filename="${spn.atlas_filename}"`
    );
    res.send(spn.data); // kirim isi file spine dari database
  } catch (err) {
    console.error("Gagal kirim file:", err);
    res.status(500).send("Gagal mengambil file");
  }
});

// Endpoint untuk mendapatkan semua spine
app.get("/spine/image/:slug/:filename", async (req, res) => {
  const { slug, filename } = req.params;

  const [rows] = await db.query(
    `SELECT img_filename, json_filename, atlas_filename, dImg, dJson, dAtlas
     FROM spine
     WHERE slug = ?
     AND (img_filename = ? OR json_filename = ? OR atlas_filename = ?)
     LIMIT 1`,
    [slug, filename, filename, filename]
  );

  if (rows.length === 0) {
    console.warn("File tidak ditemukan:", slug, filename);
    return res.status(404).send("File tidak ditemukan");
  }

  const row = rows[0];

  if (filename === row.img_filename) {
    res.set("Content-Type", "image/png");
    return res.send(row.dImg);
  } else if (filename === row.json_filename) {
    res.set("Content-Type", "application/json");
    return res.send(row.dJson);
  } else if (filename === row.atlas_filename) {
    res.set("Content-Type", "text/plain"); // atau text/x-tex seperti format .atlas
    return res.send(row.dAtlas);
  } else {
    return res.status(404).send("File tidak ditemukan");
  }
});

// Ambil gambar dari spine
// app.get("/spine/image/:slug/:filename", async (req, res) => {
//   try {
//     const { slug, filename } = req.params;
//     const [rows] = await db.query(
//       "SELECT dImg FROM spine WHERE slug = ? AND img_filename = ? LIMIT 1",
//       [slug, filename]
//     );

//     if (rows.length === 0) {
//       console.warn(
//         `Gambar tidak ditemukan: slug=${slug}, filename=${filename}`
//       );
//       return res.status(404).send("Gambar tidak ditemukan");
//     }

//     res.set("Content-Type", "image/png");
//     res.send(rows[0].dImg);
//   } catch (err) {
//     console.error("Error ambil gambar spine:", err);
//     res.status(500).send("Server error");
//   }
// });

// Ambil JSON dari spine
app.get("/spine/json/:slug/:filename", async (req, res) => {
  try {
    const { slug, filename } = req.params;
    const [rows] = await db.query(
      "SELECT dJson FROM spine WHERE slug = ? AND json_filename = ? LIMIT 1",
      [slug, filename]
    );

    if (rows.length === 0) {
      console.warn(`JSON tidak ditemukan: slug=${slug}, filename=${filename}`);
      return res.status(404).send("JSON tidak ditemukan");
    }

    res.set("Content-Type", "application/json");
    res.send(rows[0].dJson);
  } catch (err) {
    console.error("Error ambil JSON spine:", err);
    res.status(500).send("Server error");
  }
});

// Ambil atlas dari spine
app.get("/spine/atlas/:slug/:filename", async (req, res) => {
  try {
    const { slug, filename } = req.params;
    const [rows] = await db.query(
      "SELECT dAtlas FROM spine WHERE slug = ? AND atlas_filename = ? LIMIT 1",
      [slug, filename]
    );

    if (rows.length === 0) {
      console.warn(`Atlas tidak ditemukan: slug=${slug}, filename=${filename}`);
      return res.status(404).send("Atlas tidak ditemukan");
    }

    res.set("Content-Type", "text/plain"); // atau application/octet-stream
    res.send(rows[0].dAtlas);
  } catch (err) {
    console.error("Error ambil atlas spine:", err);
    res.status(500).send("Server error");
  }
});

// Post endpoint untuk upload spine
app.post(
  "/spine",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "json", maxCount: 1 },
    { name: "atlas", maxCount: 1 },
  ]),
  async (req, res) => {
    const { slug } = req.body;
    const imageFile = req.files?.image?.[0];
    const jsonFile = req.files?.json?.[0];
    const atlasFile = req.files?.atlas?.[0];

    if (!slug || !imageFile || !jsonFile || !atlasFile) {
      return res.status(400).send("Semua field wajib diisi");
    }

    await db.execute(
      `INSERT INTO spine (slug, img_filename, json_filename, atlas_filename, dImg, dJson, dAtlas)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        imageFile.originalname,
        jsonFile.originalname,
        atlasFile.originalname,
        imageFile.buffer,
        jsonFile.buffer,
        atlasFile.buffer,
      ]
    );

    res.redirect("/dashboard.html#spine");
  }
);

// Endpoint untuk hapus spine
app.delete("/spine/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM spine WHERE id = ?", [req.params.id]);
    res.send("Spine berhasil dihapus");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ====== DEBUG ROUTES ======
// Endpoint untuk mengarahkan ke portfolio.html
app.get("/", (req, res) => {
  res.redirect("/portfolio.html");
});

// Endpoint untuk debug
app.get("/debug", (req, res) => {
  res.send("🛠️ Debug route bekerja");
});

// Endpoint untuk menguji REST API
app.use(express.static("public"));
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: blob:; " +
      "script-src 'self' 'unsafe-inline'; " +
      "media-src 'self' blob: data:;"
  );
  next();
});

// Mulai server
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
