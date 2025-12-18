// --------------------------------------------------------------
// AUTH & DATABASE MANAGERS
// --------------------------------------------------------------

// Initialize Firebase if config is loaded
if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

class AuthManager {
    constructor() {
        this.auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
        this.provider = typeof firebase !== 'undefined' ? new firebase.auth.GoogleAuthProvider() : null;
        this.user = null;
        this.onLoginCallback = null;
    }

    init(onLogin) {
        if (!this.auth) {
            console.error("Firebase Auth not initialized");
            return;
        }

        this.onLoginCallback = onLogin;

        // Check if already logged in
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.user = user;
                if (this.onLoginCallback) this.onLoginCallback(user);
                this.updateUI(true);
            } else {
                this.user = null;
                this.updateUI(false);
            }
        });

        // Bind login button
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) loginBtn.addEventListener('click', () => this.login());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
    }

    login() {
        if (!this.auth) return;
        this.auth.signInWithPopup(this.provider)
            .then((result) => {
                this.user = result.user;
            }).catch((error) => {
                console.error("Login failed:", error);
                alert("Error login: " + error.message);
            });
    }

    logout() {
        if (!this.auth) return;
        this.auth.signOut();
    }

    updateUI(isLoggedIn) {
        const loginContainer = document.getElementById('login-container');
        const userInfo = document.getElementById('user-info');
        const userNameDisplay = document.getElementById('user-name-display');
        const gameControls = document.querySelector('.game-controls');
        const startBtn = document.getElementById('start-btn');

        if (isLoggedIn) {
            if (loginContainer) loginContainer.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
            if (userNameDisplay && this.user) userNameDisplay.textContent = this.user.displayName;

            // Enable game
            if (gameControls) gameControls.classList.remove('hidden');
            if (startBtn) startBtn.disabled = false;
        } else {
            if (loginContainer) loginContainer.classList.remove('hidden');
            if (userInfo) userInfo.classList.add('hidden');

            // Disable game
            if (gameControls) gameControls.classList.add('hidden');
            if (startBtn) startBtn.disabled = true;
        }
    }
}

class DatabaseManager {
    constructor() {
        this.db = typeof firebase !== 'undefined' ? firebase.firestore() : null;
    }

    async saveResult(user, wpm, rank, language) {
        if (!user || !this.db) return;

        try {
            await this.db.collection('race_results').add({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                wpm: wpm,
                rank: rank,
                language: language,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                dateString: new Date().toLocaleString()
            });
            console.log("Result saved successfully");
            return true;
        } catch (error) {
            console.error("Error saving result:", error);
            return false;
        }
    }
}

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClick() {
        this.playTone(600, 'sine', 0.05);
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.15);
    }

    playWin() {
        // Simple arpeggio
        setTimeout(() => this.playTone(523.25, 'sine', 0.1), 0);
        setTimeout(() => this.playTone(659.25, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(783.99, 'sine', 0.2), 200);
        setTimeout(() => this.playTone(1046.50, 'square', 0.4), 300);
    }

    playLose() {
        setTimeout(() => this.playTone(400, 'sawtooth', 0.2), 0);
        setTimeout(() => this.playTone(300, 'sawtooth', 0.2), 200);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.4), 400);
    }

    playStall() {
        // Low frequency sputtering sound
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.3);
    }
}

class GameEngine {
    constructor() {
        this.currentLang = 'en';
        this.isPlaying = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.botInterval = null;
        this.targetText = "";
        this.typedText = "";
        this.finishedRacers = 0;
        this.playerRank = null;
        this.streak = 0; // Visual Overhaul V2

        // Firebase Managers
        this.authManager = new AuthManager();
        this.dbManager = new DatabaseManager();

        this.soundManager = new SoundManager();

        // DOM Elements
        this.textDisplay = document.getElementById('text-display');
        this.inputField = document.getElementById('input-field');
        this.wpmDisplay = document.getElementById('wpm-display');
        this.streakDisplay = document.getElementById('streak-display'); // Visual Overhaul V2
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.playerCar = document.getElementById('player-car');

        // Bots
        this.bots = [
            { id: 'bot-car-1', element: document.getElementById('bot-car-1'), progress: 0, speed: 0, finished: false },
            { id: 'bot-car-2', element: document.getElementById('bot-car-2'), progress: 0, speed: 0, finished: false },
            { id: 'bot-car-3', element: document.getElementById('bot-car-3'), progress: 0, speed: 0, finished: false }
        ];

        this.langBtns = document.querySelectorAll('.lang-btn');
        this.resultModal = document.getElementById('result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.restartBtn = document.getElementById('restart-btn');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => {
            // Resume AudioContext on user interaction
            if (this.soundManager.ctx.state === 'suspended') {
                this.soundManager.ctx.resume();
            }
            this.startGame();
        });
        this.inputField.addEventListener('input', (e) => this.handleInput(e));
        this.restartBtn.addEventListener('click', () => this.resetGame());

