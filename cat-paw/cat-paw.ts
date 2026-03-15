interface Grade {
  emoji: string;
  title: string;
  message: string;
}

interface Milestone {
  count: number;
  text: string;
}

const GRADES: { min: number; grade: Grade }[] = [
  { min: 100, grade: { emoji: '🌟', title: '광속냥이', message: '고양이를 초월한 존재가 되었습니다' } },
  { min: 80,  grade: { emoji: '⚡', title: '번개냥', message: '눈으로 볼 수 없는 속도...!' } },
  { min: 60,  grade: { emoji: '🐆', title: '치타', message: '이 속도면 쥐도 못 도망가요' } },
  { min: 40,  grade: { emoji: '🐈\u200D⬛', title: '길고양이', message: '야생의 본능이 깨어나고 있어요' } },
  { min: 20,  grade: { emoji: '🐈', title: '집고양이', message: '적당히 귀엽고 적당히 빠른 발놀림' } },
  { min: 0,   grade: { emoji: '🐱', title: '아기 고양이', message: '냥... 아직 발바닥이 말랑해요' } },
];

const MILESTONES: Milestone[] = [
  { count: 90, text: '인간이 맞아?!' },
  { count: 70, text: '미쳤다!!' },
  { count: 50, text: '멈추지 마!' },
  { count: 30, text: '대단한데?!' },
  { count: 10, text: '좋은 출발이에요!' },
];

const GAME_DURATION = 10_000;
const STORAGE_KEY = 'cat-paw-best-score';

class CatPawGame {
  // 상태
  private state: 'idle' | 'countdown' | 'play' | 'result' = 'idle';
  private score = 0;
  private bestScore = 0;
  private startTime = 0;
  private rafId = 0;
  private nextMilestoneIdx = MILESTONES.length - 1;
  private reducedMotion = false;

  // DOM — 대기
  private stateIdle: HTMLElement;
  private bestScoreEl: HTMLElement;
  private tapBtn: HTMLElement;
  private catPaw: HTMLElement;

  // DOM — 카운트다운
  private stateCountdown: HTMLElement;
  private countdownNum: HTMLElement;

  // DOM — 플레이
  private statePlay: HTMLElement;
  private timerFill: HTMLElement;
  private timerText: HTMLElement;
  private scoreText: HTMLElement;
  private tapBtnPlay: HTMLElement;
  private catPawPlay: HTMLElement;
  private bellPlay: HTMLElement;
  private toast: HTMLElement;

  // DOM — 결과
  private stateResult: HTMLElement;
  private resultEmoji: HTMLElement;
  private resultScore: HTMLElement;
  private resultGrade: HTMLElement;
  private resultMessage: HTMLElement;
  private resultTps: HTMLElement;
  private resultBest: HTMLElement;
  private retryBtn: HTMLElement;
  private shareBtn: HTMLElement;

  // DOM — 기타
  private shareCanvas: HTMLCanvasElement;
  private shareToast: HTMLElement;

  constructor() {
    this.stateIdle = document.getElementById('stateIdle')!;
    this.bestScoreEl = document.getElementById('bestScore')!;
    this.tapBtn = document.getElementById('tapBtn')!;
    this.catPaw = document.getElementById('catPaw')!;

    this.stateCountdown = document.getElementById('stateCountdown')!;
    this.countdownNum = document.getElementById('countdownNum')!;

    this.statePlay = document.getElementById('statePlay')!;
    this.timerFill = document.getElementById('timerFill')!;
    this.timerText = document.getElementById('timerText')!;
    this.scoreText = document.getElementById('scoreText')!;
    this.tapBtnPlay = document.getElementById('tapBtnPlay')!;
    this.catPawPlay = document.getElementById('catPawPlay')!;
    this.bellPlay = this.tapBtnPlay.closest('.bell-wrapper') as HTMLElement;
    this.toast = document.getElementById('toast')!;

    this.stateResult = document.getElementById('stateResult')!;
    this.resultEmoji = document.getElementById('resultEmoji')!;
    this.resultScore = document.getElementById('resultScore')!;
    this.resultGrade = document.getElementById('resultGrade')!;
    this.resultMessage = document.getElementById('resultMessage')!;
    this.resultTps = document.getElementById('resultTps')!;
    this.resultBest = document.getElementById('resultBest')!;
    this.retryBtn = document.getElementById('retryBtn')!;
    this.shareBtn = document.getElementById('shareBtn')!;

    this.shareCanvas = document.getElementById('shareCanvas') as HTMLCanvasElement;
    this.shareToast = document.getElementById('shareToast')!;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.loadBest();
    this.bindEvents();
    this.showBest();
  }

