// =====================
// GAME CONFIG & DATA
// =====================
const LEVELS = [
  { goal:500,  goalType:'score', trapChance:.10, name:'Warm Up',    hint:'Merge fruits, avoid traps!', badge:'🍒', maxFruitDrop:4 },
  { goal:1000, goalType:'score', trapChance:.15, name:'Getting Hot',hint:'Traps are sneakier now...',  badge:'🍊', maxFruitDrop:5 },
  { goal:1800, goalType:'score', trapChance:.20, name:'Tricky',     hint:'Stay sharp, combos help!',   badge:'🍋', maxFruitDrop:5 },
  { goal:3000, goalType:'score', trapChance:.25, name:'Frenzied',   hint:'Traps everywhere!',          badge:'🍇', maxFruitDrop:6 },
  { goal:5000, goalType:'score', trapChance:.30, name:'Chaos Mode', hint:'Master of fruit fusion!',    badge:'🍉', maxFruitDrop:6 },
  { goal:8000, goalType:'score', trapChance:.35, name:'Supreme',    hint:'Can you reach 8000?!',       badge:'🏆', maxFruitDrop:7 },
];

const FRUITS = [
  { emoji:'🍒', size:18, pts:1,  mass:1,  color:'#dc2626', name:'Cherry' },
  { emoji:'🍇', size:22, pts:3,  mass:2,  color:'#7c3aed', name:'Grape' },
  { emoji:'🍓', size:26, pts:6,  mass:3,  color:'#ec4899', name:'Berry' },
  { emoji:'🍋', size:30, pts:10, mass:5,  color:'#eab308', name:'Lemon' },
  { emoji:'🍊', size:34, pts:15, mass:8,  color:'#ea580c', name:'Orange' },
  { emoji:'🍎', size:38, pts:22, mass:12, color:'#dc2626', name:'Apple' },
  { emoji:'🥑', size:42, pts:30, mass:17, color:'#16a34a', name:'Avocado' },
  { emoji:'🍌', size:46, pts:40, mass:23, color:'#facc15', name:'Banana' },
  { emoji:'🍍', size:50, pts:52, mass:30, color:'#f59e0b', name:'Pineapple' },
  { emoji:'🥭', size:54, pts:65, mass:38, color:'#f97316', name:'Mango' },
  { emoji:'🍉', size:58, pts:80, mass:47, color:'#16a34a', name:'Watermelon' },
];

// Trap disguises — look like real fruits but steal points when merged
const TRAPS = [
  { emoji:'🍒', trapEmoji:'💣', size:18, penalty:30,  color:'#1a0010', name:'Bomb Cherry' },
  { emoji:'🍓', trapEmoji:'☠️', size:26, penalty:60,  color:'#1a0010', name:'Poison Berry' },
  { emoji:'🍊', trapEmoji:'🔴', size:34, penalty:100, color:'#1a0010', name:'Trap Orange' },
];

// =====================
// UTILS
// =====================
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function showModal(id) { document.getElementById(id).classList.add('show'); }
function hideModal(id) { document.getElementById(id).classList.remove('show'); }

function makeStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.cssText = `
      left:${Math.random() * 100}%;top:${Math.random() * 100}%;
      width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;
      --d:${2 + Math.random() * 4}s;--delay:-${Math.random() * 4}s;
    `;
    container.appendChild(s);
  }
}

