import * as Phaser from 'phaser';

export class OfficeScene extends Phaser.Scene {
  constructor() { super('OfficeScene'); this.bloquejat = false; }
  preload() {
    this.load.tilemapTiledJSON('mapa', '/assets/maps/oficina.json');
    this.load.image('tiles_oficina', '/assets/tilesets/pixel_office.png');
    this.load.spritesheet('george', '/assets/sprites/george.png', { frameWidth: 48, frameHeight: 48 });
  }
  create() {
    const map = this.make.tilemap({ key: 'mapa' });
    const tiles = map.addTilesetImage('pixel_office', 'tiles_oficina');
    map.createLayer('Terra', tiles);
    const parets = map.createLayer('Parets', tiles);
    parets.setCollisionByProperty({ collides: true });
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.zones = [];
    let spawn = { x: 400, y: 485 };
    for (const obj of map.getObjectLayer('Objectes').objects) {
      const p = Object.fromEntries((obj.properties || []).map(p => [p.name, p.value]));
      if (p.tipus === 'spawn') spawn = obj;
      if (p.tipus === 'zona') {
        this.zones.push({ id: obj.id, nom: p.nomSala || 'Sala', titolMonitor: p.titolMonitor || p.nomSala, streamUrl: p.streamUrl || null, rect: new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width, obj.height) });
        this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height, 0x63bb9b, 0.055).setStrokeStyle(1, 0x66bd9d, 0.5);
        this.add.text(obj.x + 18, obj.y + 16, p.nomSala.toUpperCase(), { fontFamily: 'monospace', fontSize: '12px', color: '#334f4a', backgroundColor: '#ddeae4' }).setPadding(7, 5);
      }
    }
    this.decorar();
    this.jugador = this.physics.add.sprite(spawn.x, spawn.y, 'george', 0).setDepth(20);
    this.jugador.body.setSize(16, 12).setOffset(16, 32);
    this.jugador.setCollideWorldBounds(true);
    this.physics.add.collider(this.jugador, parets);
    this.direccio = 'avall'; this.frameQuiets = { avall: 0, esquerra: 1, amunt: 2, dreta: 3 };
    for (const [i, dir] of ['avall', 'esquerra', 'amunt', 'dreta'].entries()) {
      if (!this.anims.exists(`caminar-${dir}`)) this.anims.create({ key: `caminar-${dir}`, frames: [0, 1, 2, 3].map(n => ({ key: 'george', frame: n * 4 + i })), frameRate: 8, repeat: -1 });
    }
    this.etiqueta = this.add.text(spawn.x, spawn.y - 30, 'George · tu', { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff', backgroundColor: '#233d3b' }).setPadding(7, 4).setOrigin(0.5).setDepth(21);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.teclesWASD = this.input.keyboard.addKeys('W,A,S,D');
    this.zonaActual = null;
    this.input.keyboard.on('keydown', () => this.game.events.emit('interaccio'));
    this.game.events.emit('preparat');
    // Read-only state helps browser integration tests inspect actual physics.
    if (import.meta.env.DEV) window.__office = this;
    this.events.once('shutdown', () => { if (window.__office === this) delete window.__office; });
  }
  decorar() {
    const g = this.add.graphics();
    const rect = (x,y,w,h,c) => g.fillStyle(c).fillRoundedRect(x,y,w,h,4);
    const plant = (x,y) => { rect(x-9,y,18,14,0xaf7b55); g.fillStyle(0x448975).fillCircle(x,y-4,13).fillStyle(0x6ca585).fillCircle(x-5,y-9,8); };
    // Meeting table, chairs and wall monitor.
    for (const y of [144,226]) for (const x of [132,192,252]) { rect(x,y,28,27,0x375c61); rect(x+3,y+3,22,17,0x517b7c); }
    rect(115,177,194,53,0x9e7957); rect(119,177,186,46,0xd3b18b);
    rect(164,87,104,12,0x304a50); rect(170,89,92,6,0x8dc4bb);
    rect(185,193,28,18,0x3b535b); rect(188,195,22,12,0x96c6c4);
    plant(76,108); plant(334,294);
    // Coffee bar and lounge.
    rect(502,92,213,45,0x997857); rect(502,89,213,14,0xd1b497);
    rect(532,76,31,26,0x334b52); rect(538,79,19,14,0x7d9d9a);
    for (const x of [601,625,649]) { rect(x,82,12,13,0xf2e9d4); }
    rect(505,198,37,88,0xc58163); rect(512,204,27,76,0xe0a386);
    rect(666,198,37,88,0xc58163); rect(669,204,27,76,0xe0a386);
    rect(573,222,62,45,0xd1b18c); plant(725,297);
    // Open work area.
    for (const x of [110,578]) { rect(x,431,120,49,0xd4b18d); rect(x+32,438,48,24,0x344f5a); rect(x+36,441,40,16,0x91bec1); rect(x+48,488,30,30,0x507578); }
    plant(65,532); plant(736,532);
    this.add.text(400,367,'E S P A I   C O M Ú', { fontFamily:'monospace',fontSize:'12px',color:'#68817d' }).setOrigin(0.5);
  }
  aturar() { this.jugador?.setVelocity(0,0); this.jugador?.anims.stop(); this.jugador?.setFrame(this.frameQuiets[this.direccio]); }
  bloquejarControls(estat) {
    this.bloquejat = estat;
    this.input.keyboard.resetKeys();
    this.input.keyboard.enabled = !estat;
    this.aturar();
  }
  update() {
    if (!this.jugador) return;
    // Disabling keyboard events alone does not clear keys already held down.
    if (this.bloquejat || !document.hasFocus()) { this.aturar(); return; }
    let x = Number(this.cursors.right.isDown || this.teclesWASD.D.isDown) - Number(this.cursors.left.isDown || this.teclesWASD.A.isDown);
    let y = Number(this.cursors.down.isDown || this.teclesWASD.S.isDown) - Number(this.cursors.up.isDown || this.teclesWASD.W.isDown);
    const vel = new Phaser.Math.Vector2(x,y).normalize().scale(160);
    this.jugador.setVelocity(vel.x, vel.y);
    if (x || y) { this.direccio = Math.abs(x)>Math.abs(y) ? (x<0?'esquerra':'dreta') : (y<0?'amunt':'avall'); this.jugador.anims.play(`caminar-${this.direccio}`,true); } else this.aturar();
    this.etiqueta.setPosition(this.jugador.x,this.jugador.y-30);
    const zona = this.zones.find(z => Phaser.Geom.Rectangle.Contains(z.rect,this.jugador.x,this.jugador.y+14)) || null;
    if (zona?.id !== this.zonaActual?.id) { this.zonaActual = zona; this.game.events.emit('canvi-zona', zona ? { id:zona.id, nom:zona.nom, titolMonitor:zona.titolMonitor, streamUrl:zona.streamUrl } : null); }
  }
}
