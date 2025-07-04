class FruitMergeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.fruits = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.gameRunning = true;
        this.isPaused = false;
        
        // Fruit types with emojis, sizes, and mass
        this.fruitTypes = [
            { emoji: '🍒', size: 20, points: 1, mass: 1 },
            { emoji: '🍇', size: 25, points: 3, mass: 2 },
            { emoji: '🍓', size: 30, points: 6, mass: 4 },
            { emoji: '🍋', size: 35, points: 10, mass: 7 },
            { emoji: '🍊', size: 40, points: 15, mass: 11 },
            { emoji: '🍎', size: 45, points: 21, mass: 16 },
            { emoji: '🍑', size: 50, points: 28, mass: 22 },
            { emoji: '🍌', size: 55, points: 36, mass: 29 },
            { emoji: '🍍', size: 60, points: 45, mass: 37 },
            { emoji: '🥭', size: 65, points: 55, mass: 46 },
            { emoji: '🍉', size: 70, points: 66, mass: 56 }
        ];
        
        this.nextFruitType = Math.floor(Math.random() * 5); // Only first 5 types can drop
        this.dropX = 200; // Will be set properly in setupCanvas
        this.mergeBubbles = []; // For merge effect bubbles

        // Performance optimization
        this.isMobile = window.innerWidth < 768;
        this.maxBubbles = this.isMobile ? 2 : 4; // Further reduce bubbles on mobile
        this.frameCount = 0;
        this.targetFPS = this.isMobile ? 30 : 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.skipPhysicsFrames = this.isMobile ? 2 : 1; // Skip physics every N frames on mobile

        // Audio system
        this.audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
        this.audioContext = null;
        this.sounds = {};

        // Drop throttling to prevent spam
        this.lastDropTime = 0;
        this.dropCooldown = this.isMobile ? 300 : 200; // ms between drops

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

        // Adjust for mobile with more compact sizes
        if (window.innerWidth < 480) {
            this.canvas.width = 340;
            this.canvas.height = 450;
        }
        if (window.innerWidth < 360) {
            this.canvas.width = 300;
            this.canvas.height = 400;
        }

        this.ctx.font = '30px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Set dropX to center after canvas is sized
        this.dropX = this.canvas.width / 2;

        // Mobile optimization
        if (this.isMobile) {
            this.ctx.imageSmoothingEnabled = false; // Disable for better performance
            // Reduce canvas quality for better performance
            this.canvas.style.imageRendering = 'pixelated';
        }
    }

    setupAudio() {
        // Create simple audio using Web Audio API for better performance
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Resume audio context on first user interaction (required by browsers)
            const resumeAudio = () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                document.removeEventListener('touchstart', resumeAudio);
                document.removeEventListener('click', resumeAudio);
            };

            document.addEventListener('touchstart', resumeAudio);
            document.addEventListener('click', resumeAudio);

            this.createSounds();
        } catch (e) {
            console.log('Audio not supported');
            this.audioEnabled = false;
        }
    }

    createSounds() {
        // Create more dramatic synthesized sounds
        this.sounds = {
            drop: () => this.playDropSound(),
            merge: () => this.playMergeSound(),
            gameOver: () => this.playGameOverSound()
        };
    }

    playDropSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {}
    }

    playMergeSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        try {
            // Create a more complex merge sound with multiple tones
            const frequencies = [400, 500, 600];
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioContext.currentTime + 0.3);
                oscillator.type = 'triangle';

                const startTime = this.audioContext.currentTime + (index * 0.05);
                gainNode.gain.setValueAtTime(0.15, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);
            });
        } catch (e) {}
    }

    playGameOverSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        try {
            // Dramatic descending sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.8);
            oscillator.type = 'sawtooth';

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.8);
        } catch (e) {}
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

        // Throttle drops to prevent spam
        const currentTime = Date.now();
        if (currentTime - this.lastDropTime < this.dropCooldown) {
            return;
        }
        this.lastDropTime = currentTime;

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
            mass: this.fruitTypes[fruitType].mass,
            emoji: this.fruitTypes[fruitType].emoji,
            id: Date.now() + Math.random(),
            bubbles: [],
            justDropped: true, // Flag to prevent immediate game over
            settled: false, // Flag to track if fruit has settled
            settleTime: 0, // Time since fruit stopped moving significantly
            merging: false, // Flag to prevent double-merging
            overlapTime: 0 // Track how long fruit has been overlapping
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

        // Subtle bubbles for visual appeal only
        const bubbleCount = this.isMobile ? 1 : 2;
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = {
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 1,
                life: 1,
                decay: this.isMobile ? 0.08 : 0.05 // Quick decay
            };
            this.fruits[this.fruits.length - 1].bubbles.push(bubble);
        }
    }
    
    updatePhysics() {
        if (this.isPaused) return;

        // Skip physics on some frames for mobile performance
        if (this.isMobile && this.frameCount % this.skipPhysicsFrames !== 0) {
            return;
        }

        const gravity = 0.3;
        const friction = 0.95;
        const bounce = 0; // No bounce - fruits don't bounce, they roll
        
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];

            // Apply gravity (same for all masses in this simplified model)
            fruit.vy += gravity;

            // Update position
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;

            // Apply mass-based friction - heavier objects have more inertia
            const massBasedFriction = friction + (fruit.mass * 0.001); // Slight increase for heavier fruits
            fruit.vx *= Math.min(massBasedFriction, 0.995);
            
            // Boundary collisions - fruits roll, don't bounce
            const margin = 2;

            // Left boundary - stop and settle
            if (fruit.x - fruit.size < margin) {
                fruit.x = fruit.size + margin;
                fruit.vx = 0; // Stop horizontal movement
            }

            // Right boundary - stop and settle
            if (fruit.x + fruit.size > this.canvas.width - margin) {
                fruit.x = this.canvas.width - fruit.size - margin;
                fruit.vx = 0; // Stop horizontal movement
            }

            // Bottom boundary - land and settle
            if (fruit.y + fruit.size > this.canvas.height - margin) {
                fruit.y = this.canvas.height - fruit.size - margin;
                fruit.vy = 0; // Stop vertical movement

                // Apply strong ground friction
                fruit.vx *= 0.8;

                // Stop small movements
                if (Math.abs(fruit.vx) < 0.1) fruit.vx = 0;
            }

            // Track fruit settling to prevent endless bouncing - mass-based thresholds
            const movementThreshold = fruit.mass > 20 ? 0.05 : 0.1; // Heavy objects settle easier
            const settleFrames = fruit.mass > 20 ? 15 : 30; // Heavy objects settle faster

            const isMoving = Math.abs(fruit.vx) > movementThreshold || Math.abs(fruit.vy) > movementThreshold;
            if (!isMoving) {
                fruit.settleTime += 1;
                if (fruit.settleTime > settleFrames) {
                    fruit.settled = true;
                    fruit.vx = 0;
                    fruit.vy = 0;
                }
            } else {
                fruit.settleTime = 0;
                fruit.settled = false;
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
        this.preventFruitCrushing(); // New function to prevent small fruits being crushed
        this.checkGameOver();
    }
    
    checkCollisions() {
        // Create a copy of fruits array to prevent modification during iteration
        const fruitsToCheck = [...this.fruits];

        for (let i = 0; i < fruitsToCheck.length; i++) {
            for (let j = i + 1; j < fruitsToCheck.length; j++) {
                const fruit1 = fruitsToCheck[i];
                const fruit2 = fruitsToCheck[j];

                // Skip if either fruit is being merged or doesn't exist
                if (!fruit1 || !fruit2 || fruit1.merging || fruit2.merging) {
                    continue;
                }

                const dx = fruit1.x - fruit2.x;
                const dy = fruit1.y - fruit2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                // Ensure proper separation distance
                const minDistance = fruit1.size + fruit2.size + 2; // Increased buffer

                if (distance < minDistance && distance > 0) {
                    // Track overlap time for persistent overlap detection
                    fruit1.overlapTime = (fruit1.overlapTime || 0) + 1;
                    fruit2.overlapTime = (fruit2.overlapTime || 0) + 1;

                    // STRICT type checking for merging
                    if (fruit1.type === fruit2.type &&
                        fruit1.type < this.fruitTypes.length - 1 &&
                        typeof fruit1.type === 'number' &&
                        typeof fruit2.type === 'number' &&
                        fruit1.emoji === fruit2.emoji) { // Extra validation

                        // Add delay to prevent immediate merging on drop
                        if (!fruit1.justDropped && !fruit2.justDropped) {
                            // Find current indices in the actual fruits array
                            const currentIndex1 = this.fruits.findIndex(f => f.id === fruit1.id);
                            const currentIndex2 = this.fruits.findIndex(f => f.id === fruit2.id);

                            if (currentIndex1 !== -1 && currentIndex2 !== -1) {
                                // Final validation before merge
                                const realFruit1 = this.fruits[currentIndex1];
                                const realFruit2 = this.fruits[currentIndex2];

                                if (realFruit1.type === realFruit2.type && realFruit1.emoji === realFruit2.emoji) {
                                    this.mergeFruits(currentIndex1, currentIndex2);
                                    return; // Exit after first merge to prevent conflicts
                                }
                            }
                        }
                    }

                    // Only apply collision response if not merging and fruits still exist
                    if ((fruit1.type !== fruit2.type || fruit1.type >= this.fruitTypes.length - 1) &&
                        !fruit1.merging && !fruit2.merging) {
                        // Mass-based collision response with strong separation
                        const overlap = minDistance - distance;
                        if (overlap > 0 && distance > 0) {
                            const totalMass = fruit1.mass + fruit2.mass;

                            // Gentle separation to prevent overlap without bouncing
                            const minSeparation = Math.max(overlap, 0.5); // Minimal separation
                            const separationForce = 1.0 + (overlap * 0.05); // Gentle base force

                            const separationX = (dx / distance) * minSeparation * separationForce;
                            const separationY = (dy / distance) * minSeparation * separationForce;

                            // Gentle mass-based movement
                            const massRatio1 = Math.max(0.2, fruit2.mass / totalMass); // Minimum 20% movement
                            const massRatio2 = Math.max(0.2, fruit1.mass / totalMass); // Minimum 20% movement

                            const moveX1 = separationX * massRatio1 * 0.3; // Much gentler movement
                            const moveY1 = separationY * massRatio1 * 0.3;
                            const moveX2 = -separationX * massRatio2 * 0.3;
                            const moveY2 = -separationY * massRatio2 * 0.3;

                            // Check boundaries before applying separation
                            const newX1 = fruit1.x + moveX1;
                            const newY1 = fruit1.y + moveY1;
                            const newX2 = fruit2.x + moveX2;
                            const newY2 = fruit2.y + moveY2;

                            // Strict boundary checking - never allow fruits to go out of bounds
                            const margin = 3; // Safety margin

                            // Check and apply X movement for fruit1
                            if (newX1 - fruit1.size >= margin && newX1 + fruit1.size <= this.canvas.width - margin) {
                                fruit1.x = newX1;
                            } else {
                                // Apply safe partial movement
                                const safeX = Math.max(fruit1.size + margin,
                                              Math.min(this.canvas.width - fruit1.size - margin, fruit1.x + moveX1 * 0.2));
                                fruit1.x = safeX;
                            }

                            // Check and apply Y movement for fruit1
                            if (newY1 - fruit1.size >= margin && newY1 + fruit1.size <= this.canvas.height - margin) {
                                fruit1.y = newY1;
                            } else {
                                // Apply safe partial movement
                                const safeY = Math.max(fruit1.size + margin,
                                              Math.min(this.canvas.height - fruit1.size - margin, fruit1.y + moveY1 * 0.2));
                                fruit1.y = safeY;
                            }

                            // Check and apply X movement for fruit2
                            if (newX2 - fruit2.size >= margin && newX2 + fruit2.size <= this.canvas.width - margin) {
                                fruit2.x = newX2;
                            } else {
                                // Apply safe partial movement
                                const safeX = Math.max(fruit2.size + margin,
                                              Math.min(this.canvas.width - fruit2.size - margin, fruit2.x + moveX2 * 0.2));
                                fruit2.x = safeX;
                            }

                            // Check and apply Y movement for fruit2
                            if (newY2 - fruit2.size >= margin && newY2 + fruit2.size <= this.canvas.height - margin) {
                                fruit2.y = newY2;
                            } else {
                                // Apply safe partial movement
                                const safeY = Math.max(fruit2.size + margin,
                                              Math.min(this.canvas.height - fruit2.size - margin, fruit2.y + moveY2 * 0.2));
                                fruit2.y = safeY;
                            }

                            // Strong separation impulse to prevent overlap
                            const relativeVx = fruit1.vx - fruit2.vx;
                            const relativeVy = fruit1.vy - fruit2.vy;
                            const speed = (relativeVx * dx + relativeVy * dy) / distance;

                            // Gentle rolling separation - no bouncing
                            let baseImpulse = Math.abs(speed) * 0.05; // Much gentler impulse

                            // Small boost for overlapping fruits
                            if (overlap > 2) {
                                baseImpulse *= (1 + overlap * 0.02);
                            }

                            // Minimal boost for persistent overlap
                            if (fruit1.overlapTime > 20 || fruit2.overlapTime > 20) {
                                baseImpulse *= 1.2;
                            }

                            // Heavy reduction for settled fruits - they should barely move
                            if (fruit1.settled) baseImpulse *= 0.1;
                            if (fruit2.settled) baseImpulse *= 0.1;

                            // Very gentle impulse
                            const impulse1 = baseImpulse * massRatio1;
                            const impulse2 = baseImpulse * massRatio2;

                            const normalX = dx / distance;
                            const normalY = dy / distance;

                            // Apply very gentle separation - mostly horizontal
                            fruit1.vx -= impulse1 * normalX * 0.5; // Reduced horizontal
                            fruit1.vy -= impulse1 * normalY * 0.2; // Much reduced vertical
                            fruit2.vx += impulse2 * normalX * 0.5;
                            fruit2.vy += impulse2 * normalY * 0.2;

                            // Strong damping to prevent bouncing
                            fruit1.vx *= 0.8;
                            fruit1.vy *= 0.8;
                            fruit2.vx *= 0.8;
                            fruit2.vy *= 0.8;
                        }
                    }
                } else {
                    // Reset overlap time when not colliding
                    if (fruit1.overlapTime > 0) fruit1.overlapTime = Math.max(0, fruit1.overlapTime - 1);
                    if (fruit2.overlapTime > 0) fruit2.overlapTime = Math.max(0, fruit2.overlapTime - 1);
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

        if (fruit1.type !== fruit2.type) {
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

        // Create new merged fruit
        const newType = fruit1.type + 1;
        const newFruit = {
            x: (fruit1.x + fruit2.x) / 2,
            y: (fruit1.y + fruit2.y) / 2,
            vx: (fruit1.vx + fruit2.vx) / 4, // Reduce velocity to prevent bouncing
            vy: (fruit1.vy + fruit2.vy) / 4,
            type: newType,
            size: this.fruitTypes[newType].size,
            mass: this.fruitTypes[newType].mass,
            emoji: this.fruitTypes[newType].emoji,
            id: Date.now() + Math.random(),
            bubbles: [],
            justDropped: false,
            settled: false,
            settleTime: 0,
            merging: false,
            overlapTime: 0
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

        // Subtle merge effect bubbles
        const bubbleCount = this.isMobile ? 3 : 6;
        for (let i = 0; i < bubbleCount; i++) {
            const angle = (Math.PI * 2 * i) / bubbleCount;
            const speed = Math.random() * 2 + 1;
            const bubble = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5, // Float upward gently
                size: Math.random() * 4 + 2,
                life: 1,
                decay: this.isMobile ? 0.06 : 0.04, // Quick decay
                color: `hsl(${Math.random() * 60 + 30}, 70%, 75%)` // Softer golden colors
            };

            // Add to a temporary container for merge effects
            if (!this.mergeBubbles) this.mergeBubbles = [];
            this.mergeBubbles.push(bubble);
        }
    }

    preventFruitCrushing() {
        // Check for fruits that might be getting crushed and give them escape velocity
        for (let i = 0; i < this.fruits.length; i++) {
            const fruit = this.fruits[i];

            // Skip if fruit is moving significantly
            if (Math.abs(fruit.vx) > 0.2 || Math.abs(fruit.vy) > 0.2) continue;

            let overlappingFruits = 0;
            let totalOverlap = 0;

            // Check how many fruits are overlapping with this one
            for (let j = 0; j < this.fruits.length; j++) {
                if (i === j) continue;

                const other = this.fruits[j];
                const dx = fruit.x - other.x;
                const dy = fruit.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = fruit.size + other.size + 2;

                if (distance < minDistance) {
                    overlappingFruits++;
                    totalOverlap += (minDistance - distance);
                }
            }

            // If fruit is being crushed by multiple others, give it escape velocity
            if (overlappingFruits >= 3 || totalOverlap > 15) {
                // Give very gentle escape movement - no bouncing
                fruit.vy = -Math.random() * 0.5 - 0.2; // Gentle upward movement
                fruit.vx = (Math.random() - 0.5) * 1; // Gentle horizontal movement
                fruit.settled = false;
                fruit.settleTime = 0;
            }
        }
    }

    checkGameOver() {
        // Check for overcrowding - if too many fruits are in upper area
        let fruitsInDangerZone = 0;
        let fruitsAboveLine = 0;
        let totalFruits = this.fruits.length;

        for (const fruit of this.fruits) {
            // Don't check game over for fruits that just dropped or are moving fast
            if (fruit.justDropped || Math.abs(fruit.vy) > 2) continue;

            // Count fruits in danger zone
            if (fruit.y - fruit.size < 120) {
                fruitsInDangerZone++;
            }

            // Count fruits above the critical line
            if (fruit.y - fruit.size < 80) {
                fruitsAboveLine++;
            }
        }

        // Game over only if multiple fruits are settled above the line
        if (fruitsAboveLine >= 3) {
            this.gameOver();
            return;
        }

        // Or if container is severely overcrowded
        if (totalFruits > 12 && fruitsInDangerZone > totalFruits * 0.7) {
            this.gameOver();
            return;
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

        // Check container fullness for visual warning
        let fruitsInDangerZone = 0;
        let totalFruits = this.fruits.length;
        for (const fruit of this.fruits) {
            if (fruit.y - fruit.size < 120) {
                fruitsInDangerZone++;
            }
        }
        const fullnessRatio = totalFruits > 0 ? fruitsInDangerZone / totalFruits : 0;

        // Draw danger line with intensity based on fullness
        const intensity = Math.min(1, fullnessRatio * 2);
        this.ctx.strokeStyle = `rgba(255, 107, 107, ${0.5 + intensity * 0.5})`;
        this.ctx.lineWidth = 2 + intensity * 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 80);
        this.ctx.lineTo(this.canvas.width, 80);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Add danger zone text with warning
        this.ctx.fillStyle = `rgba(255, 107, 107, ${0.6 + intensity * 0.4})`;
        this.ctx.font = '12px Poppins';
        this.ctx.textAlign = 'center';
        const warningText = fullnessRatio > 0.5 ? 'CONTAINER FULL!' : 'DANGER ZONE';
        this.ctx.fillText(warningText, this.canvas.width / 2, 70);

        // Draw preview fruit
        if (this.gameRunning && !this.isPaused) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.font = `${this.fruitTypes[this.nextFruitType].size}px Arial, sans-serif`;
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
            this.ctx.font = `${fruit.size * 1.5}px Arial, sans-serif`;
            this.ctx.fillText(fruit.emoji, fruit.x, fruit.y);
        }

        // Draw pause overlay
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial, sans-serif';
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
        this.lastDropTime = 0;

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
