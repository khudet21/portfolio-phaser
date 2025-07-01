  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#f4f4f4",
    scene: {
      preload: preload,
      create: create,
    }
  };

  const game = new Phaser.Game(config);

  function preload() {}

  function create() {
    const scene = this;
    const startX = 100;
    const startY = 100;
    const cellSize = 70;

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();

    const selectedText = scene.add.text(100, 550, 'Klik tanggal untuk info', {
      fontSize: '24px',
      color: '#333'
    });

    const titleText = scene.add.text(300, 30, '', {
      fontSize: '32px',
      color: '#333',
    });

    let dateGroup = scene.add.group();

    function renderCalendar(year, month) {
      dateGroup.clear(true, true);

      titleText.setText(`${monthNames[month]} ${year}`);

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();

      for (let date = 1; date <= daysInMonth; date++) {
        const col = (firstDay + date - 1) % 7;
        const row = Math.floor((firstDay + date - 1) / 7);

        const x = startX + col * cellSize;
        const y = startY + row * cellSize;

        const isToday = date === today.getDate() && month === today.getMonth() && year === today.getFullYear();

        const rect = scene.add.rectangle(x, y, cellSize - 5, cellSize - 5, isToday ? 0xffc107 : 0xffffff).setOrigin(0);
        const dateText = scene.add.text(x + 20, y + 15, date.toString(), {
          fontSize: '18px',
          color: '#000'
        });

        rect.setInteractive();
        rect.on('pointerdown', () => {
          selectedText.setText(`Tanggal dipilih: ${date} ${monthNames[month]} ${year}`);
        });

        dateGroup.add(rect);
        dateGroup.add(dateText);
      }
    }

    renderCalendar(currentYear, currentMonth);

    // Tombol Next
    const nextBtn = scene.add.text(700, 40, 'Next ▶', {
      fontSize: '20px',
      backgroundColor: '#007bff',
      color: '#fff',
      padding: { x: 10, y: 5 }
    }).setInteractive();

    nextBtn.on('pointerdown', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth);
    });

    // Tombol Prev
    const prevBtn = scene.add.text(50, 40, '◀ Prev', {
      fontSize: '20px',
      backgroundColor: '#007bff',
      color: '#fff',
      padding: { x: 10, y: 5 }
    }).setInteractive();

    prevBtn.on('pointerdown', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth);
    });
  }
