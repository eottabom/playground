interface TargetConfig {
    alias: string;
    alt: string;
    src: string;
    hint: string;
    hitWords: string[];
}

type GameState = 'setup' | 'playing' | 'result';
type TargetType = 'building' | 'worker';

const GAME_DURATION_MS = 60_000;
const DAMAGE_THRESHOLDS = [16, 40, 80, 130];
const STORAGE_KEY = 'punch-out-best-score';

const TARGETS: Record<TargetType, TargetConfig> = {
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
    private state: GameState = 'setup';
    private selectedTarget: TargetType = 'building';
    private score = 0;
    private bestScore = 0;
    private startTime = 0;
    private rafId = 0;
    private activeHand: 'left' | 'right' = 'left';
    private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    private setupPanel = document.getElementById('setupPanel') as HTMLElement;
    private gamePanel = document.getElementById('gamePanel') as HTMLElement;
    private resultPanel = document.getElementById('resultPanel') as HTMLElement;
    private aliasInput = document.getElementById('aliasInput') as HTMLInputElement;
    private targetCards = Array.from(document.querySelectorAll<HTMLElement>('.target-card'));
    private startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    private restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;
    private arena = document.getElementById('arena') as HTMLButtonElement;
    private arenaTarget = document.getElementById('arenaTarget') as HTMLElement;
    private targetImage = document.getElementById('targetImage') as HTMLImageElement;
    private arenaHint = document.getElementById('arenaHint') as HTMLElement;
    private timerText = document.getElementById('timerText') as HTMLElement;
    private scoreText = document.getElementById('scoreText') as HTMLElement;
    private targetName = document.getElementById('targetName') as HTMLElement;
    private stressText = document.getElementById('stressText') as HTMLElement;
    private stressFill = document.getElementById('stressFill') as HTMLElement;
    private leftGlove = document.getElementById('leftGlove') as HTMLImageElement;
    private rightGlove = document.getElementById('rightGlove') as HTMLImageElement;
    private burst = document.getElementById('burst') as HTMLElement;
    private impactTextA = document.getElementById('impactTextA') as HTMLElement;
    private impactTextB = document.getElementById('impactTextB') as HTMLElement;
    private resultCopy = document.getElementById('resultCopy') as HTMLElement;
    private resultHits = document.getElementById('resultHits') as HTMLElement;
    private resultStress = document.getElementById('resultStress') as HTMLElement;
    private bestScoreText = document.getElementById('bestScore') as HTMLElement;
    private retryBtn = document.getElementById('retryBtn') as HTMLButtonElement;
    private changeTargetBtn = document.getElementById('changeTargetBtn') as HTMLButtonElement;
    private buildingEffects = Array.from(document.querySelectorAll<HTMLElement>('#damageBuilding span'));
    private workerEffects = Array.from(document.querySelectorAll<HTMLElement>('#damageWorker span'));

    constructor() {
        this.loadBest();
        this.bindEvents();
        this.applyTargetSelection();
        this.renderBest();
    }

    private bindEvents(): void {
        this.targetCards.forEach((card) => {
            card.addEventListener('click', () => {
                const target = card.dataset.target as TargetType;
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

    private selectTarget(target: TargetType): void {
        this.selectedTarget = target;
        this.aliasInput.value = TARGETS[target].alias;
        this.applyTargetSelection();
    }

    private applyTargetSelection(): void {
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

    private getAlias(): string {
        const trimmed = this.aliasInput.value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }

        return TARGETS[this.selectedTarget].alias;
    }

    private showPanel(name: GameState): void {
        this.setupPanel.classList.toggle('hidden', name !== 'setup');
        this.gamePanel.classList.toggle('hidden', name !== 'playing');
        this.resultPanel.classList.toggle('hidden', name !== 'result');
        this.state = name;
    }

    private startGame(): void {
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

    private tick = (): void => {
        const elapsed = performance.now() - this.startTime;
        const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
        this.timerText.textContent = (remaining / 1000).toFixed(1);

        if (remaining <= 0) {
            this.endGame();
            return;
        }

        this.rafId = requestAnimationFrame(this.tick);
    };

    private handleHit(): void {
        this.score += 1;
        this.scoreText.textContent = String(this.score);
        this.updateStressMeter();
        this.updateDamage();
        this.triggerRandomDamageFx();
        this.playImpactMotion();
        this.activeHand = this.activeHand === 'left' ? 'right' : 'left';
    }

    private updateStressMeter(): void {
        const stressPercent = Math.min(100, Math.round(this.score * 0.8));
        this.stressText.textContent = `${stressPercent}%`;
        this.stressFill.style.width = `${stressPercent}%`;
    }

    private updateDamage(): void {
        const damageLevel = DAMAGE_THRESHOLDS.reduce((level, threshold, index) => {
            if (this.score >= threshold) {
                return index + 1;
            }

            return level;
        }, 0);

        this.arena.dataset.damage = String(damageLevel);
    }

    private triggerRandomDamageFx(): void {
        const effects = this.selectedTarget === 'building' ? this.buildingEffects : this.workerEffects;
        const damageLevel = Number(this.arena.dataset.damage ?? '0');
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

    private playImpactMotion(): void {
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

    private showImpactWord(): void {
        const config = TARGETS[this.selectedTarget];
        const impactEl = this.score % 2 === 0 ? this.impactTextA : this.impactTextB;
        const word = config.hitWords[this.score % config.hitWords.length];
        impactEl.textContent = word;
        impactEl.classList.remove('is-visible');
        void impactEl.offsetWidth;
        impactEl.classList.add('is-visible');
    }

    private endGame(): void {
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

    private goToSetup(): void {
        cancelAnimationFrame(this.rafId);
        this.showPanel('setup');
        this.applyTargetSelection();
    }

    private loadBest(): void {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) {
            return;
        }

        const parsed = parseInt(raw, 10);
        this.bestScore = Number.isNaN(parsed) ? 0 : parsed;
    }

    private saveBest(): void {
        localStorage.setItem(STORAGE_KEY, String(this.bestScore));
    }

    private renderBest(): void {
        this.bestScoreText.textContent = String(this.bestScore);
    }
}

new PunchOutGame();
