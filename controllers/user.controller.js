const db = require("../config/db");

// GET all users
exports.getAllUsers = async (req, res) => {
  console.log("📥 GET /users dipanggil");
  try {
    const [results] = await db.query("SELECT * FROM users");
    res.json(results);
  } catch (err) {
    console.error("❌ Error DB:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET user by ID
exports.getUserById = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    if (results.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST create user
exports.createUser = async (req, res) => {
  const { name, email } = req.body;
  console.log("📝 Creating user:", { name, email });
  
  try {
    const [result] = await db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );
    res.json({ 
      id: result.insertId, 
      name, 
      email,
      message: "User berhasil ditambahkan"
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PUT update user
exports.updateUser = async (req, res) => {
  const { name, email } = req.body;
  try {
    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?", 
      [name, email, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    
    res.json({ message: "User berhasil diupdate" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [
      req.params.id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};