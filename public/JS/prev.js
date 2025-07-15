// Logic game Flappy Horse
function createFlappyHorseGame(config) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    backgroundColor: "#87CEEB",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 600 },
        debug: false,
      },
    },
    scene: {
      preload,
      create,
      update,
    },
    ...config,
  });

  let horse;
  let cursors;
  let pipes;
  let score = 0;
  let scoreText;
  let gameOver = false;

  function preload() {}

  function create() {
    horse = this.add.rectangle(100, 300, 40, 30, 0x8b4513);
    this.physics.add.existing(horse);
    horse.body.setCollideWorldBounds(true);

    pipes = this.physics.add.group();
    this.time.addEvent({
      delay: 1500,
      callback: addPipePair,
      callbackScope: this,
      loop: true,
    });

    scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "20px",
      fill: "#000",
    });

    this.physics.add.collider(horse, pipes, hitPipe, null, this);

    this.input.on("pointerdown", flap);
    cursors = this.input.keyboard.createCursorKeys();
  }

  function update() {
    if (gameOver) return;

    if (cursors.space.isDown) flap();

    pipes.getChildren().forEach((pipe) => {
      if (pipe.x + pipe.width < 0) {
        pipe.destroy();
        if (pipe.scored !== false) {
          score += 0.5;
          scoreText.setText("Score: " + Math.floor(score));
          pipe.scored = false;
        }
      }
    });
  }

  function flap() {
    if (!gameOver) {
      horse.body.setVelocityY(-250);
    }
  }

  function addPipePair() {
    const gap = 120;
    const minPipeHeight = 50;
    const maxPipeHeight = 400;
    const topHeight = Phaser.Math.Between(minPipeHeight, maxPipeHeight - gap);

    const bottomY = topHeight + gap;

    const topPipe = this.add.rectangle(400, topHeight / 2, 40, topHeight, 0x228b22);
    const bottomPipe = this.add.rectangle(400, bottomY + (600 - bottomY) / 2, 40, 600 - bottomY, 0x228b22);

    this.physics.add.existing(topPipe);
    this.physics.add.existing(bottomPipe);

    topPipe.body.setVelocityX(-200);
    bottomPipe.body.setVelocityX(-200);

    topPipe.body.immovable = true;
    bottomPipe.body.immovable = true;

    topPipe.scored = true; // hanya 1 dari pasangan pipe yang nambah skor
    pipes.add(topPipe);
    pipes.add(bottomPipe);
  }

  function hitPipe() {
    gameOver = true;
    this.physics.pause();
    horse.setFillStyle(0xff0000);
    scoreText.setText("Game Over! Final Score: " + Math.floor(score));
  }
}
