// Fruit Fusion Game - Main Game Class
class FruitFusionGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.fruits = [];
        this.score = 0;
        this.level = 1;
        this.bestScore = localStorage.getItem('fruitFusionBestScore') || 0;
        this.gameRunning = true;
        this.isPaused = false;
        this.gameOver = false;
        
        // Enhanced mobile detection
        this.isMobile = this.detectMobile();
        
        // Fruit types with emojis, sizes, and properties
        const sizeMultiplier = this.isMobile ? 0.8 : 1.0;
        this.fruitTypes = [
            { emoji: '🍒', size: Math.round(18 * sizeMultiplier), points: 1, mass: 1, color: '#dc2626' },   // Red cherry
            { emoji: '🍇', size: Math.round(22 * sizeMultiplier), points: 3, mass: 2, color: '#7c3aed' },   // Purple grape
            { emoji: '🍓', size: Math.round(26 * sizeMultiplier), points: 6, mass: 3, color: '#ec4899' },   // Pink strawberry
            { emoji: '🍋', size: Math.round(30 * sizeMultiplier), points: 10, mass: 5, color: '#eab308' },  // Yellow lemon
            { emoji: '🍊', size: Math.round(34 * sizeMultiplier), points: 15, mass: 8, color: '#ea580c' },  // Orange
            { emoji: '🍎', size: Math.round(38 * sizeMultiplier), points: 21, mass: 12, color: '#dc2626' }, // Red apple
            { emoji: '🍑', size: Math.round(42 * sizeMultiplier), points: 28, mass: 17, color: '#b91c1c' }, // Dark red cherry
            { emoji: '🍌', size: Math.round(46 * sizeMultiplier), points: 36, mass: 23, color: '#facc15' }, // Bright yellow banana
            { emoji: '🍍', size: Math.round(50 * sizeMultiplier), points: 45, mass: 30, color: '#f59e0b' }, // Golden pineapple
            { emoji: '🥭', size: Math.round(54 * sizeMultiplier), points: 55, mass: 38, color: '#f97316' }, // Orange mango
            { emoji: '🍉', size: Math.round(58 * sizeMultiplier), points: 66, mass: 47, color: '#16a34a' }  // Green watermelon
        ];
        
        this.nextFruitType = Math.floor(Math.random() * 5); // Only first 5 types can drop initially
        this.dropX = 200;
        this.mergeBubbles = [];
        this.particles = [];
        this.combos = 0;
        this.maxCombo = 0;
        
        // Physics like sample-1 (Matter.js equivalent)
        this.gravity = this.isMobile ? 0.4 : 0.5;
        this.friction = 0.4; // Like Matter.js friction: 0.4
        this.restitution = 0.3; // Like Matter.js restitution: 0.3 (small bounce)
        this.airResistance = 0.999;
        
        // Performance settings
        this.maxBubbles = this.isMobile ? 3 : 6;
        this.maxParticles = this.isMobile ? 10 : 20;
        this.frameCount = 0;
        this.targetFPS = this.isMobile ? 30 : 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;

        // Performance monitoring
        this.performanceMonitor = {
            frameTime: 0,
            avgFrameTime: 16.67, // 60fps baseline
            frameHistory: [],
            maxHistory: 60
        };
        
        // Visual effects (PC only)
        this.sparkles = [];
        this.ripples = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        
        // Audio system
        this.audioEnabled = localStorage.getItem('fruitFusionAudio') !== 'false';
        this.audioContext = null;
        this.sounds = {};
        
        // Drop control
        this.lastDropTime = 0;
        this.dropCooldown = this.isMobile ? 500 : 300;
        this.canDrop = true;
        
        // Game boundaries
        this.wallThickness = 4;
        this.floorY = this.canvas.height - this.wallThickness;
        this.gameOverLine = this.canvas.height * 0.15; // 15% from top
        
        this.init();
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 600;
        return isMobileUA || (hasTouch && isSmallScreen);
    }

    init() {
        this.setupCanvas();
        this.setupAudio();
        this.setupEventListeners();
        this.updateUI();
        this.showLoadingScreen();
        
        // Start game loop after loading
        setTimeout(() => {
            this.hideLoadingScreen();
            this.gameLoop();
        }, 2000);
    }

    setupCanvas() {
        try {
            // Set canvas size based on container
            const container = this.canvas.parentElement;
            const containerWidth = container.clientWidth;
            const maxWidth = this.isMobile ? Math.min(containerWidth - 20, 350) : 400;

            this.canvas.width = maxWidth;
            this.canvas.height = this.isMobile ? Math.min(window.innerHeight * 0.6, 500) : 600;

            // Update game boundaries
            this.floorY = this.canvas.height - this.wallThickness;
            this.gameOverLine = this.canvas.height * 0.15; // Update game over line
            this.dropX = this.canvas.width / 2;

            // Set canvas style
            this.canvas.style.width = maxWidth + 'px';
            this.canvas.style.height = this.canvas.height + 'px';

            // Enable hardware acceleration if available
            this.ctx.imageSmoothingEnabled = !this.isMobile;
            this.ctx.imageSmoothingQuality = this.isMobile ? 'low' : 'high';
        } catch (error) {
            console.error('Canvas setup error:', error);
        }
    }

    setupAudio() {
        if (!this.audioEnabled) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.audioEnabled = false;
        }
    }

    createSounds() {
        // Create dramatic sound effects using Web Audio API
        this.sounds = {
            drop: this.createDropSound(),
            merge: this.createMergeSound(),
            combo: this.createComboSound(),
            gameOver: this.createGameOverSound(),
            levelUp: this.createLevelUpSound(),
            bigMerge: this.createBigMergeSound()
        };

        // Background music
        this.createBackgroundMusic();
    }

    createDropSound() {
        return () => {
            if (!this.audioEnabled || !this.audioContext) return;

            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();

                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
                oscillator.type = 'sine';

                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);

                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.15);
            } catch (error) {
                console.warn('Audio playback error:', error);
            }
        };
    }

    createMergeSound() {
        return () => {
            if (!this.audioEnabled || !this.audioContext) return;

            // Create a more complex merge sound with multiple oscillators
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();

            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(filterNode);
            filterNode.connect(this.audioContext.destination);

            oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
            oscillator1.type = 'triangle';

            oscillator2.frequency.setValueAtTime(660, this.audioContext.currentTime);
            oscillator2.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.2);
            oscillator2.type = 'sine';

            filterNode.type = 'bandpass';
            filterNode.frequency.setValueAtTime(800, this.audioContext.currentTime);
            filterNode.Q.setValueAtTime(5, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            oscillator1.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 0.3);
            oscillator2.start(this.audioContext.currentTime);
            oscillator2.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createComboSound() {
        return () => {
            if (!this.audioEnabled || !this.audioContext) return;

            // Dramatic combo sound with ascending notes
            const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)

            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filterNode = this.audioContext.createBiquadFilter();

                    oscillator.connect(filterNode);
                    filterNode.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'triangle';

                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);

                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                }, index * 100);
            });
        };
    }

    createGameOverSound() {
        return () => {
            if (!this.audioEnabled || !this.audioContext) return;

            // Dramatic descending game over sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();

            oscillator.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1.0);
            oscillator.type = 'sawtooth';

            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filterNode.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 1.0);

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.2);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1.2);
        };
    }

    createLevelUpSound() {
        return () => {
            if (!this.audioEnabled || !this.audioContext) return;

            // Triumphant level up sound
            const frequencies = [523, 659, 784, 1047, 1319]; // C major scale

            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'triangle';

                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, index * 80);
            });
        };
    }

    createBigMergeSound() {
        return () => {
            if (!this.audioEnabled || !this.audioContext) return;

            // Special sound for big fruit merges
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const oscillator3 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();

            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            oscillator3.connect(gainNode);
            gainNode.connect(filterNode);
            filterNode.connect(this.audioContext.destination);

            oscillator1.frequency.setValueAtTime(220, this.audioContext.currentTime);
            oscillator1.type = 'sine';

            oscillator2.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator2.type = 'triangle';

            oscillator3.frequency.setValueAtTime(880, this.audioContext.currentTime);
            oscillator3.type = 'sawtooth';

            filterNode.type = 'bandpass';
            filterNode.frequency.setValueAtTime(600, this.audioContext.currentTime);
            filterNode.Q.setValueAtTime(10, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator1.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 0.5);
            oscillator2.start(this.audioContext.currentTime);
            oscillator2.stop(this.audioContext.currentTime + 0.5);
            oscillator3.start(this.audioContext.currentTime);
            oscillator3.stop(this.audioContext.currentTime + 0.5);
        };
    }

    createBackgroundMusic() {
        if (!this.audioEnabled || !this.audioContext) return;

        // Simple ambient background music
        this.backgroundMusic = {
            playing: false,
            oscillators: [],
            gainNode: null
        };

        this.startBackgroundMusic();
    }

    startBackgroundMusic() {
        if (!this.audioEnabled || !this.audioContext || this.backgroundMusic.playing) return;

        this.backgroundMusic.playing = true;
        this.backgroundMusic.gainNode = this.audioContext.createGain();
        this.backgroundMusic.gainNode.connect(this.audioContext.destination);
        this.backgroundMusic.gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime); // Very quiet

        // Create ambient chord progression
        const chords = [
            [261.63, 329.63, 392.00], // C major
            [293.66, 369.99, 440.00], // D minor
            [329.63, 415.30, 493.88], // E minor
            [349.23, 440.00, 523.25]  // F major
        ];

        let chordIndex = 0;

        const playChord = () => {
            if (!this.backgroundMusic.playing) return;

            const chord = chords[chordIndex];
            const oscillators = [];

            chord.forEach(freq => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.backgroundMusic.gainNode);

                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
                gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3.5);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 4);

                oscillators.push(oscillator);
            });

            chordIndex = (chordIndex + 1) % chords.length;

            setTimeout(playChord, 4000); // Play next chord after 4 seconds
        };

        playChord();
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.playing) {
            this.backgroundMusic.playing = false;
            if (this.backgroundMusic.gainNode) {
                this.backgroundMusic.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
            }
        }
    }

    setupEventListeners() {
        // Canvas click/touch events
        this.canvas.addEventListener('click', (e) => this.handleDrop(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleDrop(e.touches[0]);
        });
        
        // Mouse move for drop indicator
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        
        // Game controls
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleAudio());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
        
        // Modal controls
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-from-pause-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('share-score-btn').addEventListener('click', () => this.shareScore());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleMouseMove(e) {
        if (this.gameOver || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        
        // Update drop position
        const fruitSize = this.fruitTypes[this.nextFruitType].size;
        this.dropX = Math.max(fruitSize, Math.min(this.canvas.width - fruitSize, x));
        
        // Update drop indicator
        const indicator = document.getElementById('drop-indicator');
        if (indicator) {
            indicator.style.left = (this.dropX / this.canvas.width * 100) + '%';
            indicator.classList.add('active');
        }
    }

    handleDrop(e) {
        if (!this.canDrop || this.gameOver || this.isPaused) return;

        const now = Date.now();
        if (now - this.lastDropTime < this.dropCooldown) return;

        this.lastDropTime = now;
        this.canDrop = false;

        // Create new fruit at safe drop position
        const fruitType = this.nextFruitType;
        const fruitSize = this.fruitTypes[fruitType].size;
        const dropY = Math.max(fruitSize + 10, 40); // Safe drop position from top
        const fruit = this.createFruit(this.dropX, dropY, fruitType);
        this.fruits.push(fruit);



        // Generate next fruit
        this.nextFruitType = Math.floor(Math.random() * Math.min(5, this.level + 2));
        this.updateNextFruitDisplay();

        // Play drop sound
        if (this.sounds.drop) this.sounds.drop();

        // Reset drop cooldown
        setTimeout(() => {
            this.canDrop = true;
        }, this.dropCooldown);
    }

    createFruit(x, y, type) {
        const fruitData = this.fruitTypes[type];
        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.5, // Small random horizontal velocity for variety
            vy: 0,
            radius: fruitData.size,
            type: type,
            emoji: fruitData.emoji,
            points: fruitData.points,
            mass: fruitData.mass,
            color: fruitData.color,
            id: Date.now() + Math.random(), // Unique ID like sample-2
            merged: false,
            merging: false, // Add merging flag
            justDropped: true, // Add justDropped flag like sample-2
            bubble: this.createBubble(x, y, fruitData.size)
        };
    }

    createBubble(x, y, radius) {
        return {
            x: x,
            y: y,
            radius: radius + 3,
            opacity: 0.25,
            pulsePhase: Math.random() * Math.PI * 2,
            shimmer: Math.random() * Math.PI * 2,
            baseOpacity: 0.25
        };
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;

        // Performance monitoring
        this.updatePerformanceMonitor(deltaTime);

        if (deltaTime < this.frameInterval) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        this.lastFrameTime = now;

        if (!this.isPaused && !this.gameOver) {
            this.update();
        }
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    updatePerformanceMonitor(deltaTime) {
        this.performanceMonitor.frameTime = deltaTime;
        this.performanceMonitor.frameHistory.push(deltaTime);

        if (this.performanceMonitor.frameHistory.length > this.performanceMonitor.maxHistory) {
            this.performanceMonitor.frameHistory.shift();
        }

        // Calculate average frame time
        const sum = this.performanceMonitor.frameHistory.reduce((a, b) => a + b, 0);
        this.performanceMonitor.avgFrameTime = sum / this.performanceMonitor.frameHistory.length;

        // Auto-adjust quality if performance is poor
        if (this.performanceMonitor.avgFrameTime > 33.33 && !this.isMobile) { // Below 30fps
            this.autoReduceQuality();
        }
    }

    autoReduceQuality() {
        // Reduce particle count if performance is poor
        if (this.maxParticles > 5) {
            this.maxParticles = Math.max(5, this.maxParticles - 2);
            console.log('Auto-reduced particle count for better performance');
        }

        // Reduce bubble effects
        if (this.maxBubbles > 3) {
            this.maxBubbles = Math.max(3, this.maxBubbles - 1);
            console.log('Auto-reduced bubble effects for better performance');
        }
    }

    update() {
        this.frameCount++;

        // Update physics
        this.updatePhysics();

        // Check for merges
        this.checkMerges();

        // Update particles and effects
        this.updateParticles();
        this.updateBubbles();

        // Check game over
        this.checkGameOver();

        // Update level
        this.updateLevel();

        // Minimal debug info
        if (this.frameCount % 1800 === 0) { // Every 30 seconds
            console.log(`🍎 Fruits: ${this.fruits.length}, Score: ${this.score}`);
        }
    }

    updatePhysics() {
        for (let i = 0; i < this.fruits.length; i++) {
            const fruit = this.fruits[i];

            // Remove justDropped flag after some time (like sample-2)
            if (fruit.justDropped) {
                if (!fruit.dropTime) {
                    fruit.dropTime = Date.now();
                } else if (Date.now() - fruit.dropTime > 500) { // 500ms delay
                    fruit.justDropped = false;
                }
            }

            // Apply gravity
            fruit.vy += this.gravity;

            // Apply air resistance
            fruit.vx *= this.airResistance;
            fruit.vy *= this.airResistance;

            // Update position
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;

            // Wall collisions
            this.handleWallCollisions(fruit);

            // Fruit-to-fruit collisions
            for (let j = i + 1; j < this.fruits.length; j++) {
                this.handleFruitCollision(fruit, this.fruits[j]);
            }

            // Update bubble position
            fruit.bubble.x = fruit.x;
            fruit.bubble.y = fruit.y;
        }
    }

    handleWallCollisions(fruit) {
        // Left wall - small bounce like Matter.js
        if (fruit.x - fruit.radius < this.wallThickness) {
            fruit.x = this.wallThickness + fruit.radius;
            fruit.vx = -fruit.vx * this.restitution;
        }

        // Right wall - small bounce like Matter.js
        if (fruit.x + fruit.radius > this.canvas.width - this.wallThickness) {
            fruit.x = this.canvas.width - this.wallThickness - fruit.radius;
            fruit.vx = -fruit.vx * this.restitution;
        }

        // Floor - small bounce like Matter.js
        if (fruit.y + fruit.radius > this.floorY) {
            fruit.y = this.floorY - fruit.radius;
            fruit.vy = -fruit.vy * this.restitution;
            fruit.vx *= this.friction; // Apply friction
        }
    }

    handleFruitCollision(fruit1, fruit2) {
        const dx = fruit2.x - fruit1.x;
        const dy = fruit2.y - fruit1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = fruit1.radius + fruit2.radius;

        if (distance < minDistance && distance > 0) {
            // Separate fruits gently
            const overlap = minDistance - distance;
            const separationX = (dx / distance) * overlap * 0.5;
            const separationY = (dy / distance) * overlap * 0.5;

            fruit1.x -= separationX;
            fruit1.y -= separationY;
            fruit2.x += separationX;
            fruit2.y += separationY;

            // Simple collision like Matter.js
            const normalX = dx / distance;
            const normalY = dy / distance;

            const relativeVelocityX = fruit2.vx - fruit1.vx;
            const relativeVelocityY = fruit2.vy - fruit1.vy;
            const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

            if (velocityAlongNormal > 0) return;

            // Apply restitution like Matter.js
            const impulse = -(1 + this.restitution) * velocityAlongNormal;
            const totalMass = fruit1.mass + fruit2.mass;
            const impulse1 = impulse * fruit2.mass / totalMass;
            const impulse2 = impulse * fruit1.mass / totalMass;

            fruit1.vx -= impulse1 * normalX;
            fruit1.vy -= impulse1 * normalY;
            fruit2.vx += impulse2 * normalX;
            fruit2.vy += impulse2 * normalY;
        }
    }

    checkMerges() {
        // Create a snapshot of fruits to avoid array modification issues
        const fruitsSnapshot = [...this.fruits];

        for (let i = 0; i < fruitsSnapshot.length; i++) {
            for (let j = i + 1; j < fruitsSnapshot.length; j++) {
                const fruit1 = fruitsSnapshot[i];
                const fruit2 = fruitsSnapshot[j];

                // Skip if fruits don't exist anymore (could be removed by previous merge)
                if (!fruit1 || !fruit2) continue;

                // Find current indices in the live fruits array
                const currentIndex1 = this.fruits.findIndex(f => f && f.id === fruit1.id);
                const currentIndex2 = this.fruits.findIndex(f => f && f.id === fruit2.id);

                // Skip if fruits no longer exist in live array
                if (currentIndex1 === -1 || currentIndex2 === -1) continue;

                const liveFruit1 = this.fruits[currentIndex1];
                const liveFruit2 = this.fruits[currentIndex2];

                // STRICT type checking for merging
                if (liveFruit1.type === liveFruit2.type &&
                    liveFruit1.emoji === liveFruit2.emoji &&
                    liveFruit1.type < this.fruitTypes.length - 1 &&
                    typeof liveFruit1.type === 'number' &&
                    typeof liveFruit2.type === 'number' &&
                    !liveFruit1.merging && !liveFruit2.merging) {

                    const dx = liveFruit1.x - liveFruit2.x;
                    const dy = liveFruit1.y - liveFruit2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = liveFruit1.radius + liveFruit2.radius + 2;

                    if (distance < minDistance && distance > 0) {
                        // Add delay to prevent immediate merging on drop
                        if (!liveFruit1.justDropped && !liveFruit2.justDropped) {

                            // FINAL VALIDATION - absolutely ensure they're the same
                            if (liveFruit1.type === liveFruit2.type &&
                                liveFruit1.emoji === liveFruit2.emoji &&
                                liveFruit1.type + 1 < this.fruitTypes.length) {

                                this.mergeFruits(currentIndex1, currentIndex2);
                                return; // Exit after first merge to prevent conflicts
                            }
                        }
                    }
                }
            }
        }
    }

    mergeFruits(index1, index2) {
        // Validate indices are still valid
        if (index1 >= this.fruits.length || index2 >= this.fruits.length || index1 < 0 || index2 < 0) {
            return;
        }

        const fruit1 = this.fruits[index1];
        const fruit2 = this.fruits[index2];

        // Double-check that fruits exist and are the same type
        if (!fruit1 || !fruit2) {
            return;
        }

        // STRICT validation - must be exactly the same
        if (fruit1.type !== fruit2.type || fruit1.emoji !== fruit2.emoji) {
            return;
        }

        // Prevent merging if either fruit is already being processed
        if (fruit1.merging || fruit2.merging) {
            return;
        }

        // Mark fruits as being merged to prevent double-processing
        fruit1.merging = true;
        fruit2.merging = true;

        // Validate merge is possible
        if (fruit1.type >= this.fruitTypes.length - 1) {
            fruit1.merging = false;
            fruit2.merging = false;
            return;
        }

        // TRIPLE CHECK before creating new fruit
        if (fruit1.type !== fruit2.type || fruit1.emoji !== fruit2.emoji) {
            fruit1.merging = false;
            fruit2.merging = false;
            return;
        }

        // Create new merged fruit
        const newType = fruit1.type + 1;

        // Validate new type exists
        if (newType >= this.fruitTypes.length) {
            fruit1.merging = false;
            fruit2.merging = false;
            return;
        }

        const newFruitData = this.fruitTypes[newType];

        const newFruit = {
            x: (fruit1.x + fruit2.x) / 2,
            y: (fruit1.y + fruit2.y) / 2,
            vx: 0, // NO initial velocity - fruit should settle calmly
            vy: 0, // NO initial velocity - no bouncing or jumping
            radius: newFruitData.size,
            type: newType,
            emoji: newFruitData.emoji,
            points: newFruitData.points,
            mass: newFruitData.mass,
            color: newFruitData.color,
            id: Date.now() + Math.random(),
            merged: false,
            merging: false,
            justDropped: false,
            bubble: this.createBubble((fruit1.x + fruit2.x) / 2, (fruit1.y + fruit2.y) / 2, newFruitData.size)
        };

        // Create merge effects
        this.createMergeEffects(newFruit.x, newFruit.y, newType);

        // Update score
        this.score += this.fruitTypes[newType].points;
        this.combos++;
        this.maxCombo = Math.max(this.maxCombo, this.combos);

        // Play merge sound
        if (this.sounds.merge) this.sounds.merge();

        // NO SCREEN SHAKE - causes panel issues like in sample-2

        // Remove old fruits safely (higher index first to avoid shifting)
        const higherIndex = Math.max(index1, index2);
        const lowerIndex = Math.min(index1, index2);

        this.fruits.splice(higherIndex, 1);
        this.fruits.splice(lowerIndex, 1);

        // Add new fruit
        this.fruits.push(newFruit);

        this.updateUI();
    }

    createMergeEffects(x, y, fruitType) {
        // Create particles
        for (let i = 0; i < (this.isMobile ? 3 : 6); i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.02,
                color: this.fruitTypes[fruitType].color,
                size: Math.random() * 4 + 2
            });
        }

        // Create ripple effect for PC
        if (!this.isMobile) {
            this.ripples.push({
                x: x,
                y: y,
                radius: 0,
                maxRadius: 50,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // Gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Limit particles for performance
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }
    }

    updateBubbles() {
        this.fruits.forEach(fruit => {
            if (fruit.bubble) {
                // Update bubble position to follow fruit
                fruit.bubble.x = fruit.x;
                fruit.bubble.y = fruit.y;

                // Gentle pulsing animation
                fruit.bubble.pulsePhase += 0.03;
                fruit.bubble.shimmer += 0.02;

                // Smooth opacity animation
                const pulse = Math.sin(fruit.bubble.pulsePhase) * 0.08;
                const shimmer = Math.sin(fruit.bubble.shimmer) * 0.05;
                fruit.bubble.opacity = fruit.bubble.baseOpacity + pulse + shimmer;

                // Slight size variation for organic feel
                const sizeVariation = Math.sin(fruit.bubble.pulsePhase * 0.7) * 1;
                fruit.bubble.currentRadius = fruit.bubble.radius + sizeVariation;
            }
        });
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // NO SCREEN SHAKE - causes panel flicker and movement issues

        // Draw background gradient
        this.drawBackground();

        // Draw game boundaries
        this.drawBoundaries();

        // Draw danger line
        this.drawDangerLine();

        // Draw bubbles first (behind fruits)
        this.drawBubbles();

        // Draw fruits
        this.drawFruits();

        // Draw particles and effects
        this.drawParticles();
        this.drawRipples();

        // Draw UI elements
        this.drawDropIndicator();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(0.5, '#bbdefb');
        gradient.addColorStop(1, '#90caf9');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBoundaries() {
        this.ctx.fillStyle = '#4a5568';

        // Left wall
        this.ctx.fillRect(0, 0, this.wallThickness, this.canvas.height);

        // Right wall
        this.ctx.fillRect(this.canvas.width - this.wallThickness, 0, this.wallThickness, this.canvas.height);

        // Floor
        this.ctx.fillRect(0, this.floorY, this.canvas.width, this.wallThickness);
    }

    drawDangerLine() {
        this.ctx.strokeStyle = '#ff4757';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.wallThickness, this.gameOverLine);
        this.ctx.lineTo(this.canvas.width - this.wallThickness, this.gameOverLine);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawBubbles() {
        this.fruits.forEach(fruit => {
            if (fruit.bubble) {
                const bubble = fruit.bubble;
                this.ctx.save();
                this.ctx.globalAlpha = bubble.opacity;

                // Main bubble with gradient
                const gradient = this.ctx.createRadialGradient(
                    bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, 0,
                    bubble.x, bubble.y, bubble.currentRadius || bubble.radius
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
                gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(bubble.x, bubble.y, bubble.currentRadius || bubble.radius, 0, Math.PI * 2);
                this.ctx.fill();

                // Add subtle highlight for PC only
                if (!this.isMobile) {
                    this.ctx.globalAlpha = bubble.opacity * 0.6;
                    const highlight = this.ctx.createRadialGradient(
                        bubble.x - bubble.radius * 0.4, bubble.y - bubble.radius * 0.4, 0,
                        bubble.x - bubble.radius * 0.4, bubble.y - bubble.radius * 0.4, bubble.radius * 0.3
                    );
                    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    this.ctx.fillStyle = highlight;
                    this.ctx.beginPath();
                    this.ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.3, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.restore();
            }
        });
    }

    drawFruits() {
        this.fruits.forEach(fruit => {
            this.ctx.save();

            // Draw fruit shadow
            if (!this.isMobile) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.beginPath();
                this.ctx.arc(fruit.x + 2, fruit.y + 2, fruit.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Draw fruit background circle
            this.ctx.fillStyle = fruit.color;
            this.ctx.beginPath();
            this.ctx.arc(fruit.x, fruit.y, fruit.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw fruit emoji with better font handling
            const fontSize = Math.max(12, fruit.radius * 1.2);
            this.ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#000';

            // Fallback: if emoji doesn't render, draw a colored circle with text
            try {
                this.ctx.fillText(fruit.emoji, fruit.x, fruit.y);
            } catch (error) {
                // Fallback rendering
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${fontSize * 0.6}px Arial`;
                this.ctx.fillText(fruit.type + 1, fruit.x, fruit.y);
            }

            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    drawRipples() {
        if (this.isMobile) return;

        this.ripples.forEach(ripple => {
            this.ctx.save();
            this.ctx.globalAlpha = ripple.life;
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();

            ripple.radius += 2;
            ripple.life -= ripple.decay;
        });

        // Remove dead ripples
        this.ripples = this.ripples.filter(ripple => ripple.life > 0);
    }

    drawDropIndicator() {
        if (this.gameOver || this.isPaused) return;

        const fruitSize = this.fruitTypes[this.nextFruitType].size;

        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.arc(this.dropX, 50, fruitSize, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    // Screen shake removed - causes panel flicker and movement issues



    checkGameOver() {
        // Only check game over if fruits have settled (not just dropped)
        for (const fruit of this.fruits) {
            if (fruit.y - fruit.radius < this.gameOverLine && Math.abs(fruit.vy) < 1) {
                // Give a grace period before game over
                if (!fruit.gameOverTimer) {
                    fruit.gameOverTimer = Date.now();
                } else if (Date.now() - fruit.gameOverTimer > 2000) { // 2 second grace period
                    this.endGame();
                    return;
                }
            } else {
                fruit.gameOverTimer = null;
            }
        }
    }

    updateLevel() {
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateUI();

            // Play level up sound
            if (this.sounds.levelUp) this.sounds.levelUp();
        }
    }

    endGame() {
        this.gameOver = true;
        this.gameRunning = false;

        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('fruitFusionBestScore', this.bestScore);
        }

        // Play game over sound
        if (this.sounds.gameOver) this.sounds.gameOver();

        // Show game over modal
        this.showGameOverModal();
    }

    restartGame() {
        this.fruits = [];
        this.particles = [];
        this.mergeBubbles = [];
        this.ripples = [];
        this.score = 0;
        this.level = 1;
        this.combos = 0;
        this.maxCombo = 0;
        this.gameOver = false;
        this.gameRunning = true;
        this.isPaused = false;
        this.canDrop = true;
        this.nextFruitType = Math.floor(Math.random() * 5);

        this.hideGameOverModal();
        this.hidePauseModal();
        this.updateUI();
        this.updateNextFruitDisplay();
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.showPauseModal();
        } else {
            this.hidePauseModal();
        }

        this.updatePauseButton();
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        localStorage.setItem('fruitFusionAudio', this.audioEnabled);
        this.updateMuteButton();

        if (this.audioEnabled && !this.audioContext) {
            this.setupAudio();
        } else if (!this.audioEnabled) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen not supported:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    shareScore() {
        const text = `I just scored ${this.score} points in Fruit Fusion! 🍎🎮`;

        if (navigator.share) {
            navigator.share({
                title: 'Fruit Fusion Score',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('Score copied to clipboard!');
            }).catch(() => {
                alert(`My score: ${this.score} points!`);
            });
        }
    }



    handleKeyboard(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (!this.gameOver) {
                    this.handleDrop({ clientX: this.dropX });
                }
                break;
            case 'KeyP':
                this.togglePause();
                break;
            case 'KeyR':
                this.restartGame();
                break;
            case 'KeyM':
                this.toggleAudio();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.dropX = Math.max(this.fruitTypes[this.nextFruitType].size, this.dropX - 20);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.dropX = Math.min(this.canvas.width - this.fruitTypes[this.nextFruitType].size, this.dropX + 20);
                break;
        }
    }

    handleResize() {
        setTimeout(() => {
            this.setupCanvas();
        }, 100);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('best-score').textContent = this.bestScore.toLocaleString();
        document.getElementById('level').textContent = this.level;
    }

    updateNextFruitDisplay() {
        const nextFruitElement = document.getElementById('next-fruit');
        if (nextFruitElement) {
            nextFruitElement.textContent = this.fruitTypes[this.nextFruitType].emoji;
        }
    }

    updatePauseButton() {
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        }
    }

    updateMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.textContent = this.audioEnabled ? '🔊 Sound' : '🔇 Muted';
        }
    }

    showGameOverModal() {
        const modal = document.getElementById('game-over-modal');
        const finalScore = document.getElementById('final-score');
        const finalLevel = document.getElementById('final-level');
        const bestFruit = document.getElementById('best-fruit');

        if (modal && finalScore && finalLevel && bestFruit) {
            finalScore.textContent = this.score.toLocaleString();
            finalLevel.textContent = this.level;

            // Find the highest fruit type achieved
            let maxFruitType = 0;
            this.fruits.forEach(fruit => {
                maxFruitType = Math.max(maxFruitType, fruit.type);
            });
            bestFruit.textContent = this.fruitTypes[maxFruitType].emoji;

            modal.style.display = 'flex';
        }
    }

    hideGameOverModal() {
        const modal = document.getElementById('game-over-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showPauseModal() {
        const modal = document.getElementById('pause-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hidePauseModal() {
        const modal = document.getElementById('pause-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('loading-progress');

        if (loadingScreen && progressBar) {
            loadingScreen.style.display = 'flex';

            // Simulate loading progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                progressBar.style.width = progress + '%';
            }, 200);
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Set current year in footer
        const currentYear = document.getElementById('current-year');
        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }

        // Initialize game
        window.fruitFusionGame = new FruitFusionGame();

        // Add performance info for debugging (remove in production)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setInterval(() => {
                if (window.fruitFusionGame && window.fruitFusionGame.performanceMonitor) {
                    const fps = 1000 / window.fruitFusionGame.performanceMonitor.avgFrameTime;
                    console.log(`FPS: ${fps.toFixed(1)}, Fruits: ${window.fruitFusionGame.fruits.length}`);
                }
            }, 5000);
        }

        // Prevent zoom on mobile
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevent pull-to-refresh
        let startY = 0;
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
        });

        document.addEventListener('touchmove', (e) => {
            const y = e.touches[0].pageY;
            if (y > startY && window.pageYOffset === 0) {
                e.preventDefault();
            }
        });

        // Handle visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (window.fruitFusionGame) {
                if (document.hidden) {
                    window.fruitFusionGame.isPaused = true;
                } else {
                    // Resume after a short delay
                    setTimeout(() => {
                        if (window.fruitFusionGame && !window.fruitFusionGame.gameOver) {
                            window.fruitFusionGame.isPaused = false;
                        }
                    }, 100);
                }
            }
        });

    } catch (error) {
        console.error('Game initialization error:', error);
        alert('Game failed to initialize. Please refresh the page.');
    }
});

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