        this.langBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLanguage(e.target.dataset.lang));
        });

        this.switchLanguage('en');

        // Initialize Auth
        this.authManager.init((user) => {
            this.updatePlaceholder();
        });
    }

    switchLanguage(lang) {
        if (this.isPlaying) return;

        this.currentLang = lang;
        this.langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        this.updatePlaceholder();
    }

    updatePlaceholder() {
        if (!this.authManager.user) {
            this.textDisplay.innerHTML = `<span class="placeholder" style="color: var(--accent-color)">Please login to play 🔒 / Inicia sesión para jugar 🔒</span>`;
            // Ensure start button is disabled visually if not logged in (optional double check)
            this.startBtn.disabled = false; // We leave it enabled so clicking it triggers the alert + auto-login
            return;
        }

        const placeholderText = this.currentLang === 'en'
            ? "Press Start to race!"
            : "¡Presiona Iniciar para correr!";
        this.textDisplay.innerHTML = `<span class="placeholder">${placeholderText}</span>`;
    }

    getRandomSentence() {
        const sentences = GAME_SENTENCES[this.currentLang];
        return sentences[Math.floor(Math.random() * sentences.length)];
    }

    startGame() {
        // Strict Login Check
        if (!this.authManager.user) {
            alert("⚠️ Please sign in with Google to play!\n\n⚠️ ¡Por favor inicia sesión con Google para jugar!");
            this.authManager.login(); // Prompt login automatically
            return;
        }

        this.isPlaying = true;
        this.targetText = this.getRandomSentence();
        this.typedText = "";
        this.inputField.value = "";
        this.inputField.disabled = false;
        this.inputField.focus();
        this.startBtn.disabled = true;
        this.startTime = Date.now();
        this.finishedRacers = 0;
        this.playerRank = null;
        this.resetStreak(); // Visual Overhaul V2

        // Reset cars
        this.playerCar.style.left = '0%';
        this.playerCar.classList.remove('shake');
        this.bots.forEach(bot => {
            bot.progress = 0;
            bot.finished = false;
            bot.element.style.left = '0%';
            // Base speed adjusted for easier difficulty: ~0.1 - 0.3% per 100ms
            bot.speed = 0.1 + Math.random() * 0.2;
        });

        this.renderText();

        this.timerInterval = setInterval(() => this.updateTimer(), 100);
        this.startBots();
    }

    renderText() {
        const chars = this.targetText.split('');
        const typedChars = this.typedText.split('');

        // Sliding window logic
        const start = Math.max(0, this.typedText.length - 2);
        const end = start + 35; // Show 35 characters

        let html = '';

        for (let i = start; i < Math.min(end, chars.length); i++) {
            const char = chars[i];
            let className = '';

            if (i < typedChars.length) {
                className = typedChars[i] === char ? 'char-correct' : 'char-incorrect';
            } else if (i === typedChars.length) {
                className = 'char-current';
            }

            html += `<span class="${className}">${char}</span>`;
        }

        this.textDisplay.innerHTML = html;
    }

    handleInput(e) {
        if (!this.isPlaying) return;

        const value = e.target.value;

        // Validation: Don't allow typing if there's already an error
        let matchLen = 0;
        for (let i = 0; i < value.length; i++) {
            if (i < this.targetText.length && value[i] === this.targetText[i]) {
                matchLen++;
            } else {
                break;
            }
        }

        // Allow at most 1 incorrect character (the one that caused the error)
        if (value.length > matchLen + 1) {
            this.inputField.value = this.typedText;
            this.soundManager.playStall();
            this.triggerShake();
            this.resetStreak(); // Visual Overhaul V2
            return;
        }

        const lastChar = value.slice(-1);
        const expectedChar = this.targetText[value.length - 1];

        // Sound feedback
        if (value.length > this.typedText.length) {
            if (lastChar === expectedChar) {
                this.soundManager.playClick();
                this.incrementStreak(); // Visual Overhaul V2
                this.spawnParticle(e); // Visual Overhaul V2
            } else {
                this.soundManager.playError();
                this.triggerShake();
                this.resetStreak(); // Visual Overhaul V2
            }
        } else if (value.length < this.typedText.length) {
            // Backspace
            this.resetStreak(); // Visual Overhaul V2
        }

        this.typedText = value;

        this.renderText();
        this.updateProgress();
        this.calculateWPM();

        if (this.typedText === this.targetText) {
            this.finishRace(true);
        }
    }

    // Visual Overhaul V2 Methods
    incrementStreak() {
        this.streak++;
        if (this.streakDisplay) {
            this.streakDisplay.textContent = this.streak;

            // Pulse effect
            this.streakDisplay.classList.remove('pulse');
            void this.streakDisplay.offsetWidth;
            this.streakDisplay.classList.add('pulse');
        }

        // Car Glow
        this.playerCar.className = 'car player-car'; // Reset
        if (this.streak > 30) this.playerCar.classList.add('glow-3');
        else if (this.streak > 15) this.playerCar.classList.add('glow-2');
        else if (this.streak > 5) this.playerCar.classList.add('glow-1');
    }

    resetStreak() {
        this.streak = 0;
        if (this.streakDisplay) {
            this.streakDisplay.textContent = 0;
        }
        this.playerCar.className = 'car player-car';
    }

    spawnParticle(e) {
        // Get input field coordinates to spawn particles near the typing area
        const rect = this.inputField.getBoundingClientRect();
        const x = rect.left + (rect.width / 2) + (Math.random() * 100 - 50);
        const y = rect.top + (Math.random() * 40 - 20);

        const particle = document.createElement('div');
        particle.classList.add('particle');
        document.body.appendChild(particle);

        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Random direction
        const tx = (Math.random() - 0.5) * 100;
        const ty = (Math.random() - 1) * 100;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        // Cleanup
        setTimeout(() => particle.remove(), 800);
    }

    triggerShake() {
        this.playerCar.classList.remove('shake');
        void this.playerCar.offsetWidth; // Trigger reflow
        this.playerCar.classList.add('shake');
    }

    updateProgress() {
        const progress = (this.typedText.length / this.targetText.length) * 100;
        const visualProgress = Math.min(progress, 90);
        this.playerCar.style.left = `${visualProgress}%`;
    }

    startBots() {
        this.botInterval = setInterval(() => {
            if (!this.isPlaying && this.playerRank !== null && this.finishedRacers >= 4) {
                clearInterval(this.botInterval);
                return;
            }

            this.bots.forEach(bot => {
                if (bot.finished) return;

                // Random fluctuation
                const currentSpeed = bot.speed * (0.8 + Math.random() * 0.4);
                bot.progress += currentSpeed;

                if (bot.progress >= 100) {
                    bot.finished = true;
                    this.finishedRacers++;
                    bot.element.style.left = '90%';
                } else {
                    const visualProgress = Math.min(bot.progress, 90);
                    bot.element.style.left = `${visualProgress}%`;
                }
            });

            // If player hasn't finished, check if everyone else has
            if (this.finishedRacers === 3 && this.playerRank === null) {
                // Bots finished, player still typing... game continues until player finishes
            }
        }, 100);
    }

    updateTimer() {
        if (this.playerRank !== null) return; // Stop timer visual when player finishes
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.timeDisplay.textContent = `${elapsed}s`;
    }

    calculateWPM() {
        const elapsedMin = (Date.now() - this.startTime) / 1000 / 60;
        if (elapsedMin === 0) return;

        const words = this.typedText.length / 5;
        const wpm = Math.round(words / elapsedMin);
        this.wpmDisplay.textContent = wpm;
    }

    finishRace(isPlayer) {
        if (isPlayer) {
            this.finishedRacers++;
            this.playerRank = this.finishedRacers;
            this.isPlaying = false; // Stop input
            this.inputField.disabled = true;
            this.startBtn.disabled = false;
            clearInterval(this.timerInterval);

            if (this.playerRank === 1) {
                this.soundManager.playWin();
            } else {
                this.soundManager.playLose();
            }

            // Save result to Firebase
            if (this.authManager.user) {
                this.dbManager.saveResult(
                    this.authManager.user,
                    parseInt(this.wpmDisplay.textContent),
                    this.playerRank,
                    this.currentLang
                );
            }

            this.showResult();
        }
    }

    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    showResult() {
        const wpm = this.wpmDisplay.textContent;
        const rank = this.playerRank;

        let title = "";
        let message = "";

        if (this.currentLang === 'en') {
            title = `You finished ${this.getOrdinal(rank)}!`;
            message = `Speed: ${wpm} WPM`;
        } else {
            title = `¡Terminaste en ${rank}º lugar!`;
            message = `Velocidad: ${wpm} PPM`;
        }

        this.resultTitle.textContent = title;
        this.resultMessage.textContent = message;
        this.resultModal.classList.remove('hidden');
    }

    resetGame() {
        this.resultModal.classList.add('hidden');
        this.updatePlaceholder();
        this.playerCar.style.left = '0%';
        this.bots.forEach(bot => {
            bot.element.style.left = '0%';
        });
        this.wpmDisplay.textContent = '0';
        this.timeDisplay.textContent = '0s';
        this.inputField.value = '';
        this.resetStreak(); // Visual Overhaul V2
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine();
});
