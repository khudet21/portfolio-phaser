// Template Game: Menonton Bioskop
// Library: Phaser.js (Versi 3)

let config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#ffffff',
    scene: {
        preload: preload,
        create: create
    }
};

let game = new Phaser.Game(config);

function preload() {
    this.load.image('bg', 'assets/bg_bioskop.png');
    this.load.image('coin_100', 'assets/coin_100.png');
    this.load.image('coin_500', 'assets/coin_500.png');
    this.load.image('coin_1000', 'assets/coin_1000.png');
    this.load.image('slot', 'assets/slot.png');
    this.load.image('film_1', 'assets/film_1.png');
    this.load.image('film_2', 'assets/film_2.png');
    this.load.image('film_3', 'assets/film_3.png');
    this.load.image('pop_mini', 'assets/pop_mini.png');
    this.load.image('pop_medium', 'assets/pop_medium.png');
    this.load.image('pop_large', 'assets/pop_large.png');
    this.load.image('ice_cream', 'assets/ice_cream.png');
    this.load.image('jelly', 'assets/jelly.png');
    this.load.image('snack', 'assets/snack.png');
    this.load.image('seat_front', 'assets/seat_front.png');
    this.load.image('seat_mid', 'assets/seat_mid.png');
    this.load.image('seat_back', 'assets/seat_back.png');
    this.load.image('btn_next', 'assets/btn_next.png');
}


function create() {
    let currentSoal = 0;
    let soalData = [];
    this.add.image(640, 360, 'bg');

    soalData = [
        soalUrutKoin.bind(this),
        soalPilihFilm.bind(this),
        soalPopcorn.bind(this),
        soalDesert.bind(this),
        soalPilihBangku.bind(this)
    ];

    this.btnNext = this.add.image(1150, 650, 'btn_next').setInteractive();
    this.btnNext.on('pointerdown', () => {
        currentSoal++;
        if (currentSoal < soalData.length) {
            this.children.removeAll();
            this.add.image(640, 360, 'bg');
            this.btnNext = this.add.image(1150, 650, 'btn_next').setInteractive();
            this.btnNext.on('pointerdown', () => this.scene.restart());
            soalData[currentSoal]();
        }
    });

    soalData[currentSoal]();
    
    function soalUrutKoin() {
        this.add.text(100, 50, 'Urutkan koin dari yang terkecil ke terbesar', { fontSize: '24px', fill: '#000' });
        const coins = ['coin_100', 'coin_500', 'coin_1000'];
        Phaser.Utils.Array.Shuffle(coins);
        coins.forEach((key, i) => {
            const sprite = this.add.image(200 + i * 150, 150, key).setInteractive();
            this.input.setDraggable(sprite);
        });
        for (let i = 0; i < 3; i++) {
            this.add.image(200 + i * 150, 300, 'slot');
        }
    }
    
    function soalPilihFilm() {
        this.add.text(100, 50, 'Pilih film dan bayar dengan koin', { fontSize: '24px', fill: '#000' });
        this.add.image(300, 300, 'film_1').setInteractive();
        this.add.image(640, 300, 'film_2').setInteractive();
        this.add.image(980, 300, 'film_3').setInteractive();
        // Tambah coin juga
    }
    
    function soalPopcorn() {
        this.add.text(100, 50, 'Pilih popcorn dan bayar dengan koin', { fontSize: '24px', fill: '#000' });
        this.add.image(300, 300, 'pop_mini').setInteractive();
        this.add.image(640, 300, 'pop_medium').setInteractive();
        this.add.image(980, 300, 'pop_large').setInteractive();
        // Tambah coin juga
    }
    
    function soalDesert() {
        this.add.text(100, 50, 'Pilih dessert dan bayar dengan koin', { fontSize: '24px', fill: '#000' });
        this.add.image(300, 300, 'ice_cream').setInteractive();
        this.add.image(640, 300, 'jelly').setInteractive();
        this.add.image(980, 300, 'snack').setInteractive();
        // Tambah coin juga
    }
    
    function soalPilihBangku() {
        this.add.text(100, 50, 'Pilih tempat duduk dan bayar dengan koin', { fontSize: '24px', fill: '#000' });
        this.add.image(300, 300, 'seat_front').setInteractive();
        this.add.image(640, 300, 'seat_mid').setInteractive();
        this.add.image(980, 300, 'seat_back').setInteractive();
        // Tambah coin juga
    }
}
