// ========================================
// GLOBAL VARIABLES
// ========================================
let editor; // CodeMirror instance

// ========================================
// INITIALIZE - Load slugs and editor
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔄 DOM Loaded - Initializing dashboard...");

  // Initialize CodeMirror editor
  initializeEditor();

  // Load initial data
  fetchUsers();
  fetchProjects();
  loadSlugs();

  // Setup form listeners
  setupFormListeners();

  console.log("✅ Dashboard initialized");
});

// ========================================
// INITIALIZE CODEMIRROR
// ========================================
function initializeEditor() {
  const textarea = document.getElementById("editor");
  if (textarea && typeof CodeMirror !== 'undefined') {
    editor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      mode: "javascript",
      theme: "dracula",
      indentUnit: 2,
      indentWithTabs: false,
      lineWrapping: true,
      foldGutter: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    });

    // Editor events
    editor.on("change", updateToggleButtonPosition);

    console.log("✅ CodeMirror initialized");
  } else {
    console.warn("⚠️ CodeMirror not found");
  }
}

// ========================================
// LOAD SLUGS
// ========================================
function loadSlugs() {
  fetch("/api/projects/slugs")
    .then((res) => res.json())
    .then((slugs) => {
      const selects = document.querySelectorAll("select[name='slug']");
      selects.forEach((select) => {
        select.innerHTML = "";
        slugs.forEach(({ slug }) => {
          const option = document.createElement("option");
          option.value = slug;
          option.textContent = slug;
          select.appendChild(option);
        });
      });
      console.log("✅ Slugs loaded");
    })
    .catch((err) => console.error("❌ Error loading slugs:", err));
}

// ========================================
// SETUP FORM LISTENERS
// ========================================
function setupFormListeners() {
  // User Form Submit
  const userForm = document.getElementById("add-user-form");
  if (userForm) {
    userForm.addEventListener("submit", handleUserSubmit);
  }

  // Project Form Submit
  const projectForm = document.getElementById("projectForm");
  if (projectForm) {
    projectForm.addEventListener("submit", handleProjectSubmit);
  }

  // ESC to exit fullscreen
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("fullscreen")) {
      document.body.classList.remove("fullscreen");
      if (editor) editor.refresh();
    }
  });

  console.log("✅ Form listeners setup complete");
}

// ========================================
// USER FORM SUBMIT
// ========================================
async function handleUserSubmit(e) {
  e.preventDefault();
  console.log("📝 Submitting user form...");

  const form = e.target;
  const id = document.getElementById("user-id").value;
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  const url = id ? `/api/users/${id}` : "/api/users";
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to save user");
    }

    const data = await res.json();
    console.log("✅ User saved:", data);

    // Show success message
    const statusDiv = document.getElementById("add-user-status");
    statusDiv.style.display = "block";
    statusDiv.innerText = data.message || "User berhasil disimpan!";
    statusDiv.style.color = "green";

    // Refresh and close
    setTimeout(() => {
      fetchUsers();
      closeUserForm();
      form.reset();
      document.getElementById("user-id").value = "";
    }, 1000);

  } catch (err) {
    console.error("❌ Error saving user:", err);
    const statusDiv = document.getElementById("add-user-status");
    statusDiv.style.display = "block";
    statusDiv.innerText = "Gagal menyimpan user: " + err.message;
    statusDiv.style.color = "red";
  }
}

// ========================================
// PROJECT FORM SUBMIT
// ========================================
async function handleProjectSubmit(e) {
  e.preventDefault();
  console.log("🎯 Submitting project form...");

  const form = e.target;
  const formData = new FormData(form);
  const projectId = form.dataset.projectId;
  const method = projectId ? "PUT" : "POST";
  // const url = projectId ? `/api/projects/${projectId}` : "/api/projects";

  const url = projectId
  ? "http://localhost:3000/api/projects/" + projectId
  : "http://localhost:3000/api/projects";

  console.log("📋 Request Info:");
  console.log("- Method:", method);
  console.log("- URL:", url);
  console.log("- Project ID:", projectId);

  // Get logic JS from CodeMirror
  if (editor) {
    const logicContent = editor.getValue();
    formData.set("logic_js", logicContent);
    console.log("✅ Logic JS added from CodeMirror");
  }

  // Debug FormData
  console.log("📦 FormData contents:");
  for (let [key, value] of formData.entries()) {
    if (key === 'image' && value instanceof File) {
      console.log(`  ${key}:`, value.name, `(${value.size} bytes)`);
    } else if (key === 'logic_js') {
      console.log(`  ${key}:`, value.substring(0, 50) + "...");
    } else {
      console.log(`  ${key}:`, value);
    }
  }

  try {
    const response = await fetch(url, {
      method,
      body: formData,
    });

    console.log("📥 Response:", response.status, response.ok);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save project");
    }

    const data = await response.json();
    console.log("✅ Project saved:", data);

    alert(data.message || "Project berhasil disimpan!");

    // Close modal and refresh
    closeProjectModal();
    form.reset();
    delete form.dataset.projectId;
    fetchProjects();
    loadSlugs();

  } catch (err) {
    console.error("❌ Error saving project:", err);
    alert(`Gagal simpan project: ${err.message}`);
  }
}

