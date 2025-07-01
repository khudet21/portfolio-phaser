// konfigurasi phaser-------------------------
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 700 },
      debug: true,
    },
  },
  plugins: {
    scene: [
      { key: "SpinePlugin", plugin: window.SpinePlugin, mapping: "spine" },
    ],
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

// GLOBAL VARIABLE
let X_POSITION, Y_POSITION, relativeSize;
let gap = 0;
let monkey;
let idGap = 0;
let speedTree = 7;
let acak_y;
let path;
let timer = 0;
let scaleTree = 1;
let countTree = 0;
let isGameRunning = true;
let obstacleTimer;
let darknessLayer;
let arrObstc = [];
let isReadyToJump = false;
const layoutSize = { w: 1024, h: 768 };

function preload() {
  for (let i = 1; i < 5; i++) {
    this.load.image("BG" + i, "/flapAsset/BG" + i + ".png");
  }

  this.load.image("tree", "/flapAsset/tree.png");
  this.load.image("treeLoop", "/flapAsset/treeLoop.png");
  this.load.image("treeStamp", "/flapAsset/treeStamp.png");

  this.load.spritesheet("walkMonkey", "/flapAsset/WalkMonkey.png", {
    frameWidth: 93.48,
    frameHeight: 115,
  });

  this.load.image("particleEffect", "/flapAsset/treeStamp.png"); // Ganti dengan path gambar partikel yang sesuai
}

function create() {
  const canvasWidth = this.scale.gameSize.width;
  const canvasHeight = this.scale.gameSize.height;

  X_POSITION = {
    LEFT: 0,
    CENTER: canvasWidth / 2,
    RIGHT: canvasWidth,
  };

  Y_POSITION = {
    TOP: 0,
    CENTER: canvasHeight / 2,
    BOTTOM: canvasHeight,
  };

  relativeSize = {
    w: (canvasWidth - layoutSize.w) / 2,
    h: (canvasHeight - layoutSize.h) / 2,
  };

  arrObstc = [];
  this.arrBg = [];
  this.arrTree = [];
  let activeScene = this;
  this.platforms = this.physics.add.staticGroup();
  this.platTree = this.physics.add.group();

  const texture = this.textures.get("BG1");
  const frame = texture.getSourceImage();
  const scaleX = canvasWidth / frame.width;
  const scaleY = canvasHeight / frame.height;
  const bgScale = Math.max(scaleX, scaleY);

  // Background parallax
  for (let i = 1; i <= 3; i++) {
    let layer = [];
    const jumlahBg = Math.ceil(canvasWidth / (frame.width * bgScale)) + 1;

    for (let j = 0; j < jumlahBg; j++) {
      const bg = this.add
        .image(j * frame.width * bgScale, -310 * bgScale, "BG" + i)
        .setOrigin(0, -0.1)
        .setDepth(-i)
        .setScale(bgScale)
        .setData("speed", 2 / i);

      layer.push(bg);
    }

    this.arrBg.push(layer);
  }

  // Animasi dan monkey
  this.anims.create({
    key: "walk",
    frames: this.anims.generateFrameNumbers("walkMonkey"),
    frameRate: 16,
  });

  this.physics.world.setBounds(-1000, 0, canvasWidth + 1000, canvasHeight);

  monkey = this.physics.add
    .sprite(-900, canvasHeight * 0.5 + 500, "walkMonkey")
    .setScale(bgScale * 1.7)
    .setDepth(8)
    .setCollideWorldBounds(true);

  monkey.body.setGravityY(50);
  monkey.body.setAllowGravity(false);
  monkey.play({ key: "walk", repeat: -1 });

  this.tweens.add({
    targets: monkey,
    ease: "Linear",
    duration: 3050,
    x: canvasWidth * 0.15,
    onComplete: function () {
      monkey.setVelocityY(0);
      monkey.body.setAllowGravity(true);
      isReadyToJump = true;
    },
  });

  this.cursors = this.input.keyboard.createCursorKeys();

  this.input.on("pointerup", () => {
    if (isReadyToJump && monkey.body.onFloor()) {
      monkey.setVelocityY(-canvasHeight * 0.53);
    }
  });

  this.groundTiles = this.physics.add.staticGroup();
  this.obstacles = this.physics.add.group();

  obstacleTimer = this.time.addEvent({
    delay: 2500,
    loop: true,
    callback: () => {
      const random = Phaser.Math.Between(0, 3); // Nilai antara 0 hingga 3 untuk jenis obstacle dan halangan
      let obstacle;
  
      // Cek apakah obstacle muncul atau halangan
      if (random === 0) {
        // Muncul obstacle (tree)
        obstacle = this.obstacles.create(
          canvasWidth + 100,
          Y_POSITION.BOTTOM - 70,
          "treeStamp"
        );
        obstacle.setVelocityX(-270);
        obstacle.setImmovable(true);
        obstacle.body.allowGravity = false;
        arrObstc.push(obstacle);
        
        // Tidak ada halangan jika obstacle muncul
        return;
      } else {
        // Muncul halangan (air, api, atau lumpur)
        let halangan;
        let color; // Untuk menentukan jenis halangan
  
        if (random === 1) {
          color = 0x3399ff; // Air (blue)
        } else if (random === 2) {
          color = 0xff4500; // Api (orange-red)
        } else {
          color = 0x006400; // Lumpur (green)
        }
  
        // Buat halangan dengan warna yang sesuai
        halangan = activeScene.add.rectangle(
          canvasWidth + 100,
          Y_POSITION.BOTTOM - 25, // Posisikan halangan sedikit lebih tinggi dari bawah
          120, // Lebar halangan
          50, // Tinggi halangan
          color
        );
  
        activeScene.physics.add.existing(halangan); // Tambahkan physics
        halangan.body.setVelocityX(-270); // Kecepatan halangan
        halangan.body.setImmovable(true); // Halangan tidak bergerak
        halangan.body.allowGravity = false; // Halangan tidak terpengaruh gravitasi
  
        // activeScene.halanganGroup.add(halangan); // Tambahkan ke grup halangan
  
        // Pijakan di atas halangan
        const pijakan = this.add.rectangle(
          halangan.x,
          halangan.y - 25, // Tempatkan pijakan sedikit di atas halangan
          120, // Lebar pijakan
          20, // Tinggi pijakan
          0xaaaaaa // Warna pijakan (abu-abu)
        );
  
        this.physics.add.existing(pijakan); // Tambahkan objek pijakan ke sistem fisika
        pijakan.body.setVelocityX(-270); // Kecepatan pijakan sama dengan halangan
        pijakan.body.setImmovable(true); // Pijakan tidak bergerak
  
        // Sinkronisasi posisi pijakan dengan halangan
        this.time.addEvent({
          delay: 16,
          loop: true,
          callback: () => {
            pijakan.x = halangan.x;
          },
        });
  
        // Tambahkan pijakan ke grup pijakan
        // this.pijakanGroup.add(pijakan);
        arrObstc.push(halangan); // Tambahkan halangan ke grup obstacle
      }
    },
  });  

  this.physics.add.collider(monkey, this.pijakanGroup); // Monyet bisa injak

  this.physics.add.collider(monkey, this.platforms);
  this.physics.add.collider(monkey, this.groundTiles);
  this.physics.add.collider(monkey, this.obstacles, gameOver, null, this);
}

function update() {
  const canvasWidth = this.scale.gameSize.width;
  const canvasHeight = this.scale.gameSize.height;

  if (isGameRunning) {
    // Background parallax
    this.arrBg.forEach((layer) => {
      const speed = layer[0].getData("speed");
      layer.forEach((bg) => {
        bg.x -= speed;
        if (bg.x <= -bg.displayWidth) {
          const maxX = Math.max(...layer.map((e) => e.x));
          bg.x = maxX + bg.displayWidth - 5;
        }
      });
    });
  }
}

function gameOver(monkey, obstacle) {
  if (!isGameRunning) return;
  isGameRunning = false;
  isReadyToJump = false;
  monkey.setVelocity(0, 0);
  monkey.anims.pause();
  monkey.setFrame(0);

  let delayPromises = [];

  arrObstc.forEach((obstacle, index) => {
    obstacle.setVelocityX(0);

    const destroyObstaclePromise = new Promise((resolve) => {
      setTimeout(() => {
        createExplosionEffect(this, obstacle.x, obstacle.y);
        obstacle.destroy();
        resolve();
      }, index * 700);
    });

    delayPromises.push(destroyObstaclePromise);
  });

  Promise.all(delayPromises).then(() => {
    darknessLayer = this.add.graphics().setDepth(15);
    darknessLayer.fillStyle(0x000000, 0.5);
    darknessLayer.fillRect(0, 0, this.scale.width, this.scale.height);

    this.tweens.add({
      targets: darknessLayer,
      alpha: 1,
      duration: 1200,
      ease: "Linear",
      onComplete: () => {
        arrObstc = [];

        // === Teks Game Over ===
        const gameOverText = this.add
          .text(
            this.scale.width / 2,
            this.scale.height / 2 - 100,
            "GAME OVER",
            {
              fontFamily: "Arial",
              fontSize: "64px",
              color: "#ffffff",
              stroke: "#ff0000",
              strokeThickness: 6,
            }
          )
          .setOrigin(0.5)
          .setDepth(20);

        const restartText = this.add
          .text(
            this.scale.width / 2,
            this.scale.height / 2 + 20,
            "Tap untuk main lagi",
            {
              fontFamily: "Arial",
              fontSize: "32px",
              color: "#ffffff",
            }
          )
          .setOrigin(0.5)
          .setDepth(20);

        // Input restart
        this.input.once("pointerup", () => {
          setTimeout(() => {
            this.scene.restart(); // Restart scene
            isGameRunning = true;
          }, 1050);
        });
      },
    });
  });

  if (obstacleTimer) obstacleTimer.remove();
  console.log("Game Over!");
}

function createExplosionEffect(scene, x, y) {
  const particles = scene.add.particles("particleEffect"); // scene merujuk pada konteks yang benar
  const emitter = particles.createEmitter({
    speed: 100,
    scale: { start: 1, end: 0 },
    blendMode: Phaser.BlendModes.NORMAL,
    gravityY: 300,
    lifespan: 500,
    quantity: 10,
    x: x,
    y: y,
    on: false,
  });

  emitter.explode(10, x, y); // Mengeksplosikan partikel pada posisi obstacle
}
