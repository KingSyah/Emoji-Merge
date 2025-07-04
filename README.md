# 🍎 Fruit Fusion Game

Sebuah game puzzle merge buah yang modern dan responsif, terinspirasi dari Suika Game. Dibuat dengan HTML5, CSS3, dan JavaScript murni.

## ✨ Fitur Utama

### 🎮 Gameplay
- **Merge Mechanics**: Gabungkan buah yang sama untuk membuat buah yang lebih besar
- **Physics Engine**: Sistem fisika realistis dengan rolling dan sliding yang smooth
- **Bubble Effects**: Efek bubble yang halus mengelilingi buah untuk visual yang menarik
- **Combo System**: Sistem combo untuk skor bonus
- **Level Progression**: Sistem level yang meningkat berdasarkan skor

### 🎨 Visual & Audio
- **Mode PC**: Efek visual yang menarik dengan animasi, particles, dan screen shake
- **Mode Mobile**: Optimasi performa dengan efek minimal untuk gameplay yang lancar
- **Responsive Design**: Layout yang menyesuaikan untuk PC dan mobile
- **Sound System**: Sound effects dramatis dengan kontrol mute/unmute
- **Background Music**: Musik ambient yang tenang

### 📱 Optimasi Platform
- **PC Features**:
  - Efek visual lengkap (particles, ripples, screen shake)
  - Background particles
  - Hover effects
  - Keyboard controls
  - Enhanced graphics

- **Mobile Features**:
  - Performa dioptimasi (30 FPS vs 60 FPS PC)
  - Animasi minimal untuk mencegah lag
  - Touch controls yang responsif
  - Simplified rendering
  - Battery-friendly

## 🎯 Cara Bermain

1. **Drop Buah**: Klik atau tap untuk menjatuhkan buah
2. **Merge**: Buah yang sama akan bergabung menjadi buah yang lebih besar
3. **Hindari Game Over**: Jangan biarkan buah mencapai garis merah
4. **Skor Tinggi**: Buat combo untuk mendapatkan skor bonus

### 🎮 Kontrol

#### PC
- **Mouse**: Klik untuk drop buah
- **Arrow Keys**: Gerakkan posisi drop
- **Space**: Drop buah
- **P**: Pause/Resume
- **R**: Restart
- **M**: Mute/Unmute

#### Mobile
- **Touch**: Tap untuk drop buah
- **Drag**: Gerakkan posisi drop
- **Buttons**: Gunakan tombol kontrol di layar

## 🛠️ Teknologi

- **HTML5**: Struktur dan Canvas API
- **CSS3**: Styling responsif dengan animasi
- **JavaScript ES6+**: Game logic dan physics engine
- **Web Audio API**: Sound effects dan background music
- **Canvas 2D**: Rendering graphics

## 🚀 Fitur Teknis

### Physics Engine
- Gravitasi realistis
- Collision detection yang akurat
- Rolling dan sliding physics
- Minimal bouncing untuk gameplay yang smooth
- Friction dan air resistance

### Performance Optimization
- Adaptive FPS (30 FPS mobile, 60 FPS PC)
- Particle limiting
- Mobile-specific optimizations
- Efficient collision detection
- Memory management

### Audio System
- Procedural sound generation
- Dramatic sound effects
- Background music
- Volume control
- Mobile audio optimization

## 📁 Struktur File

```
FruitFusion/
├── index.html          # Main HTML file
├── style.css           # Responsive CSS styles
├── script.js           # Game logic and physics
└── README.md           # Documentation
```

## 🎨 Customization

### Menambah Buah Baru
Edit array `fruitTypes` di `script.js`:
```javascript
{ emoji: '🥝', size: 62, points: 78, mass: 58, color: '#2ed573' }
```

### Mengubah Physics
Sesuaikan konstanta physics di constructor:
```javascript
this.gravity = 0.35;
this.friction = 0.95;
this.restitution = 0.05;
```

### Styling
Modifikasi CSS variables atau classes di `style.css` untuk mengubah tampilan.

## 🔧 Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Mobile**: iOS Safari 11+, Chrome Mobile 60+
- **Features Required**: Canvas 2D, Web Audio API, ES6+

## 📱 PWA Ready

Game ini siap untuk dijadikan Progressive Web App (PWA) dengan:
- Responsive design
- Touch-friendly interface
- Offline capability (dengan service worker)
- App-like experience

## 🎮 Game Balance

### Fruit Progression
1. 🍒 Cherry (18px) - 1 point
2. 🍇 Grape (22px) - 3 points
3. 🍓 Strawberry (26px) - 6 points
4. 🍋 Lemon (30px) - 10 points
5. 🍊 Orange (34px) - 15 points
6. 🍎 Apple (38px) - 21 points
7. 🍑 Cherry (42px) - 28 points
8. 🍌 Banana (46px) - 36 points
9. 🍍 Pineapple (50px) - 45 points
10. 🥭 Mango (54px) - 55 points
11. 🍉 Watermelon (58px) - 66 points

### Scoring System
- Base points per fruit type
- Combo multiplier (consecutive merges)
- Level progression every 1000 points

## 🐛 Known Issues

- Audio may require user interaction to start on some mobile browsers
- Fullscreen API may not work on all devices
- Performance may vary on older mobile devices

## 🔄 Updates & Roadmap

### Planned Features
- [ ] Power-ups dan special abilities
- [ ] Leaderboard online
- [ ] Achievement system
- [ ] More fruit types
- [ ] Seasonal themes

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer

Created with ❤️ for modern web gaming experience.

---

**Enjoy playing Fruit Fusion! 🍎🎮**
