# 🍉 Fruit Smash — Merge & Conquer

A mobile-first fruit merging puzzle game built with pure HTML, CSS, and JavaScript (Canvas API). Drop fruits, merge identical ones to create bigger fruits, avoid disguised traps, and complete 6 progressively harder levels.

---

## 📁 File Structure

```
fruit-smash/
├── index.html   # HTML structure & modals
├── style.css    # All styling, animations, layout
├── script.js    # Game logic, physics, rendering
└── README.md    # This file
```

No build tools, no frameworks, no dependencies — just open `index.html` in a browser.

---

## 🎮 How to Play

| Action | Control |
|---|---|
| Drop a fruit | Tap / Click on the game canvas |
| Aim fruit | Drag / Move mouse left–right |
| Pause | Tap **⏸ Pause** or press `P` |
| Restart | Tap **🔄 Restart** or press `R` |
| Toggle sound | Tap **🔊 Sound** or press `M` |
| Fullscreen | Tap **⛶** button (top-right) |
| Move aim (keyboard) | `←` / `→` Arrow Keys |
| Drop (keyboard) | `Space` |

### Core Rules

1. **Drop fruits** from the top of the game area.
2. **Two identical fruits** that touch each other will **merge** into the next larger fruit.
3. **Earn points** for every merge — bigger merges = more points.
4. **Reach the level goal** shown in the Mission bar to advance.
5. **Don't let fruits stack above the red danger line** — if any fruit stays above it for 2.5 seconds, it's Game Over.

---

## 💣 Trap System

Traps are the game's main twist. They **look exactly like real fruits** but stealing points when merged.

| Trap | Disguise | Penalty |
|---|---|---|
| Bomb Cherry | 🍒 (same as Cherry) | −30 pts |
| Poison Berry | 🍓 (same as Berry) | −60 pts |
| Trap Orange | 🍊 (same as Orange) | −100 pts |

**How to spot traps:**
- A subtle pulsing **⚡** icon appears in the corner of trap fruits on the canvas.
- An **⚠️ TRAP!** warning may appear in the "Next" preview row — but only **50% of the time**, so you can't rely on it.
- Merging a trap with **any fruit of the same type** (even a real one) triggers the penalty and destroys both.

---

## 🍓 Fruit Chain (Merge Order)

Merging two of the same fruit creates the next one in the chain:

| # | Fruit | Points |
|---|---|---|
| 1 | 🍒 Cherry | 1 |
| 2 | 🍇 Grape | 3 |
| 3 | 🍓 Berry | 6 |
| 4 | 🍋 Lemon | 10 |
| 5 | 🍊 Orange | 15 |
| 6 | 🍎 Apple | 22 |
| 7 | 🥑 Avocado | 30 |
| 8 | 🍌 Banana | 40 |
| 9 | 🍍 Pineapple | 52 |
| 10 | 🥭 Mango | 65 |
| 11 | 🍉 Watermelon | 80 |

---

## 🔥 Combo System

Merging fruits quickly in succession builds a **combo multiplier**:

- Merges within **2 seconds** of each other count as a combo.
- Each extra combo level adds **+30% bonus points** to the merge.
- A big **"3x COMBO! 🔥"** pop-up appears at 3x or higher.
- Any trap hit **resets** the combo to 0.

---

## 🏆 Levels

| Level | Name | Goal | Trap Chance |
|---|---|---|---|
| 1 | 🍒 Warm Up | 500 pts | 10% |
| 2 | 🍊 Getting Hot | 1,000 pts | 15% |
| 3 | 🍋 Tricky | 1,800 pts | 20% |
| 4 | 🍇 Frenzied | 3,000 pts | 25% |
| 5 | 🍉 Chaos Mode | 5,000 pts | 30% |
| 6 | 🏆 Supreme | 8,000 pts | 35% |

Completing a level awards **1–3 stars** based on how many traps you hit:
- ⭐⭐⭐ — Zero trap hits
- ⭐⭐ — 1–2 trap hits
- ⭐ — 3 or more trap hits

---

## ⚙️ Technical Details

### Physics Engine (custom, no libraries)
- **Gravity** — constant downward acceleration per frame.
- **Wall & floor collisions** — elastic bounce with restitution coefficient.
- **Fruit-to-fruit collisions** — circle overlap resolution using mass-weighted impulse.
- **Damping** — velocity dampens at low speed so fruits settle naturally.

### Rendering
- **HTML5 Canvas API** — all game objects drawn each frame.
- **60 FPS** target via `requestAnimationFrame`.
- Canvas resizes dynamically to fill available viewport height.

### Audio
- **Web Audio API** — all sounds are synthesized procedurally (no audio files needed).
- Sounds: drop, merge, trap hit, combo, level up, game over.
- Persisted mute preference via `localStorage`.

### Storage
- Best score saved to `localStorage` key `fruitsmash_best`.
- Audio preference saved to `localStorage` key `fruitsmash_audio`.

### Mobile Support
- `position: fixed; inset: 0` on `body` — prevents scroll bounce.
- `100dvh` (dynamic viewport height) for accurate full-height on mobile browsers.
- `env(safe-area-inset-*)` — respects iPhone notch and Android home-bar.
- `viewport-fit=cover` in meta viewport tag.
- Touch events (`touchstart`, `touchmove`, `touchend`) with `passive: false` to allow `preventDefault`.
- Fullscreen API with webkit/moz/ms prefixes for cross-browser support.

---

## 🚀 Running the Game

### Local (simplest)
Just open `index.html` directly in any modern browser — no server needed.

### Local server (recommended for mobile testing)
```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```
Then open `http://localhost:8080` on your device.

### Deploy
Upload all 3 files (`index.html`, `style.css`, `script.js`) to any static hosting:
- **GitHub Pages** — push to a repo, enable Pages in settings.
- **Netlify** — drag & drop the folder into netlify.com/drop.
- **Vercel** — `vercel` CLI or drag & drop.

> **iOS Safari tip:** Tap the Share button → "Add to Home Screen" to run the game fullscreen without the browser address bar.

---

## 🛠️ Customization

All game data is defined at the top of `script.js` and easy to tweak:

```js
// Add a new level
const LEVELS = [
  ...
  { goal: 12000, trapChance: .40, name: 'Legendary', badge: '💎', maxFruitDrop: 7 },
];

// Change trap penalty
const TRAPS = [
  { emoji: '🍒', penalty: 50, ... },  // increase Cherry trap penalty
];

// Add a new fruit to the chain
const FRUITS = [
  ...
  { emoji: '🫐', size: 62, pts: 100, mass: 55, color: '#4c1d95', name: 'Blueberry' },
];
```

---

## 📄 License

MIT — free to use, modify, and distribute.