// ========================================
// FETCH USERS (READ)
// ========================================
async function fetchUsers() {
  console.log("🔍 Fetching users...");

  try {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("✅ Users loaded:", data.length);

    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada data user</td></tr>';
      return;
    }

    data.forEach((user) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
          <button onclick="editUser('${user.id}')">✏️</button>
          <button onclick="deleteUser('${user.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("❌ Error fetching users:", err);
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red;">Gagal memuat data</td></tr>';
  }
}

// ========================================
// FETCH PROJECTS (READ)
// ========================================
async function fetchProjects() {
  console.log("🔍 Fetching projects...");

  try {
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("✅ Projects loaded:", data.length);

    const tbody = document.getElementById("projectTableBody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data project</td></tr>';
      return;
    }

    data.forEach((project) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${project.title}</td>
        <td>${project.genre || '-'}</td>
        <td>${project.slug}</td>
        <td>${project.subtitle || '-'}</td>
        <td>
          <button onclick="editProject('${project.id}')">✏️</button>
          <button onclick="deleteProject('${project.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    const tbody = document.getElementById("projectTableBody");
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Gagal memuat data</td></tr>';
  }
}

// ========================================
// EDIT USER
// ========================================
async function editUser(id) {
  console.log("✏️ Editing user:", id);

  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error("Gagal mengambil data user");

    const user = await res.json();

    document.getElementById("user-id").value = user.id;
    document.getElementById("name").value = user.name;
    document.getElementById("email").value = user.email;

    openUserForm();

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal memuat data user: " + err.message);
  }
}

// ========================================
// EDIT PROJECT
// ========================================
async function editProject(id) {
  console.log("✏️ Editing project:", id);

  try {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error("Gagal mengambil data project");

    const project = await res.json();
    console.log("📝 Project data:", project);

    const form = document.getElementById("projectForm");

    // Set project ID for update
    form.dataset.projectId = project.id;

    // Fill form fields
    form.title.value = project.title || "";
    form.subtitle.value = project.subtitle || "";
    form.description.value = project.description || "";
    form.features.value = project.features || "";
    form.technologies.value = project.technologies || "";
    form.release_date.value = project.release_date ? project.release_date.split("T")[0] : "";
    form.development_time.value = project.development_time || "";
    form.team.value = project.team || "";
    form.genre.value = project.genre || "";
    form.platforms.value = project.platforms || "";
    form.source_code.value = project.source_code || "";
    form.trailer_url.value = project.trailer_url || "";
    form.slug.value = project.slug || "";

    // Set CodeMirror value
    if (editor) {
      editor.setValue(project.logic_js || "");
      editor.refresh();
    }

    // Make image optional for edit
    const imageInput = document.getElementById("image");
    if (imageInput) {
      imageInput.required = false;
    }

    // Preview existing image
    if (project.image) {
      showImagePreview(project);
    }

    // Open modal
    openProjectModal();

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal memuat data project: " + err.message);
  }
}

// ========================================
// SHOW IMAGE PREVIEW
// ========================================
function showImagePreview(project) {
  const form = document.getElementById("projectForm");
  const imageInput = form.querySelector('input[name="image"]');

  // Remove old preview
  const oldPreview = form.querySelector(".image-preview");
  if (oldPreview) oldPreview.remove();

  // Create preview container
  const previewDiv = document.createElement("div");
  previewDiv.className = "image-preview";
  previewDiv.innerHTML = `
    <p style="margin: 10px 0; color: #666;">Current Image:</p>
    <img src="/api/projects/image/${project.id}" 
         alt="Current project image" 
         style="max-width: 200px; border-radius: 8px; display: block;" />
  `;

  // Insert before image input
  imageInput.parentNode.insertBefore(previewDiv, imageInput);
}

// ========================================
// DELETE USER
// ========================================
async function deleteUser(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return;

  console.log("🗑️ Deleting user:", id);

  try {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal menghapus user");

    const data = await res.json();
    console.log("✅ User deleted:", data);

    alert(data.message || "User berhasil dihapus!");
    fetchUsers();

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus user: " + err.message);
  }
}

// ========================================
// DELETE PROJECT
// ========================================
async function deleteProject(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus project ini?")) return;

  console.log("🗑️ Deleting project:", id);

  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal menghapus project");

    const data = await res.json();
    console.log("✅ Project deleted:", data);

    alert(data.message || "Project berhasil dihapus!");
    fetchProjects();
    loadSlugs();
    loadImages();

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus project: " + err.message);
  }
}

