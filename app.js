// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
}

class BoxBreathingApp {
    constructor() {
        this.state = {
            currentPage: 'homepage',
            isRunning: false,
            isPaused: false,
            phaseDuration: 4,
            timeLimit: null,
            totalTime: 0,
            currentPhase: 0, // 0: inhale, 1: hold, 2: exhale, 3: wait
            phaseTime: 0,
            animationFrame: null
        };

        this.phases = ['inhale', 'hold', 'exhale', 'wait'];
        this.boxPositions = [
            { x: 0, y: 100 }, // bottom left (start of inhale)
            { x: 0, y: 0 },   // top left (end of inhale/start of hold)
            { x: 100, y: 0 }, // top right (end of hold/start of exhale)
            { x: 100, y: 100 }, // bottom right (end of exhale/start of wait)
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDurationDisplay();
        this.positionDot();
    }

    bindEvents() {
        // Duration slider
        document.getElementById('durationSlider').addEventListener('input', (e) => {
            this.state.phaseDuration = parseInt(e.target.value);
            this.updateDurationDisplay();
        });

        // Time buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.time);
                this.state.timeLimit = minutes * 60;
                this.startExercise();
            });
        });

        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startExercise();
        });

        // Control buttons
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopExercise();
        });
    }

    updateDurationDisplay() {
        document.getElementById('durationValue').textContent = this.state.phaseDuration;
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        this.state.currentPage = pageId;
    }

    startExercise() {
        this.state.isRunning = true;
        this.state.isPaused = false;
        this.state.totalTime = 0;
        this.state.currentPhase = 0;
        this.state.phaseTime = this.state.phaseDuration;
        
        this.showPage('exercisePage');
        this.updateDisplay();
        this.positionDot();
        this.startTimer();
    }

    startTimer() {
        let lastTime = Date.now();
        
        const tick = () => {
            if (!this.state.isRunning || this.state.isPaused) return;

            const now = Date.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            this.state.totalTime += delta;
            this.state.phaseTime -= delta;

            // Check if phase is complete
            if (this.state.phaseTime <= 0) {
                this.nextPhase();
            }

            // Check time limit
            if (this.state.timeLimit && this.state.totalTime >= this.state.timeLimit) {
                if (this.state.currentPhase === 2) { // If on exhale, end now
                    this.stopExercise();
                    return;
                } else {
                    // Continue until next exhale completion
                    if (this.state.phaseTime <= 0 && this.state.currentPhase === 2) {
                        this.stopExercise();
                        return;
                    }
                }
            }

            this.updateDisplay();
            this.animateBox();
            
            this.state.animationFrame = requestAnimationFrame(tick);
        };

        this.state.animationFrame = requestAnimationFrame(tick);
    }

    nextPhase() {
        // Pulse animation
        const dot = document.getElementById('breathingDot');
        dot.classList.add('pulse');
        setTimeout(() => dot.classList.remove('pulse'), 600);

        this.state.currentPhase = (this.state.currentPhase + 1) % 4;
        this.state.phaseTime = this.state.phaseDuration;
    }

    updateDisplay() {
        document.getElementById('phaseName').textContent = this.phases[this.state.currentPhase].toUpperCase();
        document.getElementById('phaseTimer').textContent = Math.ceil(this.state.phaseTime);
        
        const totalMinutes = Math.floor(this.state.totalTime / 60);
        const totalSeconds = Math.floor(this.state.totalTime % 60);
        document.getElementById('totalTimer').textContent = 
            `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
    }

    positionDot() {
        const dot = document.getElementById('breathingDot');
        const startPos = this.boxPositions[this.state.currentPhase];
        
        dot.style.left = `${startPos.x}%`;
        dot.style.top = `${startPos.y}%`;
        dot.style.transform = 'translate(-50%, -50%)';
    }

    animateBox() {
        const progress = 1 - (this.state.phaseTime / this.state.phaseDuration);
        const currentPhase = this.state.currentPhase;
        const nextPhase = (currentPhase + 1) % 4;
        
        const startPos = this.boxPositions[currentPhase];
        const endPos = this.boxPositions[nextPhase];
        
        const x = startPos.x + (endPos.x - startPos.x) * progress;
        const y = startPos.y + (endPos.y - startPos.y) * progress;
        
        const dot = document.getElementById('breathingDot');
        dot.style.left = `${x}%`;
        dot.style.top = `${y}%`;
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        document.getElementById('pauseBtn').textContent = this.state.isPaused ? 'Resume' : 'Pause';
        
        if (!this.state.isPaused) {
            this.startTimer();
        }
    }

    stopExercise() {
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.timeLimit = null;
        
        if (this.state.animationFrame) {
            cancelAnimationFrame(this.state.animationFrame);
        }
        
        document.getElementById('pauseBtn').textContent = 'Pause';
        this.showPage('homepage');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BoxBreathingApp();
});
