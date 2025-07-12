(async () => {
  // Ambil parameter dari URL
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    alert("Slug tidak ditemukan di URL.");
    return;
  }

  // Fetch data game dari server
  let gameData;
  try {
    const res = await fetch(`/game/${slug}`);
    if (!res.ok) throw new Error("Game tidak ditemukan atau server error.");
    gameData = await res.json();
  } catch (err) {
    alert(err.message);
    return;
  }

  // Set your Global Variable here ..

  
  // Siapkan loader preload dengan asset
  const preload = function () {
    if (Array.isArray(gameData.assets)) {
      for (let asset of gameData.assets) {
        switch (asset.type) {
          case "image":
            this.load.image(asset.key, asset.url);
            break;
          case "audio":
            this.load.audio(asset.key, asset.url);
            break;
          case "spine":
            this.load.spine(asset.key, {
              atlasURL: asset.atlas,
              jsonURL: asset.json,
              textureURL: asset.png,
            });
            break;
          case "script":
            this.load.script(asset.key, asset.url);
            break;
        }
      }
    }

    // Inject kode preload dari backend
    if (gameData.logic) {
      try {
        const preloadFn = new Function(gameData.logic + "; return preload;")();
        if (typeof preloadFn === "function") preloadFn.call(this);
      } catch (e) {
        console.error("Preload error:", e);
      }
    }
  };

  const create = function () {
    if (gameData.logic) {
      try {
        const createFn = new Function(gameData.logic + "; return create;")();
        if (typeof createFn === "function") createFn.call(this);
      } catch (e) {
        console.error("Create error:", e);
      }
    }
  };

  const update = function () {
    if (gameData.logic) {
      try {
        const updateFn = new Function(gameData.logic + "; return update;")();
        if (typeof updateFn === "function") updateFn.call(this);
      } catch (e) {
        console.error("Update error:", e);
      }
    }
  };

  // Konfigurasi Phaser
  const config = {
    type: Phaser.AUTO,
    width: 1336,
    height: 768,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: "game",
    },
    physics: {
      default: gameData.physics || "arcade",
      arcade: {
        gravity: { y: 700 },
        debug: true,
      },
      matter: {
        debug: true,
        gravity: { y: 1 },
      },
    },
    plugins: {
      scene: gameData.spine
        ? [{ key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" }]
        : [],
    },
    scene: { preload, create, update },
  };

  let game = new Phaser.Game(config);
})();