  private loadBest(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) this.bestScore = parseInt(saved, 10) || 0;
  }

  private saveBest(): void {
    localStorage.setItem(STORAGE_KEY, String(this.bestScore));
  }

  private showBest(): void {
    this.bestScoreEl.textContent = this.bestScore > 0
      ? `🏆 최고 기록: ${this.bestScore}회`
      : '';
  }

  private bindEvents(): void {
    // 시작 버튼
    this.tapBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.state === 'idle') this.startCountdown();
    });

    // 플레이 탭
    this.tapBtnPlay.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.state === 'play') this.onTap();
    });

    // 결과 버튼
    this.retryBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.reset();
    });

    this.shareBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.share();
    });

    // 키보드 접근성 — 스페이스바
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (this.state === 'idle') this.startCountdown();
        else if (this.state === 'play') this.onTap();
      }
    });
  }

  // ── 상태 전환 ──

  private showState(name: 'idle' | 'countdown' | 'play' | 'result'): void {
    this.stateIdle.classList.toggle('hidden', name !== 'idle');
    this.stateCountdown.classList.toggle('hidden', name !== 'countdown');
    this.statePlay.classList.toggle('hidden', name !== 'play');
    this.stateResult.classList.toggle('hidden', name !== 'result');
    this.state = name;
  }

  // ── 카운트다운 ──

  private startCountdown(): void {
    this.showState('countdown');
    let count = 3;
    this.countdownNum.textContent = String(count);
    this.animateCountdown();

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        this.startGame();
      } else {
        this.countdownNum.textContent = String(count);
        this.animateCountdown();
      }
    }, 700);
  }

  private animateCountdown(): void {
    this.countdownNum.style.animation = 'none';
    // reflow
    void this.countdownNum.offsetHeight;
    this.countdownNum.style.animation = 'countBounce 0.6s ease-out';
  }

  // ── 게임 시작 ──

  private startGame(): void {
    this.score = 0;
    this.nextMilestoneIdx = MILESTONES.length - 1;
    this.scoreText.textContent = '0';
    this.timerText.textContent = '10.00';
    this.timerFill.style.width = '100%';
    this.toast.innerHTML = '';

    this.showState('play');
    this.startTime = performance.now();
    this.tick();
  }

  private tick = (): void => {
    const elapsed = performance.now() - this.startTime;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    const pct = remaining / GAME_DURATION;

    this.timerText.textContent = (remaining / 1000).toFixed(2);
    this.timerFill.style.width = (pct * 100) + '%';

    if (remaining <= 0) {
      this.endGame();
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  // ── 탭 처리 ──

  private onTap(): void {
    this.score++;
    this.scoreText.textContent = String(this.score);

    // 발 애니메이션
    if (!this.reducedMotion) {
      this.catPawPlay.classList.remove('paw-press');
      void this.catPawPlay.offsetHeight;
      this.catPawPlay.classList.add('paw-press');
    }

    // 벨 눌림 효과
    this.bellPlay.classList.add('bell-hit');
    setTimeout(() => this.bellPlay.classList.remove('bell-hit'), 80);

    // 마일스톤 체크
    this.checkMilestone();
  }

  private checkMilestone(): void {
    if (this.nextMilestoneIdx < 0) return;
    const m = MILESTONES[this.nextMilestoneIdx];
    if (this.score >= m.count) {
      this.showToast(m.text);
      this.nextMilestoneIdx--;
    }
  }

  private showToast(text: string): void {
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = text;
    this.toast.innerHTML = '';
    this.toast.appendChild(el);
  }

  // ── 게임 종료 ──

  private endGame(): void {
    cancelAnimationFrame(this.rafId);

    const grade = this.getGrade(this.score);
    const tps = (this.score / (GAME_DURATION / 1000)).toFixed(1);
    const isNewRecord = this.score > this.bestScore;

    if (isNewRecord) {
      this.bestScore = this.score;
      this.saveBest();
    }

    this.resultEmoji.textContent = grade.emoji;
    this.resultScore.textContent = String(this.score);
    this.resultGrade.textContent = grade.title;
    this.resultMessage.textContent = grade.message;
    this.resultTps.textContent = `초당 ${tps}회`;

    if (isNewRecord) {
      this.resultBest.textContent = '🎉 신기록!';
      this.resultBest.className = 'result-best new-record';
    } else {
      this.resultBest.textContent = `🏆 최고 기록: ${this.bestScore}회`;
      this.resultBest.className = 'result-best';
    }

    this.showState('result');
  }

  private getGrade(score: number): Grade {
    for (const g of GRADES) {
      if (score >= g.min) return g.grade;
    }
    return GRADES[GRADES.length - 1].grade;
  }

  // ── 리셋 ──

  private reset(): void {
    this.showBest();
    this.showState('idle');
  }

  // ── 공유 ──

  private async share(): Promise<void> {
    const blob = await this.generateShareCard();
    if (!blob) return;

    const file = new File([blob], 'cat-paw-result.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: '냥냥 버튼 결과',
          text: `🐾 냥냥 버튼에서 ${this.score}회 달성! ${this.getGrade(this.score).emoji} ${this.getGrade(this.score).title}`,
        });
      } catch {
        // 사용자 취소
      }
    } else {
      // 폴백: 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cat-paw-result.png';
      a.click();
      URL.revokeObjectURL(url);
      this.showShareToast('이미지가 저장되었습니다!');
    }
  }

  private generateShareCard(): Promise<Blob | null> {
    const S = 1080;
    const canvas = this.shareCanvas;
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d')!;

    const grade = this.getGrade(this.score);
    const tps = (this.score / (GAME_DURATION / 1000)).toFixed(1);
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    // 배경
    const bg = ctx.createLinearGradient(0, 0, S, S);
    bg.addColorStop(0, '#212128');
    bg.addColorStop(1, '#1a1a20');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    // 카드 영역
    const cx = 90, cy = 140, cw = S - 180, ch = S - 280;
    ctx.fillStyle = 'rgba(30, 30, 36, 0.7)';
    this.roundRect(ctx, cx, cy, cw, ch, 32);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, cx, cy, cw, ch, 32);
    ctx.stroke();

    // 타이틀
    ctx.textAlign = 'center';
    ctx.font = '600 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f4a7bb';
    ctx.fillText('🐾 냥냥 버튼', S / 2, 220);

    // 등급 이모지
    ctx.font = '80px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(grade.emoji, S / 2, 340);

    // 점수
    ctx.font = '900 120px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffd46b';
    ctx.shadowColor = 'rgba(255, 212, 107, 0.3)';
    ctx.shadowBlur = 30;
    ctx.fillText(String(this.score), S / 2, 480);
    ctx.shadowBlur = 0;

    // 등급 타이틀
    ctx.font = '700 40px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f4a7bb';
    ctx.fillText(grade.title, S / 2, 550);

    // 등급 메시지
    ctx.font = '28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(240, 230, 246, 0.6)';
    ctx.fillText(grade.message, S / 2, 610);

    // TPS
    ctx.font = '600 30px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(240, 230, 246, 0.5)';
    ctx.fillText(`초당 ${tps}회`, S / 2, 680);

    // 날짜 + 브랜딩
    ctx.font = '24px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(240, 230, 246, 0.3)';
    ctx.fillText(dateStr, S / 2, S - 100);
    ctx.fillText('eottabom.github.io/playground', S / 2, S - 60);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private showShareToast(text: string): void {
    this.shareToast.textContent = text;
    this.shareToast.classList.add('show');
    setTimeout(() => this.shareToast.classList.remove('show'), 2000);
  }
}

new CatPawGame();