// ========================================
// MODAL FUNCTIONS
// ========================================
function openUserForm() {
  document.getElementById("add-user-status").style.display = "none";
  document.getElementById("add-user-status").innerText = "";
  document.getElementById("user-modal").style.display = "block";
}

function closeUserForm() {
  const form = document.getElementById("add-user-form");
  form.reset();
  document.getElementById("user-id").value = "";
  document.getElementById("user-modal").style.display = "none";
}

function openProjectModal() {
  const modal = document.getElementById("projectModal");
  modal.style.display = "block";
  
  // Refresh CodeMirror after modal is visible
  setTimeout(() => {
    if (editor) editor.refresh();
  }, 50);
}

function closeProjectModal() {
  const modal = document.getElementById("projectModal");
  modal.style.display = "none";
  
  // Clear form
  clearProjectForm();
}

function clearProjectForm() {
  const form = document.getElementById("projectForm");
  form.reset();
  delete form.dataset.projectId;
  
  if (editor) {
    editor.setValue("");
    editor.refresh();
  }
  
  // Remove image preview
  const preview = form.querySelector(".image-preview");
  if (preview) preview.remove();
  
  // Reset image input required
  const imageInput = document.getElementById("image");
  if (imageInput) imageInput.required = true;
}

function openAssetModal() {
  document.getElementById("assetModal").style.display = "block";
}

function closeAssetModal() {
  document.getElementById("assetModal").style.display = "none";
  document.getElementById("assetForm").reset();
}

function openSprModal() {
  document.getElementById("sprModal").style.display = "block";
}

function closeSprModal() {
  document.getElementById("sprModal").style.display = "none";
  document.getElementById("sprForm").reset();
}

function openAudioModal() {
  document.getElementById("audioModal").style.display = "block";
}

function closeAudioModal() {
  document.getElementById("audioModal").style.display = "none";
  document.getElementById("audioForm").reset();
}

function openParticleModal() {
  document.getElementById("particleModal").style.display = "block";
}

function closeParticleModal() {
  document.getElementById("particleModal").style.display = "none";
  document.getElementById("ptcForm").reset();
}

function openSpineModal() {
  document.getElementById("spineModal").style.display = "block";
}

function closeSpineModal() {
  document.getElementById("spineModal").style.display = "none";
  document.getElementById("spineForm").reset();
}

// ========================================
// EDITOR FUNCTIONS
// ========================================
function updateToggleButtonPosition() {
  const button = document.querySelector(".fullscreen-toggle");
  if (button && editor) {
    const lineCount = editor.lineCount();
    button.style.right = lineCount > 19 ? "16px" : "8px";
  }
}

function toggleFullScreenEditor() {
  document.body.classList.toggle("fullscreen");
  if (editor) editor.refresh();
}

// ========================================
// SECTION NAVIGATION
// ========================================
function showSection(id) {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.remove("show");
  removeOverlay();

  // Hide all sections
  document.querySelectorAll(".section").forEach((sec) => {
    sec.classList.remove("active");
  });

  // Show selected section
  const targetSection = document.getElementById(id);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Update active menu
  document.querySelectorAll(".menu a").forEach((link) => {
    link.classList.remove("active");
  });

  const activeLink = Array.from(document.querySelectorAll(".menu a")).find(
    (link) => link.getAttribute("onclick")?.includes(id)
  );
  if (activeLink) {
    activeLink.classList.add("active");
  }

  // Load data based on section
  switch (id) {
    case 'users':
      fetchUsers();
      break;
    case 'projects':
      fetchProjects();
      break;
    case 'images':
      loadImages();
      break;
    case 'spritesheet':
      loadSpriteSheet();
      break;
    case 'audio':
      loadAudio();
      break;
    case 'particle':
      loadParticle();
      break;
    case 'spine':
      loadSpine();
      break;
  }
}

// ========================================
// ASSETS MENU
// ========================================
function openAssetsMenu() {
  document.getElementById("main-menu").classList.add("hidden");
  document.getElementById("assets-submenu").classList.remove("hidden");
  showSection("images");
}

function backToMainMenu() {
  document.getElementById("assets-submenu").classList.add("hidden");
  document.getElementById("main-menu").classList.remove("hidden");
  showSection("users");
}

// ========================================
// LOAD ASSETS FUNCTIONS
// ========================================
async function loadImages() {
  try {
    const res = await fetch("/images");
    const images = await res.json();

    const tbody = document.querySelector("#imageTable tbody");
    tbody.innerHTML = "";

    for (const img of images) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${img.name}</td>
        <td><img src="/image/${img.id}" style="max-height: 50px;"></td>
        <td>${img.slug || "-"}</td>
        <td>
          <button onclick="deleteImage('${img.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error("❌ Error loading images:", err);
  }
}

