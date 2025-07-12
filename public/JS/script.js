(async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    alert("Slug tidak ditemukan di URL.");
    return;
  }

  try {
    const res = await fetch(`/game/${slug}`);
    if (!res.ok) throw new Error("Gagal mengambil game.");
    const gameData = await res.json();

    // Asumsikan gameData.fullCode berisi seluruh kode game dalam string
    const gameScript = document.createElement("script");
    gameScript.type = "text/javascript";
    gameScript.textContent = gameData.fullCode;
    document.body.appendChild(gameScript);

  } catch (err) {
    console.error("Error saat load game:", err);
    alert("Gagal memuat game.");
  }
})();
