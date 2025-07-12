document.addEventListener("DOMContentLoaded", () => {
  fetchUsers();
  fetchProjects();

  document
    .getElementById("add-user-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const res = await fetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      document.getElementById("add-user-status").innerText = data.message;
      fetchUsers();
      closeUserForm();
    });

  // Function to add a project to the table
  document
    .getElementById("projectForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const form = e.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      console.log("Data yang dikirim:", data);

      // Optional: ubah string fitur/teknologi menjadi format yang diinginkan (misal array atau string saja)
      // data.features = data.features.split(',').map(s => s.trim());
      // data.technologies = data.technologies.split(',').map(s => s.trim());

      fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Gagal simpan project");
          return res.json();
        })
        .then((project) => {
          closeProjectModal();
          form.reset();
          addProjectToTable(project); // fungsi untuk update tabel
        })
        .catch((err) => {
          console.error("Gagal kirim data:", err);
          alert("Gagal menyimpan project.");
        });
    });
});

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });
  document.getElementById(sectionId).classList.add("active");
  document
    .querySelectorAll(".menu a")
    .forEach((a) => a.classList.remove("active"));
  document
    .querySelector(`.menu a[onclick*='${sectionId}']`)
    .classList.add("active");
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
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td><button onclick="deleteUser(${user.id})">🗑️</button></td>
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
          <td>${project.id}</td>
          <td>${project.title}</td>
          <td>${project.genre}</td>
          <td>${project.release_date || "-"}</td>
          <td>${project.platforms}</td>
          <td><button onclick="deleteProject(${project.id})">🗑️</button></td>
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

function addProjectToTable(project) {
  const tbody = document.getElementById("projectTableBody");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${project.id || "-"}</td>
    <td>${project.title}</td>
    <td>${project.genre || "-"}</td>
    <td>${project.release_date || "-"}</td>
    <td>${project.platforms || "-"}</td>
    <td>
      <button onclick="editProject('${project.id}')">✏️</button>
      <button onclick="deleteProject('${project.id}')">🗑️</button>
    </td>
  `;

  tbody.appendChild(tr);
}

// Function to delete a project
function deleteProject(id) {
  if (!confirm("Hapus project ini?")) return;
  fetch(`/api/projects/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then(() => fetchProjects());
}

// Function to open the user form modal
function openUserForm() {
  // Kosongkan input form
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("add-user-status").innerText = "  ";
  document.getElementById("user-modal").style.display = "block";
}

function closeUserForm() {
  document.getElementById("user-modal").style.display = "none";
}

// Function to open the project modal
function openProjectModal() {
  document.getElementById("projectModal").style.display = "block";
}

function closeProjectModal() {
  document.getElementById("projectModal").style.display = "none";
}
