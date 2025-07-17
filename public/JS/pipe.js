// konfigurasi phaser-------------------------
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

// Set your Global Variable here ..
let X_POSITION;
let Y_POSITION;
function preload() {
  this.load.image("bg", "../asset/Pipes/bg.png");
  this.load.image("lader", "../asset/Pipes/lader.png");
  this.load.image("bigPipe", "../asset/Pipes/bigPipe.png");
  this.load.image("connectPipe", "../asset/Pipes/connectPipe.png");
  this.load.image("faucetWater", "../asset/Pipes/faucetPipe.png");
  this.load.image("faucetPipe", "../asset/Pipes/faucetWater.png");
  this.load.image("pipe", "../asset/Pipes/pipe.png");
  this.load.image("pipeElbow", "../asset/Pipes/pipeElbow.png");
  this.load.image("rotatePipe", "../asset/Pipes/rotatePipe.png");
  this.load.image("selectPipe", "../asset/Pipes/selectPipe.png");
  this.load.image("circlePipe", "../asset/Pipes/circlePipe.png");
  this.load.image("recPipe", "../asset/Pipes/recPipe.png");
  this.load.image("lumutIjo", "../asset/Pipes/lumutIjo.png");
  // Load Spritesheet
  this.load.spritesheet("sps_mummy", "../asset/Pipes/ikanCoklat.png", {
    frameWidth: 151,
    frameHeight: 130,
  });
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

function create() {
  // Inisialisasi posisi X dan Y
  let X_POSITION = {
    LEFT: 0,
    CENTER: game.canvas.width / 2,
    RIGHT: game.canvas.width,
  };

  let Y_POSITION = {
    TOP: 0,
    CENTER: game.canvas.height / 2,
    BOTTOM: game,
  };

  let posLumut = [
    { x: 1000, y: 258.3422287808826 },
    { x: 518.4896672504378, y: 256.47039558242494 },
    { x: 350.02697022767074, y: 511.03971057266625 },
  ];
  shuffle(posLumut);

  const mummyAnimation = this.anims.create({
    key: "walk",
    frames: this.anims.generateFrameNumbers("sps_mummy"),
    frameRate: 16,
  });

  for (let i = 0; i < 5; i++) {
    const sprite = this.add
      .sprite(X_POSITION.CENTER - 300 + (i * 150), Y_POSITION.CENTER - 85, "sps_mummy")
      .setScale(2).setDepth(1.5);
    sprite.play({ key: "walk", repeat: -1 });
  }

  let myScene = this;
  let arrQuesPipe = [];
  let arrLineUp = [];
  let arrLineDown = [];
  let arrFaucet = [];
  let arrPipes = [];
  let arrSidePipes = [];

  //==All Object==//
  let arrBigPipe = [];
  let arrPipeWater = [];
  let arrMiniPipe = [];
  let arrSelcPipe = [];
  let arrPipesCon = [];

  // Bounding box dari objek
  const arrFauPos = [
    { x: 0, y: 70 },
    { x: 0, y: -8 },
  ];
  let fauX, fauY, conX, conY, level, bigPipeT, bigPipeB, pipeL;
  let dis = 35;
  level = 0;

  // Dapatkan ukuran canvas
  let canvasWidth = this.sys.game.config.width;
  let canvasHeight = this.sys.game.config.height;
  let BG = this.add
    .image(X_POSITION.CENTER, Y_POSITION.CENTER, "bg")
    .setDepth(1)
    .setScale(1, 1.2);
  let lumut = this.add
    .image(posLumut[0].x, posLumut[0].y, "lumutIjo")
    .setDepth(1.2);
  this.add
    .image(X_POSITION.CENTER, Y_POSITION.TOP + 100, "lader")
    .setDepth(1.1);

  // Hitung lebar bg setelah di-scale
  let bgWidth = BG.displayWidth;

  // Hitung sisa ruang di kiri dan kanan
  let sideWidth = (canvasWidth - bgWidth) / 2;

  // Tambahkan rectangle putih di kiri
  let leftRect = this.add.graphics();
  leftRect.fillStyle(0x76f1fe, 1); // warna putih
  leftRect.fillRect(0, 0, sideWidth, canvasHeight);
  leftRect.setDepth(1); // pastikan di bawah bg kalau perlu

  // Tambahkan rectangle putih di kanan
  let rightRect = this.add.graphics();
  rightRect.fillStyle(0x76f1fe, 1);
  rightRect.fillRect(canvasWidth - sideWidth, 0, sideWidth, canvasHeight);
  rightRect.setDepth(1);

  //==Inisialisasi Object==//
  function spawnBigPipe() {
    if (level < 1) {
      bigPipeT = myScene.add
        .image(X_POSITION.CENTER, Y_POSITION.TOP + 90, "bigPipe")
        .setDepth(1.3)
        .setScale(1.07, 1.15);
      let connectRT = myScene.add
        .image(
          bigPipeT.x - bigPipeT.width / 2 - 30,
          Y_POSITION.TOP + 90,
          "connectPipe"
        )
        .setDepth(1.3)
        .setScale(1.2)
        .setFlipX(true);
      let connectLT = myScene.add
        .image(
          bigPipeT.x + bigPipeT.width / 2 + 25,
          Y_POSITION.TOP + 90,
          "connectPipe"
        )
        .setDepth(1.3)
        .setScale(1.2);
      arrBigPipe.push(bigPipeT);
      arrBigPipe.push(connectRT);
      arrBigPipe.push(connectLT);
    }

    bigPipeB = myScene.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER - 13, "bigPipe")
      .setDepth(1.3)
      .setScale(1.07, 1.15);
    let connectRB = myScene.add
      .image(
        bigPipeB.x - bigPipeB.width / 2 - 30,
        Y_POSITION.CENTER - 11.8,
        "connectPipe"
      )
      .setDepth(1.3)
      .setScale(1.2)
      .setFlipX(true);
    let connectLB = myScene.add
      .image(
        bigPipeB.x + bigPipeB.width / 2 + 25,
        Y_POSITION.CENTER - 11,
        "connectPipe"
      )
      .setDepth(1.3)
      .setScale(1.2);

    let posY = [Y_POSITION.TOP + 90, bigPipeB.y];
    let countBigP = 2;

    if (level > 0) {
      countBigP = 1;
      posY.shift();

      arrLineUp = arrLineDown;
    }

    for (let j = 0; j < countBigP; j++) {
      let ySet = posY[j];

      for (let i = 0; i <= 19; i++) {
        // Posisi horizontal tergantung besar skala
        let startX = X_POSITION.CENTER - 397; // Atur sesuai panjang pipa
        let spacing = 41.5; // Jarak antar angka

        // Tambahkan angka
        let lblRurrel = myScene.add
          .text(startX + i * spacing, ySet, i.toString(), {
            font: "20px Arial",
            color: "#ffffff",
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(1.4);

        // Tambahkan garis skala (pakai rectangle tipis)
        let lineUp = myScene.add
          .rectangle(startX + i * spacing, ySet - 20 + 40, 2, 15, 0xffffff)
          .setDepth(1.4);
        let lineDown = myScene.add
          .rectangle(startX + i * spacing, ySet - 20, 2, 15, 0xffffff)
          .setDepth(1.4);

        if (j < 1) {
          arrLineUp.push(lineDown);
        } else if (j == 1) {
          arrLineDown.push(lineUp);
        }

        if (arrLineDown != null && arrLineUp != null) {
          arrQuesPipe.push(arrLineUp);
          arrQuesPipe.push(arrLineDown);
        } else {
          arrQuesPipe.push(arrLineDown);
        }

        arrBigPipe.push(lblRurrel);
        arrBigPipe.push(lineUp);
        arrBigPipe.push(lineDown);
      }
    }

    arrBigPipe.push(bigPipeB);
    arrBigPipe.push(connectRB);
    arrBigPipe.push(connectLB);

    setTimeout(function () {
      pipeWater();
    }, 50);
  }

  function pipeWater() {
    let randomQuest = 12; // Phaser.Math.Between(0, 19);
    let randomAns = 10;

    // if(randomQuest < 15 && randomQuest > 0 || randomQuest > 15 && randomQuest < 19){
    //     randomAns = randomQuest - Phaser.Math.Between(0, 5);
    // } else {
    //     randomAns = randomQuest + Phaser.Math.Between(0, 5);
    // }

    // if(randomAns <= 5){
    //     console.log(randomAns);
    //     randomAns = 7;
    //     console.log(randomAns);
    // } else if(randomAns >= 10){
    //     console.log(randomAns);
    //     randomAns = randomAns - 5;
    //     console.log(randomAns);
    // }

    let target1 = arrQuesPipe[0][randomQuest];
    let target2 = arrQuesPipe[1][randomAns];

    if (arrQuesPipe != null) {
      fauX = target1.x;
      fauY = target1.y + 50;

      conX = target2.x;
      conY = target2.y - 50;

      let faucetQuest = myScene.add
        .image(fauX, fauY, "faucetPipe")
        .setDepth(1.45)
        .setFlipY(true)
        .setData("active", true);
      let faucetConect = myScene.add
        .image(conX, conY, "faucetPipe")
        .setDepth(1.45)
        .setFlipY(false)
        .setData("active", true);

      let faucetWater = myScene.add
        .image(faucetQuest.x + 25, faucetQuest.y, "faucetWater")
        .setDepth(1.5)
        .setScale(0.8)
        .setFlipX(true);

      arrFaucet.push(faucetQuest);
      arrFaucet.push(faucetConect);
    }

    setTimeout(function () {
      spawnSelectPipe();
    }, 300);
  }

  function spawnMiniPipe(count, setX, setY) {
    if (count > 0) {
      dis = 25 * count;
    }

    let arrPipeMini = [];
    let pipeElbow = [];
    let pipeR = myScene.add
      .image(setX, setY, "pipeElbow")
      .setDepth(6)
      .setFlipX(true)
      .setFlipY(false)
      .setOrigin(0, 0.775)
      .setScale(0.8)
      .setInteractive()
      .setData("active", true)
      .setData("elbow", true)
      .setData("connect", true)
      .setData("rotate", true);
    myScene.input.setDraggable(pipeR);
    pipeElbow.push(pipeR);
    arrPipeMini.push(pipeR);

    for (let i = 0; i < count; i++) {
      let pipes = myScene.add
        .image(pipeR.x + 55.3 + i * 40, pipeR.y, "pipe")
        .setDepth(6)
        .setScale(0.8, 0.75)
        .setRotation(0)
        .setInteractive();
      myScene.input.setDraggable(pipes);
      arrPipeMini.push(pipes);
    }

    if (count > 0) {
      pipeL = myScene.add
        .image(
          arrPipeMini[arrPipeMini.length - 1].x + 17,
          pipeR.y + 22,
          "pipeElbow"
        )
        .setDepth(6)
        .setFlipX(false)
        .setFlipY(true)
        .setOrigin(0, 0.775)
        .setScale(0.8)
        .setInteractive()
        .setData("active", true)
        .setData("elbow", true)
        .setData("connect", false)
        .setData("rotate", true);
    } else {
      pipeL = myScene.add
        .image(pipeR.x + 35.2, pipeR.y + 22, "pipeElbow")
        .setDepth(6)
        .setFlipX(false)
        .setFlipY(true)
        .setOrigin(0, 0.775)
        .setScale(0.8)
        .setInteractive()
        .setData("active", true)
        .setData("elbow", true)
        .setData("connect", false)
        .setData("rotate", true);
    }

    let rotatePipe = myScene.add
      .image(pipeL.x + 30, pipeL.y - 24, "rotatePipe")
      .setDepth(6.3)
      .setScale(0.5)
      .setInteractive()
      .setData("state", true)
      .setData("rotate", false);

    myScene.input.setDraggable(pipeL);

    pipeElbow.push(rotatePipe);
    pipeElbow.push(pipeL);
    arrSidePipes.push(pipeElbow);

    arrPipeMini.push(pipeL);
    arrPipeMini.push(rotatePipe);
    arrPipes.push(arrPipeMini);

    console.log("semua pipe " + arrPipes.length);
    console.log("pipe elbow " + arrSidePipes.length);
  }

  function spawnSelectPipe() {
    let recPipe = myScene.add
      .image(X_POSITION.CENTER, Y_POSITION.CENTER + 100, "recPipe")
      .setDepth(1.3)
      .setScale(1.1, 1);

    for (let i = 0; i < 5; i++) {
      let selectPipe = myScene.add
        .image(X_POSITION.CENTER - 180 + 90 * i, recPipe.y, "selectPipe")
        .setDepth(1.4)
        .setInteractive()
        .setData("active", true)
        .setData("id", i);
      let cirPipe = myScene.add
        .image(selectPipe.x, selectPipe.y, "circlePipe")
        .setDepth(1.5)
        .setScale(0.8)
        .setData("active", false)
        .setData("id", i);
      let lblPipe = myScene.add
        .text(cirPipe.x - 7, cirPipe.y - 12, i + 1, {
          fontFamily: "Baloo 2",
          fontSize: "20px'",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
          shadow: {
            offsetX: 2,
            offsetY: 2,
            color: "#000",
            blur: 2,
            fill: true,
          },
        })
        .setDepth(1.55)
        .setData("active", false)
        .setData("id", i);

      arrSelcPipe.push(cirPipe);
      arrSelcPipe.push(lblPipe);
      arrSelcPipe.push(selectPipe);
    }
  }

  let targetBounds;
  let pos = 0;
  let boundsFau;

  //==User Input==//
  this.input.on(
    "gameobjectdown",
    function (pointer, gameObject) {
      let pipeRotate;
      for (let k = 0; k < arrSidePipes.length; k++) {
        for (let l = 0; l < arrSidePipes[k].length; l++) {
          pipeRotate = arrSidePipes[k][l];
          if (gameObject == pipeRotate) {
            if (pipeRotate.getData("state") == true) {
              arrSidePipes[k].forEach((obj) => {
                if (obj.getData("rotate") == true) {
                  if (obj.flipY == true) {
                    obj.setFlipY(false);
                    obj.y = obj.y - 22;
                    obj.setData("connect", true);
                  } else {
                    obj.setFlipY(true);
                    obj.y = obj.y + 22;
                    obj.setData("connect", false);
                  }
                }
              });
            }
          }
        }
      }

      const targetId = gameObject.getData("id");

      arrSelcPipe.forEach((obj) => {
        if (obj.getData("id") === targetId) {
          obj.setAlpha(0.7);
          if (obj.getData("active") === true) {
            spawnMiniPipe(obj.getData("id"), obj.x - 20, obj.y - 10);
            obj.disableInteractive();
            move();
          }
        }
      });
    },
    this
  );

  function move() {
    myScene.input.on("drag", function (pointer, gameObject, dragX, dragY) {
      arrPipes.forEach((pipeGroup) => {
        if (pipeGroup.includes(gameObject)) {
          let dx = dragX - gameObject.x;
          let dy = dragY - gameObject.y;

          pipeGroup.forEach((obj) => {
            obj.x += dx;
            obj.y += dy;
          });
        }
      });
    });

    myScene.input.on("dragstart", (pointer, gameObject) => {
      arrPipes.forEach((pipeGroup) => {
        if (pipeGroup.includes(gameObject)) {
          pipeGroup.forEach((obj) => {
            obj.setAlpha(0.7);
          });
        }
      });
    });

    myScene.input.on("dragend", (pointer, gameObject) => {
      arrPipes.forEach((pipeGroup) => {
        if (pipeGroup.includes(gameObject)) {
          pipeGroup.forEach((obj) => obj.setAlpha(1));

          for (let i = 0; i < pipeGroup.length; i++) {
            const pipe = pipeGroup[i];

            if (pipe.getData("connect") == true) {
              pos = 0;
            } else {
              pos = 1;
            }

            boundsFau = arrFaucet[pos];

            if (boundsFau.getData("active") == false) {
              boundsFau = pipe;
              console.log("bound berhasil ganti");
            }

            if (
              pipe.getData("elbow") == true &&
              boundsFau.getData("active") == true
            ) {
              targetBounds = boundsFau.getBounds();

              const pipeBounds = pipe.getBounds();

              if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                  pipeBounds,
                  targetBounds
                )
              ) {
                console.log("Salah satu pipa menyentuh keran!");

                // Hitung selisih posisi untuk geser seluruh grup
                let offsetX = targetBounds.x + arrFauPos[pos].x - pipe.x;
                let offsetY = targetBounds.y + arrFauPos[pos].y - pipe.y;

                console.log(" urut pos " + pos);

                // Geser seluruh group berdasarkan offset itu
                console.log("ini disX 1 " + arrFauPos[pos].x);
                console.log("ini disX 2 " + arrFauPos[pos].x);

                pipeGroup.forEach((obj) => {
                  obj.x += offsetX;
                  obj.y += offsetY;
                });

                offsetX = 0;
                offsetY = 0;

                console.log("offsetX " + offsetX);
                console.log("offsetY " + offsetY);
                arrPipesCon.push(pipeGroup);

                //Update state
                // pipe.setData("elbow", false);
                // boundsFau.setData("active", false);
                console.log(
                  "status faucet adalah " + boundsFau.getData("active")
                );

                // return; // setelah cocok, keluar
              } else {
                // boundsFau.setData("state", true);
                // console.log("status faucet adalah " + boundsFau.getData("state"));
              }
            }
          }
        }
      });
    });
  }

  //==Called Function==//
  spawnBigPipe();
}

