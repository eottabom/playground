"use strict";
const GAME_DURATION_MS = 60000;
const DAMAGE_THRESHOLDS = [16, 40, 80, 130];
const STORAGE_KEY = 'punch-out-best-score';
const TARGETS = {
    building: {
        alias: '월요일 타워',
        alt: '회사 건물 타겟',
        src: 'assets/building-target.svg',
        hint: '유리창 흔들릴 때까지 두드려보세요',
        hitWords: ['퍽!', '쾅!', '와장창!', '부숴!', '퇴근!'],
    },
    worker: {
        alias: '야근 매니저',
        alt: '가상 직장 캐릭터 타겟',
        src: 'assets/worker-target.svg',
        hint: '서류가 날아다닐 때까지 두드려보세요',
        hitWords: ['퍽!', '철컥!', '스파크!', '빙글!', '휴가!'],
    },
};
class PunchOutGame {
    constructor() {
        this.state = 'setup';
        this.selectedTarget = 'building';
        this.score = 0;
        this.bestScore = 0;
        this.startTime = 0;
        this.rafId = 0;
        this.activeHand = 'left';
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.setupPanel = document.getElementById('setupPanel');
        this.gamePanel = document.getElementById('gamePanel');
        this.resultPanel = document.getElementById('resultPanel');
        this.aliasInput = document.getElementById('aliasInput');
        this.targetCards = Array.from(document.querySelectorAll('.target-card'));
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.arena = document.getElementById('arena');
        this.arenaTarget = document.getElementById('arenaTarget');
        this.targetImage = document.getElementById('targetImage');
        this.arenaHint = document.getElementById('arenaHint');
        this.timerText = document.getElementById('timerText');
        this.scoreText = document.getElementById('scoreText');
        this.targetName = document.getElementById('targetName');
        this.stressText = document.getElementById('stressText');
        this.stressFill = document.getElementById('stressFill');
        this.leftGlove = document.getElementById('leftGlove');
        this.rightGlove = document.getElementById('rightGlove');
        this.burst = document.getElementById('burst');
        this.impactTextA = document.getElementById('impactTextA');
        this.impactTextB = document.getElementById('impactTextB');
        this.resultCopy = document.getElementById('resultCopy');
        this.resultHits = document.getElementById('resultHits');
        this.resultStress = document.getElementById('resultStress');
        this.bestScoreText = document.getElementById('bestScore');
        this.retryBtn = document.getElementById('retryBtn');
        this.changeTargetBtn = document.getElementById('changeTargetBtn');
        this.buildingEffects = Array.from(document.querySelectorAll('#damageBuilding span'));
        this.workerEffects = Array.from(document.querySelectorAll('#damageWorker span'));
        this.tick = () => {
            const elapsed = performance.now() - this.startTime;
            const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
            this.timerText.textContent = (remaining / 1000).toFixed(1);
            if (remaining <= 0) {
                this.endGame();
                return;
            }
            this.rafId = requestAnimationFrame(this.tick);
        };
        this.loadBest();
        this.bindEvents();
        this.applyTargetSelection();
        this.renderBest();
    }
    bindEvents() {
        this.targetCards.forEach((card) => {
            card.addEventListener('click', () => {
                const target = card.dataset.target;
                this.selectTarget(target);
            });
        });
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });
        this.restartBtn.addEventListener('click', () => {
            this.goToSetup();
        });
        this.arena.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            if (this.state === 'playing') {
                this.handleHit();
            }
        });
        this.retryBtn.addEventListener('click', () => {
            this.startGame();
        });
        this.changeTargetBtn.addEventListener('click', () => {
            this.goToSetup();
        });
    }
    selectTarget(target) {
        this.selectedTarget = target;
        this.aliasInput.value = TARGETS[target].alias;
        this.applyTargetSelection();
    }
    applyTargetSelection() {
        this.targetCards.forEach((card) => {
            const isSelected = card.dataset.target === this.selectedTarget;
            card.classList.toggle('is-selected', isSelected);
            card.setAttribute('aria-pressed', String(isSelected));
        });
        const config = TARGETS[this.selectedTarget];
        this.targetImage.src = config.src;
        this.targetImage.alt = config.alt;
        this.arena.dataset.target = this.selectedTarget;
        this.arenaHint.textContent = config.hint;
        this.targetName.textContent = this.getAlias();
    }
    getAlias() {
        const trimmed = this.aliasInput.value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
        return TARGETS[this.selectedTarget].alias;
    }
    showPanel(name) {
        this.setupPanel.classList.toggle('hidden', name !== 'setup');
        this.gamePanel.classList.toggle('hidden', name !== 'playing');
        this.resultPanel.classList.toggle('hidden', name !== 'result');
        this.state = name;
    }
    startGame() {
        this.score = 0;
        this.activeHand = 'left';
        this.startTime = performance.now();
        this.applyTargetSelection();
        this.targetName.textContent = this.getAlias();
        this.scoreText.textContent = '0';
        this.timerText.textContent = '60.0';
        this.updateStressMeter();
        this.updateDamage();
        this.showPanel('playing');
        this.tick();
    }
    handleHit() {
        this.score += 1;
        this.scoreText.textContent = String(this.score);
        this.updateStressMeter();
        this.updateDamage();
        this.triggerRandomDamageFx();
        this.playImpactMotion();
        this.activeHand = this.activeHand === 'left' ? 'right' : 'left';
    }
    updateStressMeter() {
        const stressPercent = Math.min(100, Math.round(this.score * 0.8));
        this.stressText.textContent = `${stressPercent}%`;
        this.stressFill.style.width = `${stressPercent}%`;
    }
    updateDamage() {
        const damageLevel = DAMAGE_THRESHOLDS.reduce((level, threshold, index) => {
            if (this.score >= threshold) {
                return index + 1;
            }
            return level;
        }, 0);
        this.arena.dataset.damage = String(damageLevel);
    }
    triggerRandomDamageFx() {
        var _a;
        const effects = this.selectedTarget === 'building' ? this.buildingEffects : this.workerEffects;
        const damageLevel = Number((_a = this.arena.dataset.damage) !== null && _a !== void 0 ? _a : '0');
        const flashCount = Math.max(1, Math.min(3, damageLevel + 1));
        const pool = [...effects];
        for (let i = 0; i < flashCount && pool.length > 0; i++) {
            const index = Math.floor(Math.random() * pool.length);
            const effect = pool.splice(index, 1)[0];
            effect.classList.remove('is-flash');
            void effect.offsetWidth;
            effect.classList.add('is-flash');
            window.setTimeout(() => {
                effect.classList.remove('is-flash');
            }, this.reducedMotion ? 20 : 260);
        }
    }
    playImpactMotion() {
        const glove = this.activeHand === 'left' ? this.leftGlove : this.rightGlove;
        glove.classList.remove('is-active');
        this.arena.classList.remove('is-shaking');
        this.arenaTarget.classList.remove('is-hit');
        this.burst.classList.remove('is-visible');
        void glove.offsetWidth;
        glove.classList.add('is-active');
        this.arena.classList.add('is-shaking');
        this.arenaTarget.classList.add('is-hit');
        this.burst.classList.add('is-visible');
        this.showImpactWord();
        window.setTimeout(() => {
            glove.classList.remove('is-active');
            this.arena.classList.remove('is-shaking');
            this.arenaTarget.classList.remove('is-hit');
            this.burst.classList.remove('is-visible');
        }, this.reducedMotion ? 10 : 140);
    }
    showImpactWord() {
        const config = TARGETS[this.selectedTarget];
        const impactEl = this.score % 2 === 0 ? this.impactTextA : this.impactTextB;
        const word = config.hitWords[this.score % config.hitWords.length];
        impactEl.textContent = word;
        impactEl.classList.remove('is-visible');
        void impactEl.offsetWidth;
        impactEl.classList.add('is-visible');
    }
    endGame() {
        cancelAnimationFrame(this.rafId);
        const alias = this.getAlias();
        const stressPercent = Math.min(100, Math.round(this.score * 0.8));
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBest();
        }
        this.resultCopy.textContent = `${alias} 상대로 ${this.score}번 두드렸습니다.`;
        this.resultHits.textContent = String(this.score);
        this.resultStress.textContent = `${stressPercent}%`;
        this.renderBest();
        this.showPanel('result');
    }
    goToSetup() {
        cancelAnimationFrame(this.rafId);
        this.showPanel('setup');
        this.applyTargetSelection();
    }
    loadBest() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) {
            return;
        }
        const parsed = parseInt(raw, 10);
        this.bestScore = Number.isNaN(parsed) ? 0 : parsed;
    }
    saveBest() {
        localStorage.setItem(STORAGE_KEY, String(this.bestScore));
    }
    renderBest() {
        this.bestScoreText.textContent = String(this.bestScore);
    }
}
new PunchOutGame();
