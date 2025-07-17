(async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    alert("Slug tidak ditemukan di URL.");
    return;
  }

  try {
    // 1. Ambil kode game dari database
    const gameRes = await fetch(`/game/${slug}`);
    if (!gameRes.ok) throw new Error("Gagal mengambil game.");
    const gameData = await gameRes.json();

    let fullCode = gameData.fullCode;

    // 2. Cek apakah butuh spritesheet
    const match = fullCode.match(/\/spritesheet\/\[SLUG\]\/([a-zA-Z0-9_\-\.]+\.png)/);
    if (match) {
      const filename = match[1]; // contoh: "ikanCoklat.png"

      // 3. Ambil metadata dari DB sesuai filename & slug
      const metaRes = await fetch(`/spritesheet/meta/${slug}/${filename}`);
      if (!metaRes.ok) throw new Error("Gagal ambil metadata spritesheet.");
      const data = await metaRes.json();

      // 4. Gantikan placeholder spritesheet
      fullCode = fullCode
        .replace(/\[SLUG\]/g, slug)
        .replace(/\[WIDTH\]/g, data.width)
        .replace(/\[HEIGHT\]/g, data.height);
    } else {
      // Gantikan hanya [SLUG] kalau tidak pakai sprite
      fullCode = fullCode.replace(/\[SLUG\]/g, slug);
    }

    // 5. Inject script
    const gameScript = document.createElement("script");
    gameScript.type = "text/javascript";
    gameScript.textContent = fullCode;
    document.body.appendChild(gameScript);
  } catch (err) {
    console.error("Error saat load game:", err);
    alert("Gagal memuat game.");
  }
})();