async function deleteImage(id) {
  if (!confirm("Yakin mau hapus gambar ini?")) return;
  
  try {
    await fetch(`/image/${id}`, { method: "DELETE" });
    loadImages();
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus image");
  }
}

async function loadSpriteSheet() {
  try {
    const res = await fetch("/spritesheet");
    const spritesheet = await res.json();
    const tbody = document.querySelector("#spritesheetTable tbody");
    tbody.innerHTML = "";

    for (const sprite of spritesheet) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sprite.filename}</td>
        <td><img src="/spritesheet/${sprite.id}" width="250" /></td>
        <td>${sprite.slug}</td>
        <td>W: ${sprite.width}<br>H: ${sprite.height}</td>
        <td>
          <button onclick="deleteSprite('${sprite.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error("❌ Error loading spritesheet:", err);
  }
}

async function deleteSprite(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus sprite ini?")) return;

  try {
    const res = await fetch(`/spritesheet/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal menghapus sprite");
    loadSpriteSheet();
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus sprite");
  }
}

async function loadAudio() {
  try {
    const res = await fetch("/audios");
    const audios = await res.json();
    const tbody = document.querySelector("#audioTable tbody");
    tbody.innerHTML = "";

    for (const audio of audios) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${audio.filename}</td>
        <td>
          <audio controls>
            <source src="/audio/${audio.id}" type="audio/mpeg" />
          </audio>
        </td>
        <td>${audio.slug}</td>
        <td>
          <button onclick="deleteAudio('${audio.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error("❌ Error loading audio:", err);
  }
}

async function deleteAudio(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus audio ini?")) return;

  try {
    const res = await fetch(`/audio/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal menghapus audio");
    loadAudio();
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus audio");
  }
}

async function loadParticle() {
  try {
    const res = await fetch("/particle");
    const particles = await res.json();
    const tbody = document.querySelector("#particleTable tbody");
    tbody.innerHTML = "";

    for (const ptc of particles) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ptc.img_filename}</td>
        <td>
          <img src="/particle/image/${ptc.slug}/${ptc.img_filename}" width="160" />
        </td>
        <td>
          <a href="/particle/json/${ptc.slug}/${ptc.json_filename}" target="_blank">📄 JSON</a>
        </td>
        <td>${ptc.slug}</td>
        <td>
          <button onclick="deleteParticle('${ptc.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error("❌ Error loading particle:", err);
  }
}

async function deleteParticle(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus particle ini?")) return;

  try {
    const res = await fetch(`/particle/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal menghapus particle");
    loadParticle();
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus particle");
  }
}

async function loadSpine() {
  try {
    const res = await fetch("/spine");
    if (!res.ok) throw new Error("Gagal memuat data spine");

    const atlas = await res.json();
    const tbody = document.querySelector("#spineTable tbody");
    tbody.innerHTML = "";

    atlas.forEach((ats) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ats.img_filename}</td>
        <td>
          <img src="/spine/image/${ats.slug}/${ats.img_filename}" width="150" />
        </td>
        <td>
          <a href="/spine/json/${ats.slug}/${ats.json_filename}" target="_blank">📄 JSON</a>
        </td>
        <td>
          <a href="/spine/atlas/${ats.slug}/${ats.atlas_filename}" target="_blank">🔗 Atlas</a>
        </td>
        <td>${ats.slug}</td>
        <td>
          <button onclick="deleteSpine('${ats.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("❌ Error loading spine:", error);
  }
}

async function deleteSpine(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus spine ini?")) return;

  try {
    const res = await fetch(`/spine/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Gagal menghapus spine");
    loadSpine();
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Gagal menghapus spine");
  }
}

// ========================================
// MOBILE MENU
// ========================================
function toggleMobileMenu() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("show");

  if (sidebar.classList.contains("show")) {
    createOverlay();
    document.body.style.overflow = "hidden";
  } else {
    removeOverlay();
    document.body.style.overflow = "";
  }
}

function createOverlay() {
  if (document.querySelector(".mobile-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "mobile-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.5); z-index: 999; display: block;
  `;
  overlay.addEventListener("click", closeMobileMenu);
  document.body.appendChild(overlay);
}

function removeOverlay() {
  const overlay = document.querySelector(".mobile-overlay");
  if (overlay) overlay.remove();
}

function closeMobileMenu() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.remove("show");
  removeOverlay();
  document.body.style.overflow = "";
}

// Window resize handler
window.addEventListener("resize", function () {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

// ========================================
// PAGE LOAD
// ========================================
window.addEventListener("load", () => {
  const hash = window.location.hash;
  const sectionId = hash ? hash.replace("#", "") : "users";
  showSection(sectionId);
  
  updateToggleButtonPosition();
  console.log("✅ Dashboard loaded successfully");
});