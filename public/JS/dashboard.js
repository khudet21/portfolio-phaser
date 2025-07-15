// Initialize C odeMirror editor
const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
  lineNumbers: true,
  mode: "javascript",
  theme: "dracula",
  indentUnit: 2,
  indentWithTabs: false,
  lineWrapping: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
});

function updateToggleButtonPosition() {
  const button = document.querySelector(".fullscreen-toggle");
  const lineCount = editor.lineCount();

  if (lineCount > 19) {
    button.style.right = "16px";
  } else {
    button.style.right = "8px";
  }
}

function toggleFullScreenEditor() {
  const isFullscreen = document.body.classList.toggle("fullscreen");
  codeEditor.refresh();
}

updateToggleButtonPosition(); // posisi awal

// Periksa ulang saat konten berubah
editor.on("change", () => {
  updateToggleButtonPosition();
});

function toggleFullScreenEditor() {
  const isFullscreen = document.body.classList.toggle("fullscreen");
  editor.refresh();
}

// ESC to exit fullscreen
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && document.body.classList.contains("fullscreen")) {
    document.body.classList.remove("fullscreen");
    editor.refresh();
  }
});

// Set value on submit
document.getElementById("projectForm").addEventListener("submit", function () {
  document.getElementById("editor").value = editor.getValue();
});

// Delay for undo checkpoint
let undoTimer = null;
editor.on("change", function () {
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    editor.doc.markClean();
  }, 300);
});

document.addEventListener("DOMContentLoaded", () => {
  fetchUsers();
  fetchProjects();

  document
    .getElementById("add-user-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const form = e.target;
      const id = document.getElementById("user-id").value;
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;

      const url = id ? `/users/${id}` : "/users";
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      document.getElementById("add-user-status").innerText = data.message;

      fetchUsers(); // Refresh list user
      closeUserForm(); // Sembunyikan form
      form.reset(); // Reset form
      document.getElementById("user-id").value = ""; // Hapus ID (kembali ke mode tambah)
    });

  // Function to add a project to the table
  document
    .getElementById("projectForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const form = e.target;
      const formData = new FormData(form);
      const projectId = form.dataset.projectId;

      const method = projectId ? "PUT" : "POST";
      const url = projectId ? `/api/projects/${projectId}` : "/api/projects";

      // Ambil logic JS dari TinyMCE tanpa tag HTML
      const logicContent = editor.getValue();
      formData.set("logic_js", logicContent);

      fetch(url, {
        method,
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Gagal simpan data");
          return res.json();
        })
        .then((data) => {
          closeProjectModal();
          form.reset();
          delete form.dataset.projectId; // reset mode edit
          fetchProjects(); // reload data
        })
        .catch((err) => {
          console.error("Error:", err);
          alert("Gagal simpan project.");
        });
    });
});

function showSection(id) {
  // Tampilkan section yang dipilih
  document.querySelectorAll(".section").forEach((sec) => {
    sec.classList.remove("active");
  });
  const targetSection = document.getElementById(id);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Update menu yang aktif
  document.querySelectorAll(".menu a").forEach((link) => {
    link.classList.remove("active");
  });
  // Tandai menu sesuai id
  const activeLink = Array.from(document.querySelectorAll(".menu a")).find(
    (link) => {
      return link.getAttribute("onclick")?.includes(id);
    }
  );
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

function fetchUsers() {
  fetch("/users")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("userTableBody");
      tbody.innerHTML = "";
      data.forEach((user) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
            <button onclick="editUser('${user.id}')">✏️</button>
            <button onclick="deleteUser(${user.id})">🗑️</button></td>
          `;
        tbody.appendChild(tr);
      });
    });
}

function fetchProjects() {
  fetch("/api/projects")
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById("projectTableBody");
      tbody.innerHTML = "";
      data.forEach((project) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${project.title}</td>
            <td>${project.genre}</td>          
            <td>${project.slug}</td>
            <td>${project.description}</td>
            <td><button onclick="editProject('${project.id}')">✏️</button>
            <button onclick="deleteProject(${project.id})">🗑️</button></td>
          `;
        tbody.appendChild(tr);
      });
    });
}

