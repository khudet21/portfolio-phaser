# portfolio-phaser

-- CONFIGURATION PHASER.JS --

- create function
- update function
- preload function
- global variable
- physics arcade and metter
- ukuran thumbnail gambar adalah 850 x 480

---- path preload asset yang benar ----

1. Load Image
   /image/[SLUG]/pathImage

   contoh :
   this.load.image("bg", "/image/[SLUG]/bg.png");
   this.load.image("lader", "/image/[SLUG]/lader.png");

2. Load Spritesheet
   /spritesheet/[SLUG]/pathImage

   contoh :
   this.load.spritesheet("sprMummy", "/spritesheet/[SLUG]/ikanCoklat.png", {
   frameWidth: [WIDTH],
   frameHeight: [HEIGHT],
   });

3. Load Audio
   /audio/[SLUG]/pathAudio

   contoh:
   this.load.audio("touch", "/audio/[SLUG]/touch.mp3");

4. Load Particle JSON
   /particle/[SLUG]/pathParticle

   contoh:
   this.load.atlas("flares", "/particle/[SLUG]/flare.png", "/particle/[SLUG]/flare.json");

5. Load Spine
   /spine/[SLUG]/pathSpine

   contoh:
   this.load.spine(
      "NamaGambarSpine",
      "/spine/[SLUG]/coin-pro.json",
      "/spine/[SLUG]/coin-pro.atlas",
      true
   ); //file image, json, atlas