//Animation
// function create(){

//     let myScene = this;
//     this.isMoving = true; // untuk memulai gerakan
//     this.jarakY = 700;
//     this.totalShift = 0;

// 	X_POSITION = {
//         "LEFT" : 0,
//         "CENTER" : game.canvas.width / 2,
//         "RIGHT" : game.canvas.width,
//     };

//     Y_POSITION = {
//         "TOP" : 0,
//         "CENTER" : game.canvas.height / 2,
//         "BOTTOM" : game.canvas.height,
//     };

// 	let bigPipeT, bigPipeB;

// 	this.level = 0;
// 	this.arrBigPipe = [];
// 	this.arrAnim = [];
// 	this.gerak = true;

// 	let jarakY = 0;

// 	this.spawnBigPipe = function(){

//         if(this.level > 0){
//             jarakY = Y_POSITION.BOTTOM + 96;
//         }

//     	let BG = myScene.add.image(X_POSITION.CENTER, Y_POSITION.CENTER + jarakY, "bg").setDepth(1).setScale(1.1, 1.2);
//     	let tangga = myScene.add.image(X_POSITION.CENTER, Y_POSITION.TOP + 100 + jarakY, "lader").setDepth(1.1);

//         bigPipeT = myScene.add.image(X_POSITION.CENTER, Y_POSITION.TOP + 90 + jarakY, "bigPipe").setDepth(1.3).setScale(1.15);
//         bigPipeB = myScene.add.image(X_POSITION.CENTER, Y_POSITION.CENTER - 11.8 + jarakY, "bigPipe").setDepth(1.3).setScale(1.15);

