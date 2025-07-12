const express = require("express");
const multer = require("multer");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, "public")));

let db;
(async () => {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "portfolio", // pastikan database "portfolio" ada
  });
  console.log("✅ Terhubung ke database");
})();

app.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).send("❌ File tidak ditemukan");

  const { originalname, mimetype, buffer } = req.file;

  try {
    await db.query("INSERT INTO images (name, type, data) VALUES (?, ?, ?)", [
      originalname,
      mimetype,
      buffer,
    ]);
    // res.send(`✅ Upload berhasil: ${originalname}`);
    res.redirect("/upload.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Gagal menyimpan ke database");
  }
});

app.get("/images", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM images ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal mengambil data gambar");
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

app.listen(3000, () => {
  console.log("🚀 Server jalan di http://localhost:3000");
});