// =====================
// GAME CLASS
// =====================
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrap = document.getElementById('canvas-wrap');

    this.level = 0;
    this.score = 0;
    this.best = parseInt(localStorage.getItem('fruitsmash_best') || '0');
    this.trapHits = 0;
    this.trapsAvoided = 0;
    this.mergeCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastMergeTime = 0;

    this.fruits = [];
    this.particles = [];
    this.floatTexts = [];

    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.dropX = 0;
    this.showCursor = false;

    this.nextType = this.pickNext();

    this.canDrop = true;
    this.dropCooldown = 350;
    this.lastDrop = 0;

    this.gravity = 0.5;
    this.restitution = 0.2;
    this.friction = 0.6;

    this.audioCtx = null;
    this.audioEnabled = localStorage.getItem('fruitsmash_audio') !== 'false';

    this.dangerCooldown = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.setupAudio();
    this.setupEvents();
    this.updateUI();
    this.updateNextDisplay();
    this.dropX = this.canvas.width / 2;
    document.getElementById('best').textContent = this.best;
    this.loop();
  }

  resizeCanvas() {
    const w = this.wrap.clientWidth;
    const h = this.wrap.clientHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.wallT = 4;
    this.floorY = h - this.wallT;
    this.dangerLine = h * 0.14;
  }

  get currentLevel() { return LEVELS[this.level] || LEVELS[LEVELS.length - 1]; }

  pickNext() {
    const lvl = this.currentLevel;
    const isTrap = Math.random() < lvl.trapChance;
    if (isTrap) {
      const ti = Math.floor(Math.random() * TRAPS.length);
      return { isTrap: true, trapIdx: ti, fruitIdx: FRUITS.findIndex(f => f.emoji === TRAPS[ti].emoji) };
    }
    const maxF = Math.min(lvl.maxFruitDrop, FRUITS.length);
    return { isTrap: false, fruitIdx: Math.floor(Math.random() * maxF) };
  }

  getFruitDef(next) {
    if (next.isTrap) return { ...FRUITS[next.fruitIdx], isTrap: true, trapIdx: next.trapIdx, color: '#2d0020' };
    return { ...FRUITS[next.fruitIdx], isTrap: false };
  }

  // ===== AUDIO =====
  setupAudio() {
    if (!this.audioEnabled) return;
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }

  playSound(type) {
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      const ac = this.audioCtx;
      const g = ac.createGain();
      g.connect(ac.destination);
      const o = ac.createOscillator();
      o.connect(g);

      if (type === 'drop') {
        o.frequency.setValueAtTime(300, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(120, ac.currentTime + .1);
        g.gain.setValueAtTime(.12, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .15);
        o.start(); o.stop(ac.currentTime + .15);

      } else if (type === 'merge') {
        o.type = 'triangle';
        o.frequency.setValueAtTime(440, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + .2);
        g.gain.setValueAtTime(.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .25);
        o.start(); o.stop(ac.currentTime + .25);

      } else if (type === 'trap') {
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(55, ac.currentTime + .4);
        g.gain.setValueAtTime(.2, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .45);
        o.start(); o.stop(ac.currentTime + .45);

      } else if (type === 'levelup') {
        o.disconnect();
        [523, 659, 784, 1047].forEach((f, i) => {
          const o2 = ac.createOscillator(); const g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.type = 'triangle'; o2.frequency.value = f;
          g2.gain.setValueAtTime(.15, ac.currentTime + i * .08);
          g2.gain.exponentialRampToValueAtTime(.001, ac.currentTime + i * .08 + .3);
          o2.start(ac.currentTime + i * .08); o2.stop(ac.currentTime + i * .08 + .3);
        });
        return;

      } else if (type === 'gameover') {
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(440, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(110, ac.currentTime + 1);
        g.gain.setValueAtTime(.25, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + 1.2);
        o.start(); o.stop(ac.currentTime + 1.2);

      } else if (type === 'combo') {
        o.disconnect();
        [659, 784, 1047].forEach((f, i) => {
          const o2 = ac.createOscillator(); const g2 = ac.createGain();
          o2.connect(g2); g2.connect(ac.destination);
          o2.frequency.value = f;
          g2.gain.setValueAtTime(.1, ac.currentTime + i * .06);
          g2.gain.exponentialRampToValueAtTime(.001, ac.currentTime + i * .06 + .2);
          o2.start(ac.currentTime + i * .06); o2.stop(ac.currentTime + i * .06 + .2);
        });
        return;
      }
    } catch (e) {}
  }

  // ===== EVENTS =====
  setupEvents() {
    const c = this.canvas;

    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      this.dropX = clamp((e.clientX - r.left) * (c.width / r.width), 20, c.width - 20);
      this.showCursor = true;
      this.updateCursorLine();
    });
    c.addEventListener('mouseleave', () => { this.showCursor = false; this.updateCursorLine(); });
    c.addEventListener('click', e => {
      const r = c.getBoundingClientRect();
      this.dropX = clamp((e.clientX - r.left) * (c.width / r.width), 20, c.width - 20);
      this.drop();
    });
    c.addEventListener('touchstart', e => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      this.dropX = clamp((e.touches[0].clientX - r.left) * (c.width / r.width), 20, c.width - 20);
    }, { passive: false });
    c.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      this.dropX = clamp((e.touches[0].clientX - r.left) * (c.width / r.width), 20, c.width - 20);
      this.updateCursorLine();
    }, { passive: false });
    c.addEventListener('touchend', e => { e.preventDefault(); this.drop(); }, { passive: false });

    document.getElementById('restart-btn').onclick = () => this.restart();
    document.getElementById('pause-btn').onclick = () => this.togglePause();
    document.getElementById('mute-btn').onclick = () => this.toggleMute();
    document.getElementById('help-btn').onclick = () => showModal('help-modal');
    document.getElementById('fullscreen-btn').onclick = () => this.toggleFullscreen();
    document.getElementById('close-help-btn').onclick = () => hideModal('help-modal');
    document.getElementById('next-level-btn').onclick = () => { hideModal('level-modal'); this.nextLevel(); };
    document.getElementById('restart-go-btn').onclick = () => { hideModal('gameover-modal'); this.restart(); };
    document.getElementById('resume-btn').onclick = () => this.togglePause();
    document.getElementById('restart-pause-btn').onclick = () => { hideModal('pause-modal'); this.restart(); };

    document.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); this.drop(); }
      if (e.code === 'KeyP') this.togglePause();
      if (e.code === 'KeyR') this.restart();
      if (e.code === 'ArrowLeft') this.dropX = clamp(this.dropX - 20, 20, this.canvas.width - 20);
      if (e.code === 'ArrowRight') this.dropX = clamp(this.dropX + 20, 20, this.canvas.width - 20);
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.dropX = clamp(this.dropX, 20, this.canvas.width - 20);
    });
    // Sync fullscreen button icon when user presses Escape
    const onFsChange = () => {
      const btn = document.getElementById('fullscreen-btn');
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      btn.textContent = isFs ? '✕' : '⛶';
      btn.title = isFs ? 'Exit Fullscreen' : 'Fullscreen';
      setTimeout(() => { this.resizeCanvas(); }, 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
  }

  updateCursorLine() {
    const line = document.getElementById('cursor-line');
    if (this.showCursor && !this.isGameOver && !this.isPaused) {
      line.classList.add('show');
      line.style.left = (this.dropX / this.canvas.width * 100) + '%';
    } else {
      line.classList.remove('show');
    }
  }

  // ===== DROP =====
  drop() {
    if (this.isPaused || this.isGameOver || this.isLevelComplete) return;
    const now = Date.now();
    if (!this.canDrop || now - this.lastDrop < this.dropCooldown) return;
    this.lastDrop = now;

    const next = this.nextType;
    const def = this.getFruitDef(next);
    const dropY = Math.max(def.size + 5, 30);

    this.fruits.push({
      x: this.dropX, y: dropY,
      vx: (Math.random() - .5) * 0.4, vy: 0,
      radius: def.size,
      type: next.fruitIdx,
      isTrap: next.isTrap,
      trapIdx: next.isTrap ? next.trapIdx : -1,
      displayEmoji: def.emoji,
      emoji: def.emoji,
      color: def.color,
      pts: def.pts,
      mass: def.mass,
      id: Date.now() + Math.random(),
      merging: false,
      dropTime: Date.now(),
      gameOverTimer: null,
      revealed: false,
    });

    this.playSound('drop');
    this.nextType = this.pickNext();
    this.updateNextDisplay();
    this.canDrop = false;
    setTimeout(() => { this.canDrop = true; }, this.dropCooldown);
  }

  updateNextDisplay() {
    const next = this.nextType;
    const warn = document.getElementById('trap-warning');
    document.getElementById('next-icon').textContent = next.isTrap
      ? TRAPS[next.trapIdx].emoji
      : FRUITS[next.fruitIdx].emoji;
    // Only reveal warning 50% of the time to keep players on their toes
    if (next.isTrap && Math.random() < 0.5) warn.classList.add('show');
    else warn.classList.remove('show');
  }

  // ===== PHYSICS =====
  update() {
    const now = Date.now();

    // 1. Pergerakan dasar & Gravitasi
    for (let i = 0; i < this.fruits.length; i++) {
      const f = this.fruits[i];
      f.vy += this.gravity;
      
      // Friksi udara alami agar gerakan halus
      f.vx *= 0.99;
      f.vy *= 0.99;

      f.x += f.vx;
      f.y += f.vy;
    }

    // 2. Iterasi Posisi (Mencegah tumpang tindih DAN keluar frame)
    const iterations = 5;
    for (let k = 0; k < iterations; k++) {
      for (let i = 0; i < this.fruits.length; i++) {
        const f = this.fruits[i];

        // Cek tabrakan antar buah
        for (let j = i + 1; j < this.fruits.length; j++) {
          this.resolvePosition(f, this.fruits[j]);
        }

        // KUNCI PERBAIKAN: Kunci paksa di batas tembok SETELAH digeser oleh buah lain
        // Ini memastikan tidak ada buah yang bisa "bocor" keluar layar
        if (f.x - f.radius < this.wallT) f.x = this.wallT + f.radius;
        if (f.x + f.radius > this.canvas.width - this.wallT) f.x = this.canvas.width - this.wallT - f.radius;
        if (f.y + f.radius > this.floorY) f.y = this.floorY - f.radius;
      }
    }

    // 3. Resolusi Kecepatan & TRAP EXPIRED LOGIC
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];

      // --- TRAP EXPIRED LOGIC ---
      if (f.isTrap) {
        const age = now - f.dropTime;
        if (age > 12000) { // 12 Detik Trap akan hancur
          this.spawnParticles(f.x, f.y, '#888', 12);
          this.addFloatText(f.x, f.y, 'Poof!', '#aaaaaa');
          this.fruits.splice(i, 1); // Hapus trap dari game
          continue; // Lanjut ke buah berikutnya
        }
      }
      // --------------------------

      // Pantulan Tembok
      if (f.x - f.radius <= this.wallT && f.vx < 0) f.vx = Math.abs(f.vx) * this.restitution;
      if (f.x + f.radius >= this.canvas.width - this.wallT && f.vx > 0) f.vx = -Math.abs(f.vx) * this.restitution;
      
      // Pantulan Lantai
      if (f.y + f.radius >= this.floorY && f.vy > 0) {
        f.vy *= -this.restitution;
        f.vx *= 0.85; // Friksi lantai
      }

      // Hitung pantulan momentum dengan buah lain
      for (let j = i + 1; j < this.fruits.length; j++) {
        this.resolveVelocity(f, this.fruits[j]);
      }
    }

    this.checkMerges();
    this.updateParticles();
    this.checkGameOver();
    this.updateDangerFlash();
    this.checkLevelGoal();
  }

  resolvePosition(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const minD = a.radius + b.radius;

    if (dist >= minD || dist === 0) return;

    // Nudge: Jika jatuh tepat di atas buah, geser sedikit agar menggelinding
    if (Math.abs(dx) < 0.2 && dy !== 0) {
      dx += (Math.random() - 0.5) * 0.5;
      dist = Math.hypot(dx, dy);
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minD - dist;
    const total = a.mass + b.mass;

    a.x -= nx * overlap * (b.mass / total);
    a.y -= ny * overlap * (b.mass / total);
    b.x += nx * overlap * (a.mass / total);
    b.y += ny * overlap * (a.mass / total);
  }

  resolveVelocity(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const minD = a.radius + b.radius;

    if (dist > minD + 0.1 || dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;

    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) return; 

    const total = a.mass + b.mass;
    const impulse = -(1 + this.restitution) * velAlongNormal;
    
    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX * (b.mass / total);
    a.vy -= impulseY * (b.mass / total);
    b.vx += impulseX * (a.mass / total);
    b.vy += impulseY * (a.mass / total);
  }

  // ===== MERGE LOGIC =====
  checkMerges() {
    const settled = this.fruits.filter(f => !f.merging && Date.now() - f.dropTime > 400);
    for (let i = 0; i < settled.length; i++) {
      for (let j = i + 1; j < settled.length; j++) {
        const a = settled[i], b = settled[j];
        if (a.type !== b.type) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius + 2) {
          if (a.isTrap || b.isTrap) { this.mergeTrap(a, b); return; }
          if (a.type < FRUITS.length - 1) { this.mergeNormal(a, b); return; }
        }
      }
    }
  }

  mergeNormal(a, b) {
    a.merging = true; b.merging = true;
    const newType = a.type + 1;
    const def = FRUITS[newType];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

    const now = Date.now();
    if (now - this.lastMergeTime < 2000) this.combo++;
    else this.combo = 1;
    this.lastMergeTime = now;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.mergeCount++;

    let pts = def.pts;
    if (this.combo > 1) pts = Math.round(pts * (1 + this.combo * 0.3));
    this.score += pts;
    if (this.score > this.best) { this.best = this.score; localStorage.setItem('fruitsmash_best', this.best); }
    this.updateScoreUI();

    this.spawnParticles(mx, my, def.color, 8);
    this.addFloatText(mx, my, `+${pts}`, this.combo > 1 ? '#ffd166' : '#06d6a0');
    if (this.combo >= 3) { this.showCombo(this.combo); this.playSound('combo'); }

    this.fruits = this.fruits.filter(f => f.id !== a.id && f.id !== b.id);
    this.fruits.push({
      x: mx, y: my, vx: 0, vy: 0,
      radius: def.size, type: newType,
      isTrap: false, trapIdx: -1,
      displayEmoji: def.emoji, emoji: def.emoji,
      color: def.color, pts: def.pts, mass: def.mass,
      id: Date.now() + Math.random(),
      merging: false, dropTime: Date.now(), gameOverTimer: null, revealed: false,
    });
    this.playSound('merge');
  }

  mergeTrap(a, b) {
    a.merging = true; b.merging = true;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const penalty = a.isTrap ? TRAPS[a.trapIdx].penalty : TRAPS[b.trapIdx].penalty;

    this.score = Math.max(0, this.score - penalty);
    this.trapHits++;
    this.combo = 0;
    this.updateScoreUI();

    this.spawnParticles(mx, my, '#ff0054', 16);
    this.addFloatText(mx, my, `-${penalty} 💀`, '#ff0054');
    this.wrap.classList.add('shake');
    setTimeout(() => this.wrap.classList.remove('shake'), 400);
    this.playSound('trap');

    this.fruits = this.fruits.filter(f => f.id !== a.id && f.id !== b.id);
  }

  // ===== PARTICLES & EFFECTS =====
  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color, life: 1, size: 3 + Math.random() * 4,
      });
    }
  }

  updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025; return p.life > 0;
    });
    this.floatTexts = this.floatTexts.filter(t => {
      t.y -= 1.5; t.life -= 0.025; return t.life > 0;
    });
  }

  addFloatText(x, y, text, color) {
    this.floatTexts.push({ x, y, text, color, life: 1 });
  }

  showCombo(n) {
    const el = document.getElementById('combo-display');
    el.textContent = `${n}x COMBO! 🔥`;
    el.style.display = 'block';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'comboPop .6s ease forwards';
    setTimeout(() => { el.style.display = 'none'; }, 650);
  }

  // ===== UI UPDATES =====
  updateScoreUI() {
    document.getElementById('score').textContent = this.score.toLocaleString();
    document.getElementById('best').textContent = this.best.toLocaleString();
    document.getElementById('trap-count').textContent = this.trapHits;
    const s = document.getElementById('score');
    s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse');
    this.updateGoalBar();
  }

  updateGoalBar() {
    const pct = Math.min(100, Math.round(this.score / this.currentLevel.goal * 100));
    document.getElementById('goal-bar').style.width = pct + '%';
    document.getElementById('goal-pct').textContent = pct + '%';
  }

  updateUI() {
    this.updateScoreUI();
    document.getElementById('level-badge').textContent = `LV${this.level + 1}`;
    document.getElementById('goal-text').textContent = `Reach ${this.currentLevel.goal.toLocaleString()} pts`;
    document.getElementById('pause-btn').textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
    document.getElementById('mute-btn').textContent = this.audioEnabled ? '🔊 Sound' : '🔇 Muted';
  }

  // ===== LEVEL / GAME STATE =====
  checkLevelGoal() {
    if (this.isLevelComplete || this.isGameOver) return;
    if (this.score >= this.currentLevel.goal) {
      this.isLevelComplete = true;
      this.playSound('levelup');
      setTimeout(() => this.showLevelComplete(), 600);
    }
  }

  showLevelComplete() {
    const lvl = this.currentLevel;
    const stars = this.trapHits === 0 ? '⭐⭐⭐' : this.trapHits <= 2 ? '⭐⭐' : '⭐';
    document.getElementById('lc-badge').textContent = lvl.badge;
    document.getElementById('lc-title').textContent = `Level ${this.level + 1} Complete!`;
    document.getElementById('lc-sub').textContent = lvl.name + ' — ' + (this.level >= LEVELS.length - 1 ? 'You Win! 🏆' : lvl.hint);
    document.getElementById('lc-stars').textContent = stars;
    document.getElementById('lc-score').textContent = this.score.toLocaleString();
    document.getElementById('lc-traps').textContent = this.trapHits;
    document.getElementById('lc-merges').textContent = this.mergeCount;
    document.getElementById('lc-combo').textContent = this.maxCombo + 'x';

    const btn = document.getElementById('next-level-btn');
    if (this.level >= LEVELS.length - 1) {
      btn.textContent = '🏆 Play Again!';
      btn.onclick = () => { hideModal('level-modal'); this.restart(); };
    } else {
      btn.textContent = 'Next Level →';
    }
    showModal('level-modal');
  }

  nextLevel() {
    this.level = Math.min(this.level + 1, LEVELS.length - 1);
    this.trapHits = 0;
    this.mergeCount = 0;
    this.maxCombo = 0;
    this.combo = 0;
    this.fruits = [];
    this.particles = [];
    this.floatTexts = [];
    this.isLevelComplete = false;
    this.isPaused = false;
    this.canDrop = true;
    this.nextType = this.pickNext();
    this.updateUI();
    this.updateNextDisplay();
  }

  checkGameOver() {
    if (this.isGameOver || this.isLevelComplete) return;
    let danger = false;
    for (const f of this.fruits) {
      if (f.y - f.radius < this.dangerLine && Math.abs(f.vy) < 0.5) {
        if (!f.gameOverTimer) f.gameOverTimer = Date.now();
        else if (Date.now() - f.gameOverTimer > 2500) { this.triggerGameOver(); return; }
        danger = true;
      } else { f.gameOverTimer = null; }
    }
    this.dangerCooldown = danger ? 1 : 0;
  }

  updateDangerFlash() {
    const el = document.getElementById('danger-flash');
    if (this.dangerCooldown > 0) el.classList.add('active');
    else el.classList.remove('active');
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.playSound('gameover');
    document.getElementById('go-score').textContent = this.score.toLocaleString();
    document.getElementById('go-level').textContent = this.level + 1;
    document.getElementById('go-traps').textContent = this.trapHits;
    document.getElementById('go-combo').textContent = this.maxCombo + 'x';
    const sub = this.trapHits > 3 ? '💣 Too many traps got you!' : this.score < 100 ? '😅 Keep practicing!' : '😤 So close!';
    document.getElementById('go-sub').textContent = sub;
    setTimeout(() => showModal('gameover-modal'), 600);
  }

  togglePause() {
    if (this.isGameOver || this.isLevelComplete) return;
    this.isPaused = !this.isPaused;
    document.getElementById('pause-btn').textContent = this.isPaused ? '▶ Resume' : '⏸ Pause';
    if (this.isPaused) showModal('pause-modal'); else hideModal('pause-modal');
  }

  toggleFullscreen() {
    const btn = document.getElementById('fullscreen-btn');
    const el = document.documentElement;
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    if (!isFs) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (req) req.call(el).catch(() => {});
      btn.textContent = '✕';
      btn.title = 'Exit Fullscreen';
    } else {
      const ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (ex) ex.call(document);
      btn.textContent = '⛶';
      btn.title = 'Fullscreen';
    }
    // Resize canvas after fullscreen toggle
    setTimeout(() => { this.resizeCanvas(); }, 200);
  }

    toggleMute() {
    this.audioEnabled = !this.audioEnabled;
    localStorage.setItem('fruitsmash_audio', this.audioEnabled);
    document.getElementById('mute-btn').textContent = this.audioEnabled ? '🔊 Sound' : '🔇 Muted';
    if (this.audioEnabled && !this.audioCtx) this.setupAudio();
  }

  restart() {
    this.level = 0;
    this.score = 0;
    this.trapHits = 0;
    this.trapsAvoided = 0;
    this.mergeCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.fruits = [];
    this.particles = [];
    this.floatTexts = [];
    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelComplete = false;
    this.canDrop = true;
    this.nextType = this.pickNext();
    hideModal('gameover-modal');
    hideModal('pause-modal');
    hideModal('level-modal');
    this.dropX = this.canvas.width / 2;
    this.updateUI();
    this.updateNextDisplay();
  }

  // ===== RENDER =====
  render() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#12082a');
    bg.addColorStop(1, '#0a051a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Danger zone tint
    ctx.fillStyle = 'rgba(239,35,60,.06)';
    ctx.fillRect(this.wallT, 0, W - this.wallT * 2, this.dangerLine);

    // Danger line
    ctx.strokeStyle = '#ef233c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(this.wallT, this.dangerLine); ctx.lineTo(W - this.wallT, this.dangerLine); ctx.stroke();
    ctx.setLineDash([]);

    // Walls & floor
    ctx.fillStyle = '#2a1a4a';
    ctx.fillRect(0, 0, this.wallT, H);
    ctx.fillRect(W - this.wallT, 0, this.wallT, H);
    ctx.fillRect(0, this.floorY, W, this.wallT);

    // Drop preview
    if (!this.isGameOver && !this.isPaused) {
      const def = this.getFruitDef(this.nextType);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = this.nextType.isTrap ? '#ff0054' : def.color;
      ctx.beginPath(); ctx.arc(this.dropX, 22, def.size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = `${Math.max(10, def.size * 1.1)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(def.emoji, this.dropX, 22);
      ctx.restore();

      // Drop guide line
      ctx.strokeStyle = 'rgba(255,255,255,.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(this.dropX, 22 + def.size); ctx.lineTo(this.dropX, H - this.wallT); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Fruits
    this.fruits.forEach(f => {
      ctx.save();
      if (f.isTrap) {
        ctx.shadowColor = '#ff0054';
        ctx.shadowBlur = 12 + Math.sin(Date.now() / 200) * 4;
      }
      ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();

      ctx.shadowBlur = 0;
      ctx.font = `${Math.max(10, f.radius * 1.2)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.displayEmoji, f.x, f.y);

     // Pulsing trap indicator & Expiration warning
      if (f.isTrap) {
        const age = Date.now() - f.dropTime;
        const timeLeft = 12000 - age; // 12000ms = 12 detik
        
        // Blink super cepat jika sisa waktu kurang dari 3 detik
        const blinkSpeed = timeLeft < 3000 ? 80 : 400; 
        const alpha = 0.5 + Math.sin(Date.now() / blinkSpeed) * 0.3;
        
        ctx.globalAlpha = alpha;
        ctx.font = `${f.radius * 0.6}px serif`;
        
        // Ganti ikon menjadi jam pasir/stopwatch saat hampir habis
        const icon = timeLeft < 3000 ? '⏱️' : '⚡';
        ctx.fillText(icon, f.x + f.radius * 0.55, f.y - f.radius * 0.55);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    });

    // Float texts
    this.floatTexts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.life;
      ctx.font = `bold ${18 * t.life + 10}px 'Fredoka One',cursive`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }

  // ===== GAME LOOP =====
  loop() {
    if (!this.isPaused && !this.isGameOver && !this.isLevelComplete) {
      this.update();
    }
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}

// ===== BOOT =====
makeStars();
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
