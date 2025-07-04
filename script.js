class FruitMergeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.fruits = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.gameRunning = true;
        this.isPaused = false;
        
        // Fruit types with emojis and sizes
        this.fruitTypes = [
            { emoji: '🍒', size: 20, points: 1 },
            { emoji: '🍇', size: 25, points: 3 },
            { emoji: '🍓', size: 30, points: 6 },
            { emoji: '🍋', size: 35, points: 10 },
            { emoji: '🍊', size: 40, points: 15 },
            { emoji: '🍎', size: 45, points: 21 },
            { emoji: '🍑', size: 50, points: 28 },
            { emoji: '🍌', size: 55, points: 36 },
            { emoji: '🍍', size: 60, points: 45 },
            { emoji: '🥭', size: 65, points: 55 },
            { emoji: '🍉', size: 70, points: 66 }
        ];
        
        this.nextFruitType = Math.floor(Math.random() * 5); // Only first 5 types can drop
        this.dropX = this.canvas.width / 2;
        this.mergeBubbles = []; // For merge effect bubbles

        // Performance optimization
        this.isMobile = window.innerWidth < 768;
        this.maxBubbles = this.isMobile ? 3 : 5; // Reduce bubbles on mobile
        this.frameCount = 0;
        this.targetFPS = this.isMobile ? 30 : 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;

        // Audio system
        this.audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
        this.audioContext = null;
        this.sounds = {};

        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupAudio();
        this.setupEventListeners();
        this.updateDisplay();
        this.gameLoop();
        this.updateCopyright();
    }
    
    setupCanvas() {
        // Set canvas dimensions
        this.canvas.width = 400;
        this.canvas.height = 600;

        // Adjust for mobile
        if (window.innerWidth < 480) {
            this.canvas.width = 350;
            this.canvas.height = 500;
        }
        if (window.innerWidth < 360) {
            this.canvas.width = 320;
            this.canvas.height = 450;
        }

        this.ctx.font = '30px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Mobile optimization
        if (this.isMobile) {
            this.ctx.imageSmoothingEnabled = false; // Disable for better performance
        }
    }

    setupAudio() {
        // Create simple audio using Web Audio API for better performance
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Audio not supported');
            this.audioEnabled = false;
        }
    }

    createSounds() {
        // Create simple synthesized sounds for better performance than audio files
        this.sounds = {
            drop: () => this.playTone(200, 0.1, 'sine'),
            merge: () => this.playTone(400, 0.2, 'triangle'),
            gameOver: () => this.playTone(150, 0.5, 'sawtooth')
        };
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.audioEnabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            // Ignore audio errors
        }
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('click', (e) => this.handleDrop(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleDrop(e.touches[0]);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        
        // Button events
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restart());
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());

        // Window resize event (throttled for performance)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
            }, 250);
        });
    }
    
    handleMouseMove(e) {
        if (!this.gameRunning || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        this.dropX = (e.clientX - rect.left) * scaleX;
        
        // Keep within bounds
        const fruitSize = this.fruitTypes[this.nextFruitType].size;
        this.dropX = Math.max(fruitSize, Math.min(this.canvas.width - fruitSize, this.dropX));
    }
    
    handleDrop(e) {
        if (!this.gameRunning || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        
        this.dropFruit(x);
    }
    
    dropFruit(x) {
        const fruitType = this.nextFruitType;
        const fruit = {
            x: x,
            y: 100, // Start below the danger line
            vx: 0,
            vy: 0,
            type: fruitType,
            size: this.fruitTypes[fruitType].size,
            emoji: this.fruitTypes[fruitType].emoji,
            id: Date.now() + Math.random(),
            bubbles: [],
            justDropped: true // Flag to prevent immediate game over
        };

        // Keep within bounds
        fruit.x = Math.max(fruit.size, Math.min(this.canvas.width - fruit.size, fruit.x));

        this.fruits.push(fruit);
        this.nextFruitType = Math.floor(Math.random() * 5);
        this.updateNextFruit();

        // Add drop effect bubbles
        this.createDropBubbles(fruit.x, fruit.y);

        // Remove justDropped flag after a short delay
        setTimeout(() => {
            if (fruit) {
                fruit.justDropped = false;
            }
        }, 500);
    }
    
    createDropBubbles(x, y) {
        // Play drop sound
        if (this.sounds.drop) this.sounds.drop();

        // Reduce bubbles on mobile for performance
        const bubbleCount = this.isMobile ? 3 : 5;
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = {
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 8 + 2,
                life: 1,
                decay: this.isMobile ? 0.03 : 0.02 // Faster decay on mobile
            };
            this.fruits[this.fruits.length - 1].bubbles.push(bubble);
        }
    }
    
    updatePhysics() {
        if (this.isPaused) return;
        
        const gravity = 0.3;
        const friction = 0.99;
        const bounce = 0.4;
        
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            
            // Apply gravity
            fruit.vy += gravity;
            
            // Update position
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;
            
            // Apply friction
            fruit.vx *= friction;
            
            // Boundary collisions
            if (fruit.x - fruit.size < 0) {
                fruit.x = fruit.size;
                fruit.vx *= -bounce;
            }
            if (fruit.x + fruit.size > this.canvas.width) {
                fruit.x = this.canvas.width - fruit.size;
                fruit.vx *= -bounce;
            }
            if (fruit.y + fruit.size > this.canvas.height) {
                fruit.y = this.canvas.height - fruit.size;
                fruit.vy *= -bounce;
                fruit.vx *= friction;
            }
            
            // Update bubbles
            for (let j = fruit.bubbles.length - 1; j >= 0; j--) {
                const bubble = fruit.bubbles[j];
                bubble.x += bubble.vx;
                bubble.y += bubble.vy;
                bubble.life -= bubble.decay;
                bubble.vy -= 0.1; // Float up
                
                if (bubble.life <= 0) {
                    fruit.bubbles.splice(j, 1);
                }
            }
        }

        // Update merge bubbles (limit total bubbles for performance)
        const maxBubbles = this.isMobile ? 20 : 50;
        if (this.mergeBubbles.length > maxBubbles) {
            this.mergeBubbles.splice(0, this.mergeBubbles.length - maxBubbles);
        }

        for (let i = this.mergeBubbles.length - 1; i >= 0; i--) {
            const bubble = this.mergeBubbles[i];
            bubble.x += bubble.vx;
            bubble.y += bubble.vy;
            bubble.life -= bubble.decay;
            bubble.vy -= 0.1; // Float up

            if (bubble.life <= 0) {
                this.mergeBubbles.splice(i, 1);
            }
        }

        this.checkCollisions();
        this.checkGameOver();
    }
    
    checkCollisions() {
        for (let i = 0; i < this.fruits.length; i++) {
            for (let j = i + 1; j < this.fruits.length; j++) {
                const fruit1 = this.fruits[i];
                const fruit2 = this.fruits[j];
                
                const dx = fruit1.x - fruit2.x;
                const dy = fruit1.y - fruit2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = fruit1.size + fruit2.size;
                
                if (distance < minDistance) {
                    // Check if same type for merging
                    if (fruit1.type === fruit2.type && fruit1.type < this.fruitTypes.length - 1) {
                        // Add small delay to prevent immediate merging on drop
                        if (!fruit1.justDropped && !fruit2.justDropped) {
                            this.mergeFruits(i, j);
                            return;
                        }
                    }

                    // Only apply collision response if not merging
                    if (fruit1.type !== fruit2.type || fruit1.type >= this.fruitTypes.length - 1) {
                        // Collision response - much gentler
                        const overlap = minDistance - distance;
                        if (overlap > 0 && distance > 0) {
                            const separationX = (dx / distance) * overlap * 0.5;
                            const separationY = (dy / distance) * overlap * 0.5;

                            fruit1.x += separationX;
                            fruit1.y += separationY;
                            fruit2.x -= separationX;
                            fruit2.y -= separationY;

                            // Very gentle velocity exchange
                            const relativeVx = fruit1.vx - fruit2.vx;
                            const relativeVy = fruit1.vy - fruit2.vy;
                            const speed = (relativeVx * dx + relativeVy * dy) / distance;

                            if (speed < 0) {
                                const impulse = speed * 0.1; // Very gentle impulse
                                const normalX = dx / distance;
                                const normalY = dy / distance;

                                fruit1.vx -= impulse * normalX;
                                fruit1.vy -= impulse * normalY;
                                fruit2.vx += impulse * normalX;
                                fruit2.vy += impulse * normalY;
                            }
                        }
                    }
                }
            }
        }
    }
    
    mergeFruits(index1, index2) {
        const fruit1 = this.fruits[index1];
        const fruit2 = this.fruits[index2];
        
        // Create new merged fruit
        const newType = fruit1.type + 1;
        const newFruit = {
            x: (fruit1.x + fruit2.x) / 2,
            y: (fruit1.y + fruit2.y) / 2,
            vx: (fruit1.vx + fruit2.vx) / 2,
            vy: (fruit1.vy + fruit2.vy) / 2,
            type: newType,
            size: this.fruitTypes[newType].size,
            emoji: this.fruitTypes[newType].emoji,
            id: Date.now() + Math.random(),
            bubbles: []
        };
        
        // Add merge effect bubbles
        this.createMergeBubbles(newFruit.x, newFruit.y);
        
        // Update score
        this.score += this.fruitTypes[newType].points;
        this.updateDisplay();
        
        // Remove old fruits and add new one
        this.fruits.splice(Math.max(index1, index2), 1);
        this.fruits.splice(Math.min(index1, index2), 1);
        this.fruits.push(newFruit);
    }
    
    createMergeBubbles(x, y) {
        // Play merge sound
        if (this.sounds.merge) this.sounds.merge();

        // Reduce bubbles on mobile for performance
        const bubbleCount = this.isMobile ? 8 : 15;
        for (let i = 0; i < bubbleCount; i++) {
            const angle = (Math.PI * 2 * i) / bubbleCount;
            const speed = Math.random() * 4 + 3;
            const bubble = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1, // Float upward
                size: Math.random() * 8 + 4,
                life: 1,
                decay: this.isMobile ? 0.02 : 0.012, // Faster decay on mobile
                color: `hsl(${Math.random() * 60 + 30}, 80%, 70%)` // Golden colors
            };

            // Add to a temporary container for merge effects
            if (!this.mergeBubbles) this.mergeBubbles = [];
            this.mergeBubbles.push(bubble);
        }
    }

    checkGameOver() {
        for (const fruit of this.fruits) {
            // Don't check game over for fruits that just dropped
            if (fruit.justDropped) continue;

            // Check if fruit is above the danger line and has settled
            if (fruit.y - fruit.size < 80 && Math.abs(fruit.vy) < 1) {
                this.gameOver();
                return;
            }
        }
    }

    gameOver() {
        this.gameRunning = false;

        // Play game over sound
        if (this.sounds.gameOver) this.sounds.gameOver();

        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            document.getElementById('best-score').textContent = this.bestScore;
        }

        // Show game over modal
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-modal').style.display = 'flex';
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(1, '#bbdefb');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw danger line
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 80);
        this.ctx.lineTo(this.canvas.width, 80);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Add danger zone text
        this.ctx.fillStyle = 'rgba(255, 107, 107, 0.6)';
        this.ctx.font = '12px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DANGER ZONE', this.canvas.width / 2, 70);

        // Draw preview fruit
        if (this.gameRunning && !this.isPaused) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.font = `${this.fruitTypes[this.nextFruitType].size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.fruitTypes[this.nextFruitType].emoji, this.dropX, 90);
            this.ctx.globalAlpha = 1;
        }

        // Draw merge bubbles first
        for (const bubble of this.mergeBubbles) {
            this.ctx.globalAlpha = bubble.life * 0.8;
            this.ctx.fillStyle = bubble.color;
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw fruits and bubbles
        for (const fruit of this.fruits) {
            // Draw bubbles first (behind fruit)
            for (const bubble of fruit.bubbles) {
                this.ctx.globalAlpha = bubble.life * 0.6;
                this.ctx.fillStyle = `hsl(${Math.random() * 60 + 180}, 70%, 80%)`;
                this.ctx.beginPath();
                this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw fruit shadow
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(fruit.x + 2, fruit.y + 2, fruit.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw fruit
            this.ctx.globalAlpha = 1;
            this.ctx.font = `${fruit.size * 1.5}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif`;
            this.ctx.fillText(fruit.emoji, fruit.x, fruit.y);
        }

        // Draw pause overlay
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Arial, sans-serif';
            this.ctx.fillText('⏸️', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Poppins, Arial, sans-serif';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }

    gameLoop(currentTime = 0) {
        // Frame rate limiting for mobile performance
        if (currentTime - this.lastFrameTime >= this.frameInterval) {
            this.updatePhysics();
            this.render();
            this.lastFrameTime = currentTime;
            this.frameCount++;
        }

        if (this.gameRunning) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
    }

    updateNextFruit() {
        document.getElementById('next-fruit').textContent = this.fruitTypes[this.nextFruitType].emoji;
    }

    updateCopyright() {
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';

        if (!this.isPaused && this.gameRunning) {
            this.gameLoop();
        }
    }

    toggleMute() {
        this.audioEnabled = !this.audioEnabled;
        const muteBtn = document.getElementById('mute-btn');
        muteBtn.textContent = this.audioEnabled ? '🔊 Sound' : '🔇 Muted';

        // Store preference
        localStorage.setItem('audioEnabled', this.audioEnabled);
    }

    restart() {
        this.fruits = [];
        this.mergeBubbles = [];
        this.score = 0;
        this.gameRunning = true;
        this.isPaused = false;
        this.nextFruitType = Math.floor(Math.random() * 5);
        this.frameCount = 0;
        this.lastFrameTime = 0;

        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('pause-btn').textContent = '⏸️ Pause';
        document.getElementById('mute-btn').textContent = this.audioEnabled ? '🔊 Sound' : '🔇 Muted';

        this.updateDisplay();
        this.updateNextFruit();
        this.gameLoop();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FruitMergeGame();
});