function deleteUser(id) {
  const yakin = confirm("Apakah Anda yakin ingin menghapus user ini?");
  if (!yakin) return; // kalau user klik "Batal", tidak lanjut hapus

  fetch(`/users/${id}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Gagal menghapus user");
      return res.text();
    })
    .then((msg) => {
      console.log(msg);
      fetchUsers(); // reload data
    })
    .catch((err) => console.error(err));
}

// Function to submit the user form
function submitUserForm(event) {
  event.preventDefault(); // agar tidak reload halaman

  const name = document.getElementById("userName").value;
  const email = document.getElementById("userEmail").value;

  fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("User berhasil ditambahkan:", data);
      closeUserForm();
      fetchUsers(); // tampilkan ulang tabel user
    })
    .catch((err) => console.error(err));
}

// Function to delete a project
function deleteProject(id) {
  if (!confirm("Hapus project ini?")) return;
  fetch(`/api/projects/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then(() => fetchProjects(), loadImages());
}

// Function to open the user form modal
function openUserForm() {
  document.getElementById("add-user-status").innerText = "  ";
  document.getElementById("user-modal").style.display = "block";
}

// Function to close the user form modal
function closeUserForm() {
  const form = document.getElementById("add-user-form");
  form.reset();
  document.getElementById("user-id").value = "";
  document.getElementById("user-modal").style.display = "none";
}

// Function to open the project modal
function openProjectModal() {
  document.getElementById("projectModal").style.display = "block";
  setTimeout(() => editor.refresh(), 50);
}

// Function to close the project modal
function closeProjectModal() {
  document.getElementById("projectModal").style.display = "none";
  clearProjectForm();
}

function openAssetModal() {
  document.getElementById("assetModal").style.display = "block";
}

function closeAssetModal() {
  document.getElementById("assetModal").style.display = "none";
  document.getElementById("assetForm").reset();
}

function clearProjectForm() {
  editor.setValue("");
  setTimeout(() => editor.refresh(), 100);
  const form = document.getElementById("projectForm");
  form.reset();
  delete form.dataset.projectId;
  const oldPreview = form.querySelector("img");
  if (oldPreview) oldPreview.remove(); // Hapus preview gambar
}

// Ambil daftar slug dari server
fetch("/slugs")
  .then((res) => res.json())
  .then((slugs) => {
    const select = document.getElementById("slugSelect");
    slugs.forEach(({ slug }) => {
      const option = document.createElement("option");
      option.value = slug;
      option.textContent = slug;
      select.appendChild(option);
    });
  });

async function loadImages() {
  const res = await fetch("/images");
  const images = await res.json();

  const tbody = document.querySelector("#imageTable tbody");
  tbody.innerHTML = "";

  for (const img of images) {
    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = img.name;

    const imgTd = document.createElement("td");
    const image = document.createElement("img");
    image.src = `/image/${img.id}`;
    image.style.maxHeight = "50px";
    imgTd.appendChild(image);

    const slugTd = document.createElement("td"); // ✅ kolom baru
    slugTd.textContent = img.slug || "-";

    const actionTd = document.createElement("td");
    const edit = document.createElement("button");
    edit.textContent = "✏️";
    edit.onclick = async () => {};

    actionTd.appendChild(edit);

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.onclick = async () => {
      if (confirm("Yakin mau hapus gambar ini?")) {
        await fetch(`/image/${img.id}`, { method: "DELETE" });
        loadImages();
      }
    };
    actionTd.appendChild(del);

    tr.appendChild(nameTd);
    tr.appendChild(imgTd);
    tr.appendChild(slugTd); // ✅ masukkan slug di sini
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  }
}

async function editProject(id) {
  try {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error("Gagal mengambil data project");
    const project = await res.json();

    const form = document.getElementById("projectForm");

    // Isi nilai field
    form.title.value = project.title;
    form.subtitle.value = project.subtitle;
    form.description.value = project.description;
    form.features.value = project.features;
    form.technologies.value = project.technologies;
    form.release_date.value = project.release_date?.split("T")[0] || "";
    form.development_time.value = project.development_time;
    form.team.value = project.team;
    form.genre.value = project.genre;
    form.platforms.value = project.platforms;
    form.source_code.value = project.source_code;
    form.trailer_url.value = project.trailer_url;
    form.slug.value = project.slug;
    editor.setValue(project.logic_js || "");
    editor.refresh(); // ✅ Ini bagian penting

    // Preview gambar
    if (project.image) {
      const imagePreview = document.createElement("img");
      imagePreview.src = `data:image/png;base64,${btoa(
        new Uint8Array(project.image.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      )}`;
      imagePreview.style.maxWidth = "100px";
      imagePreview.style.display = "block";

      const oldPreview = form.querySelector("img");
      if (oldPreview) oldPreview.remove();

      form.insertBefore(
        imagePreview,
        form.querySelector('input[name="image"]')
      );
    }

    form.dataset.projectId = id;
    openProjectModal(); // Tampilkan modal
    editor.refresh(); // ✅ Ini bagian penting
  } catch (err) {
    console.error("Gagal muat data project:", err);
    alert("Gagal muat data project.");
  }
}

async function editUser(id) {
  const res = await fetch(`/users/${id}`);
  const user = await res.json();

  document.getElementById("user-id").value = user.id;
  document.getElementById("name").value = user.name;
  document.getElementById("email").value = user.email;

  // Tampilkan modal form (kalau pakai modal)
  document.getElementById("user-modal").style.display = "block";
}

window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash) {
    const sectionId = hash.replace("#", "");
    showSection(sectionId); // Panggil showSection berdasarkan hash
  } else {
    showSection("users"); // Default
  }

  const allSections = document.querySelectorAll(".section");

  if (hash) {
    const targetSection = document.querySelector(hash);
    if (targetSection) {
      allSections.forEach((sec) => sec.classList.remove("active")); // Nonaktifkan semua
      targetSection.classList.add("active"); // Aktifkan hanya section sesuai hash
    }
  } else {
    // Jika tidak ada hash, tampilkan default section #users
    const defaultSection = document.querySelector("#users");
    if (defaultSection) defaultSection.classList.add("active");
  }
});

// Panggil saat halaman dimuat
loadImages();