//         myScene.arrBigPipe.push(bigPipeT);
//         myScene.arrBigPipe.push(bigPipeB);

//         myScene.arrBigPipe.push(BG);
//         myScene.arrBigPipe.push(tangga);

//     }

// 	this.spawnBigPipe();

// 	this.arrAnim = this.arrBigPipe;

//   this.input.on("pointerdown", function (pointer) {
//     let lumut = myScene.add
//       .image(pointer.x, pointer.y, "lumutIjo")
//       .setDepth(1.3);

//     console.log("{ 'x': " + lumut.x + " ," + " 'y': " + lumut.y + " },");
//   });

// }

function update() {
  let myScene = this;
  // console.log("update terpanggil");
  // setTimeout(function () {
  //     if (myScene.level === 0 && !myScene.hasScheduled) {
  //         myScene.level = 1;
  //         myScene.hasScheduled = true; // mencegah pemanggilan berulang
  //         // Buat objek baru & simpan dalam arrBigPipe
  //         myScene.arrBigPipe = [];
  //         myScene.spawnBigPipe();
  //     }

  //     if(myScene.isMoving === true){
  //         // Gerakkan objek lama ke atas
  //         myScene.arrAnim.forEach(obj => {
  //             obj.y -= 2.5;
  //         });

  //         // Geser objek baru ke atas juga
  //         myScene.arrBigPipe.forEach(pip => {
  //             pip.y -= 2.5;
  //         });

  //         myScene.totalShift += 2.5;

  //         if (myScene.totalShift >= myScene.jarakY) {
  //             myScene.isMoving = false;
  //             console.log("Pergerakan selesai sejauh " + myScene.totalShift);
  //         }
  //     }

  // }, 3000);
}
