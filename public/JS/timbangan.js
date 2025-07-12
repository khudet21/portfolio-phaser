const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#f0e5cf',
    scene: {
      preload,
      create,
      update
    }
  };
  
  const game = new Phaser.Game(config);
  
  let level = 0;
  let targetWeights = [75, 225, 275, 150, 325]; // 5 soal
  let currentWeight = 0;
  let weightText, targetText, resultText;
  let dropZone;
  let weightOptions = [25, 50, 100, 200, 400];
  let draggableGroup;
  let mixButton;
  let scaleBeam;
  
  function preload() {
    this.load.image('pot', 'https://i.imgur.com/MB2vL6X.png');
    this.load.image('weight', 'https://i.imgur.com/X9i1cKP.png');
    this.load.image('beam', 'https://i.imgur.com/2ddOlTa.png'); // Palang timbangan
  }
  
  function create() {
    const scene = this;
  
    // TIMBANGAN
    scaleBeam = this.add.image(400, 300, 'beam').setOrigin(0.5, 0.5).setScale(0.6);
  
    // Drop zone (di atas panci tapi invisible)
    dropZone = this.add.zone(400, 330, 150, 80).setRectangleDropZone(150, 80);
    this.add.graphics().lineStyle(2, 0x000000).strokeRectShape(dropZone);
  
    // Panci ramuan
    this.add.image(400, 360, 'pot').setScale(0.5);
  
    // Teks target dan berat
    targetText = this.add.text(50, 30, '', { fontSize: '24px', color: '#000' });
    weightText = this.add.text(50, 70, '', { fontSize: '24px', color: '#000' });
    resultText = this.add.text(400, 500, '', { fontSize: '28px', color: '#333' }).setOrigin(0.5);
  
    // Grup bobot
    draggableGroup = this.add.group();
  
    // Buat bobot DND
    weightOptions.forEach((value, index) => {
      const x = 100 + index * 130;
      const y = 520;
  
      // Tampilan bobot aslinya (tetap)
      this.add.image(x, y, 'weight').setScale(0.15);
      this.add.text(x - 20, y + 30, `${value}g`, { fontSize: '18px', color: '#000' });
  
      // Area klik: duplikat untuk diseret
      const dragClone = this.add.image(x, y, 'weight').setScale(0.15).setInteractive({ draggable: true });
      dragClone.setData('value', value);
      this.input.setDraggable(dragClone);
      draggableGroup.add(dragClone);
    });
  
    // Drag & Drop logika
    this.input.on('dragstart', (pointer, gameObject) => {
      // duplikat ketika mulai drag
      const clone = scene.add.image(gameObject.x, gameObject.y, 'weight').setScale(0.15).setInteractive();
      clone.setData('value', gameObject.getData('value'));
      clone.setDepth(1);
      scene.input.setDraggable(clone);
      gameObject.setVisible(false); // sembunyikan clone source
    });
  
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
  
    this.input.on('drop', (pointer, gameObject, dropZone) => {
      currentWeight += gameObject.getData('value');
      weightText.setText(`Total berat: ${currentWeight}g`);
      updateScaleVisual();
      gameObject.disableInteractive();
    });
  
    this.input.on('dragend', (pointer, gameObject, dropped) => {
      if (!dropped) {
        gameObject.destroy(); // hapus jika tidak dijatuhkan di dropzone
      }
    });
  
    // Tombol Campur
    mixButton = this.add.text(600, 70, 'Campur 🔥', {
      fontSize: '24px',
      backgroundColor: '#28a745',
      color: '#fff',
      padding: { x: 10, y: 5 }
    }).setInteractive();
  
    mixButton.on('pointerdown', () => {
      checkAnswer();
    });
  
    startLevel();
  }
  
  function startLevel() {
    if (level >= targetWeights.length) {
      targetText.setText('🎉 Semua ramuan berhasil dicampur!');
      resultText.setText('');
      mixButton.disableInteractive().setAlpha(0.5);
      return;
    }
  
    currentWeight = 0;
    weightText.setText('Total berat: 0g');
    resultText.setText('');
    targetText.setText(`🎯 Target campuran: ${targetWeights[level]}g`);
  
    // Reset timbangan visual
    scaleBeam.setRotation(0);
  
    // Hapus bobot yang tersisa di area drop
    draggableGroup.getChildren().forEach(child => {
      child.setVisible(true);
      child.setPosition(child.input.dragStartX, child.input.dragStartY);
    });
  }
  
  function checkAnswer() {
    if (currentWeight === targetWeights[level]) {
      resultText.setText('✅ Benar! Campuran pas!');
      level++;
      setTimeout(() => startLevel(), 1000);
    } else {
      resultText.setText('❌ Salah. Coba lagi!');
      setTimeout(() => startLevel(), 1000);
    }
  }
  
  function updateScaleVisual() {
    const target = targetWeights[level];
    const diff = currentWeight - target;
    const maxTilt = 0.35; // max rotation angle (rad)
    const maxDiff = 150; // asumsi max beda 150g
    const rotation = Phaser.Math.Clamp(diff / maxDiff, -1, 1) * maxTilt;
    scaleBeam.setRotation(rotation);
  }
  
  function update() {}
  