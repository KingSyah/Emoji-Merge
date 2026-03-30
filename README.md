# 🍉 Fruit Smash — Merge & Conquer

A mobile-first fruit merging puzzle game built with pure HTML, CSS, and JavaScript (Canvas API). Drop fruits, merge identical ones to create bigger fruits, avoid disguised traps, manage your energy, and complete 6 progressively harder levels.

---

## 📁 File Structure

```
fruit-smash/
├── index.html      # HTML structure & modals
├── style.css       # All styling, animations, layout
├── script.js       # Game logic, physics, rendering
└── README.md       # This file
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
| Toggle sound | Tap **🔊 Sound** |
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

## ⚡ Energy System

The game includes an **anti-spam energy system** that keeps gameplay fair and strategic without punishing normal play.

### How it works

- You have **5 energy pips** displayed in the Next Fruit row.
- **Normal drops** (more than 1.5 seconds apart) do **not** consume energy — energy stays full and regen continues uninterrupted.
- **Spam drops** (less than 1.5 seconds apart) **consume 1 energy pip** each and reset the regen timer, with a *"Slow down! -1 Energy"* warning.
- When energy reaches **0**, drops are blocked entirely until energy refills, with a *"No Energy! Wait…"* notification.
- Energy **regenerates automatically** — 1 pip every **2.2 seconds** — shown by a small fill bar next to the pips.
- A soft chime plays each time a pip refills.
- Energy is fully restored on **Restart** and when advancing to a **new level**.

### Visual indicators

| Element | Meaning |
|---|---|
| 🟧 Filled pip | Energy available |
| ⬛ Empty pip | Energy depleted |
| Fill bar | Progress to next pip regen |
| Red pip flash | Spam detected / energy hit |
| Orange toast | *"Slow down! -1 Energy"* |
| Red toast | *"No Energy! Wait…"* |

---

## 💣 Trap System

Traps are the game's main twist. They **look exactly like real fruits** but steal points when merged.

| Trap | Disguise | Penalty |
|---|---|---|
| Bomb Cherry | 🍒 (same as Cherry) | −30 pts |
| Poison Berry | 🍓 (same as Berry) | −60 pts |
| Trap Orange | 🍊 (same as Orange) | −100 pts |

**How to spot traps:**
- A subtle pulsing **⚡** icon appears in the corner of trap fruits on the canvas.
- The icon switches to **⏱️** and blinks rapidly when a trap is about to expire (under 3 seconds left).
- An **⚠️ TRAP!** warning may appear in the "Next" preview row — but only **50% of the time**, so you can't rely on it.
- Merging a trap with **any fruit of the same type** (even a real one) triggers the penalty and destroys both.
- Traps **automatically self-destruct** after **12 seconds** with a *"Poof!"* effect — no penalty.

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
- **Fruit-to-fruit collisions** — circle overlap resolution using mass-weighted position and velocity impulse over 5 solver iterations per frame.
- **Air & floor damping** — velocity dampens each frame so fruits settle naturally.
- **Anti-tunnel clamping** — fruits are force-locked inside bounds after each solver pass to prevent leaking through walls.

### Rendering
- **HTML5 Canvas API** — all game objects drawn each frame.
- **60 FPS** target via `requestAnimationFrame`.
- Canvas resizes dynamically to fill available viewport height.
- Drop preview ghost and guide line rendered above the active drop position.
- Particle burst effects on merge and trap hit.
- Floating score text animates upward on every merge.

### Audio
- **Web Audio API** — all sounds are synthesized procedurally (no audio files needed).
- Sounds: drop, merge, trap hit, combo, level up, game over, energy regen chime.
- Persisted mute preference via `localStorage`.

### Storage
- Best score saved to `localStorage` key `fruitsmash_best`.
- Audio preference saved to `localStorage` key `fruitsmash_audio`.

### Mobile Support
- `position: fixed; inset: 0` on `body` — prevents scroll bounce.
- `env(safe-area-inset-*)` — respects iPhone notch and Android home-bar.
- `viewport-fit=cover` in meta viewport tag.
- Touch events (`touchstart`, `touchmove`, `touchend`) with `passive: false` to allow `preventDefault`.
- Fullscreen API with webkit/moz/ms prefixes for cross-browser support.
- Canvas cursor adapts to context: `crosshair` normally, `not-allowed` when energy is empty.

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
Upload all files to any static hosting:
- **GitHub Pages** — push to a repo, enable Pages in settings.
- **Netlify** — drag & drop the folder into netlify.com/drop.
- **Vercel** — `vercel` CLI or drag & drop.

> **iOS Safari tip:** Tap the Share button → "Add to Home Screen" to run the game fullscreen without the browser address bar.

---

## 🛠️ Customization

All game data is defined at the top of `script.js` and easy to tweak:

```js
// Add a new level
LEVELS.push(
  { goal: 12000, trapChance: .40, name: 'Legendary', badge: '💎', maxFruitDrop: 7 }
);

// Change trap penalty
const TRAPS = [
  { emoji: '🍒', penalty: 50, ... },  // increase Cherry trap penalty
];

// Add a new fruit to the chain
const FRUITS = [
  ...
  { emoji: '🫐', size: 62, pts: 100, mass: 55, color: '#4c1d95', name: 'Blueberry' },
];

// Tune the energy system
this.maxEnergy = 5;          // number of pips
this.energyRegenTime = 2200; // ms per pip regen
// spam threshold is 1500ms in the drop() method
```

---

## 📋 Changelog

### v1.2 — Energy System
- Added **anti-spam energy system** with 5 pip UI, regen bar, and smart spam detection.
- Spam threshold set at 1.5 seconds between drops — normal play is never penalized.
- Energy warnings shown as on-canvas toast notifications.
- Soft regen chime added to Web Audio synthesizer.
- Canvas cursor changes to `not-allowed` when energy is empty.

### v1.1 — Trap Expiry & Visual Polish
- Traps now **auto-destruct after 12 seconds** with a *"Poof!"* particle effect.
- Trap expiry countdown indicator: pulsing **⚡** icon switches to **⏱️** in final 3 seconds.
- Trap indicator blink speed increases as expiry approaches.

### v1.0 — Initial Release
- 6-level progression with scaling trap chance and fruit variety.
- Custom circle physics engine with mass-weighted impulse resolution.
- Combo multiplier system.
- Full Web Audio synthesizer (no external sound files).
- Fullscreen API support.
- Mobile touch support with safe-area insets.
- Animated star background, shimmer footer, and crown copyright badge.

---

## 📄 License & Copyright

```
© 2025 KingSyah · All Rights Reserved
```

Released under the **MIT License** — free to use, modify, and distribute with attribution.
See `COPYRIGHT.md` for full license text and footer reuse guide for future projects.
