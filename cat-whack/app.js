/* =====================================================
   고양이 잡기 — 게임 로직
   ===================================================== */

'use strict';

// ── 상수 ──────────────────────────────────────────────
const GAME_DURATION   = 30;      // 게임 시간 (초)
const HOLES_COUNT     = 9;       // 구멍 수
const MAX_ACTIVE_CATS = 4;       // 동시 최대 고양이 수
const STORAGE_KEY     = 'cat-whack-best';
const COUNTDOWN_SECONDS = 3;
const TOAST_DURATION_MS = 2200;
const HIT_EFFECT_DURATION_MS = 500;
const SCORE_POPUP_DURATION_MS = 700;
const HALF_TIME_SECONDS = GAME_DURATION / 2;

// 고양이 타입
const CAT_TYPES = [
  { points: 1, weight: 80, cls: '', pixelClass: 'pixel-cat--normal' }, // 일반 고양이
  { points: 3, weight: 20, cls: 'is-golden', pixelClass: 'pixel-cat--gold' }, // 황금 고양이
];

// 등급 테이블
const GRADES = [
  { min: 0,  emoji: '😴', grade: '냥이 무시',   msg: '고양이들이 비웃고 있어요...' },
  { min: 5,  emoji: '🐱', grade: '냥이 입문자', msg: '조금 더 빠르게!' },
  { min: 10, emoji: '🐈', grade: '냥이 집사',   msg: '집사 실력이 보여요!' },
  { min: 16, emoji: '🏃', grade: '냥이 사냥꾼', msg: '빠른 손놀림!' },
  { min: 22, emoji: '⚡', grade: '냥이 마스터', msg: '고양이들이 두려워해요!' },
  { min: 30, emoji: '👑', grade: '전설의 냥잡이', msg: '당신은 전설입니다!' },
];

// ── DOM 참조 ──────────────────────────────────────────
const $ = id => document.getElementById(id);

const stateIdle      = $('stateIdle');
const stateCountdown = $('stateCountdown');
const statePlay      = $('statePlay');
const stateResult    = $('stateResult');
const countdownNum   = $('countdownNum');
const timerText      = $('timerText');
const timerFill      = $('timerFill');
const scoreText      = $('scoreText');
const holeGrid       = $('holeGrid');
const missText       = $('missText');
const resultEmoji    = $('resultEmoji');
const resultScore    = $('resultScore');
const resultGrade    = $('resultGrade');
const resultMessage  = $('resultMessage');
const resultBest     = $('resultBest');
const bestScoreIdle  = $('bestScoreIdle');
const startBtn       = $('startBtn');
const retryBtn       = $('retryBtn');
const shareBtn       = $('shareBtn');
const shareToast     = $('shareToast');

// ── 게임 상태 ──────────────────────────────────────────
let score        = 0;
let gameRunning  = false;
let rafId        = null;
let startTime    = 0;
let spawnTimer   = null;
let holeEls      = [];       // hole DOM elements
let holeState    = [];       // { active, type, timeout }
let missTimer    = null;
let countdownRafId = null;
let toastTimer     = null;
let timerZone      = 'safe';

// ── 구멍 생성 ──────────────────────────────────────────
function buildHoles() {
  holeGrid.innerHTML = '';
  holeEls = [];
  holeState = [];

  for (let i = 0; i < HOLES_COUNT; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.setAttribute('aria-label', '구멍');

    const pit = document.createElement('div');
    pit.className = 'hole__pit';

    const catWrap = document.createElement('div');
    catWrap.className = 'hole__cat-wrap';

    const cat = document.createElement('div');
    cat.className = 'hole__cat pixel-cat pixel-cat--normal';

    const hitEffect = document.createElement('div');
    hitEffect.className = 'hole__hit-effect';

    const mound = document.createElement('div');
    mound.className = 'hole__mound';

    const scorePopup = document.createElement('div');
    scorePopup.className = 'score-popup';

    catWrap.appendChild(cat);
    hole.appendChild(pit);
    hole.appendChild(catWrap);
    hole.appendChild(hitEffect);
    hole.appendChild(mound);
    hole.appendChild(scorePopup);

    hole.addEventListener('pointerdown', () => onHoleClick(i));

    holeGrid.appendChild(hole);
    holeEls.push(hole);
    holeState.push({
      active: false,
      type: null,
      timeout: null,
      catEl: cat,
      hitEffectEl: hitEffect,
      scorePopupEl: scorePopup,
    });
  }
}

// ── 고양이 타입 랜덤 선택 ──────────────────────────────
function pickCatType() {
  const total = CAT_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of CAT_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return CAT_TYPES[0];
}

// ── 고양이 등장 ────────────────────────────────────────
function spawnCat() {
  if (!gameRunning) return;

  const activeCount = holeState.filter(h => h.active).length;
  if (activeCount >= MAX_ACTIVE_CATS) {
    scheduleNextSpawn();
    return;
  }

  // 비어있는 구멍 목록
  const emptyHoles = holeState
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => !h.active)
    .map(({ i }) => i);

  if (emptyHoles.length === 0) {
    scheduleNextSpawn();
    return;
  }

  const idx = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
  const type = pickCatType();
  const elapsed = (performance.now() - startTime) / 1000;

  // 시간 경과에 따라 고양이가 더 빨리 사라짐
  const stayDuration = Math.max(700, 1300 - elapsed * 20);

  showCat(idx, type, stayDuration);
  scheduleNextSpawn();
}

function scheduleNextSpawn() {
  if (!gameRunning) {
    return;
  }

  const elapsed = (performance.now() - startTime) / 1000;
  const hasEnteredRush = elapsed >= HALF_TIME_SECONDS;
  const baseInterval = 900 - elapsed * 16;
  const rushInterval = 620 - (elapsed - HALF_TIME_SECONDS) * 22;
  const interval = hasEnteredRush
    ? Math.max(220, Math.min(baseInterval, rushInterval))
    : Math.max(400, baseInterval);

  spawnTimer = setTimeout(spawnCat, interval);
}

function showCat(idx, type, duration) {
  const hole = holeEls[idx];
  const state = holeState[idx];
  const cat = state.catEl;

  cat.className = `hole__cat pixel-cat ${type.pixelClass}`;
  hole.classList.add('is-active');
  if (type.cls) {
    hole.classList.add(type.cls);
  }

  state.active = true;
  state.type = type;

  // 자동 퇴장
  state.timeout = setTimeout(() => {
    if (state.active) {
      hideCat(idx);
    }
  }, duration);
}

function hideCat(idx) {
  const hole = holeEls[idx];
  const state = holeState[idx];
  hole.classList.remove('is-active', 'is-golden', 'is-hit');
  state.active = false;
  state.type = null;
  state.catEl.className = 'hole__cat pixel-cat pixel-cat--normal';
  clearTimeout(state.timeout);
  state.timeout = null;
}

// ── 클릭 처리 ──────────────────────────────────────────
function onHoleClick(idx) {
  const state = holeState[idx];
  if (!gameRunning || !state.active) {
    return;
  }

  const type = state.type;
  const hole = holeEls[idx];

  // 점수 추가
  score += type.points;
  scoreText.textContent = score;

  // HIT 애니메이션
  clearTimeout(state.timeout);
  state.active = false;
  state.type = null;
  state.timeout = null;

  hole.classList.remove('is-active');
  hole.classList.add('is-hit');

  showHitEffect(state.hitEffectEl, type);
  showScorePopup(state.scorePopupEl, type);

  setTimeout(() => {
    hole.classList.remove('is-hit');
    if (type.cls) {
      hole.classList.remove(type.cls);
    }
  }, 350);
}

function showHitEffect(element, type) {
  element.textContent = type.points > 1 ? `+${type.points}★` : '+1';
  element.className = `hole__hit-effect ${type.points > 1 ? 'hole__hit-effect--gold' : 'hole__hit-effect--normal'}`;
  playElementAnimation(
    element,
    [
      { opacity: 0, transform: 'translateX(-50%) translateY(6px) scale(0.72)' },
      { opacity: 1, transform: 'translateX(-50%) translateY(-8px) scale(1.18)', offset: 0.4 },
      { opacity: 0, transform: 'translateX(-50%) translateY(-36px) scale(0.92)' },
    ],
    { duration: HIT_EFFECT_DURATION_MS, easing: 'ease-out' }
  );
}

function showScorePopup(element, type) {
  element.textContent = `+${type.points}`;
  element.className = `score-popup ${type.points > 1 ? 'score-popup--gold' : 'score-popup--normal'}`;
  playElementAnimation(
    element,
    [
      { opacity: 0, transform: 'translate(-50%, 0) scale(0.7)' },
      { opacity: 1, transform: 'translate(-50%, -20px) scale(1)', offset: 0.25 },
      { opacity: 1, transform: 'translate(-50%, -46px) scale(1.08)', offset: 0.8 },
      { opacity: 0, transform: 'translate(-50%, -66px) scale(0.84)' },
    ],
    { duration: SCORE_POPUP_DURATION_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );
}

function playElementAnimation(element, keyframes, options) {
  if (element._animation) {
    element._animation.cancel();
  }

  const animation = element.animate(keyframes, {
    fill: 'none',
    ...options,
  });

  element._animation = animation;
  animation.addEventListener('finish', () => {
    if (element._animation === animation) {
      element._animation = null;
    }
  });
  animation.addEventListener('cancel', () => {
    if (element._animation === animation) {
      element._animation = null;
    }
  });
}

// ── 게임 루프 (타이머) ─────────────────────────────────
function gameLoop(now) {
  if (!gameRunning) {
    return;
  }

  const elapsed  = (now - startTime) / 1000;
  const remaining = Math.max(0, GAME_DURATION - elapsed);
  const ratio     = remaining / GAME_DURATION;

  timerText.textContent = Math.ceil(remaining);
  timerFill.style.width = `${ratio * 100}%`;
  updateTimerZone(ratio);

  if (remaining <= 0) {
    endGame();
    return;
  }

  rafId = requestAnimationFrame(gameLoop);
}

// ── 게임 흐름 ──────────────────────────────────────────
function showState(el) {
  [stateIdle, stateCountdown, statePlay, stateResult].forEach(s => {
    s.classList.add('hidden');
  });
  el.classList.remove('hidden');
}

function startCountdown() {
  showState(stateCountdown);
  let previousSecond = COUNTDOWN_SECONDS;
  const countdownStart = performance.now();

  cancelAnimationFrame(countdownRafId);
  countdownNum.textContent = COUNTDOWN_SECONDS;
  countdownNum.style.color = 'var(--cyan)';
  restartCountdownAnimation();

  const tick = now => {
    const elapsedSeconds = (now - countdownStart) / 1000;
    const remaining = Math.ceil(COUNTDOWN_SECONDS - elapsedSeconds);

    if (remaining <= 0) {
      countdownNum.textContent = 'GO!';
      countdownNum.style.color = 'var(--green)';
      restartCountdownAnimation();
      setTimeout(startGame, 350);
      return;
    }

    if (remaining !== previousSecond) {
      previousSecond = remaining;
      countdownNum.textContent = remaining;
      restartCountdownAnimation();
    }

    countdownRafId = requestAnimationFrame(tick);
  };

  countdownRafId = requestAnimationFrame(tick);
}

function restartCountdownAnimation() {
  countdownNum.getAnimations().forEach(animation => animation.cancel());
  countdownNum.animate(
    [
      { transform: 'scale(1.28)', opacity: 0.3 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    {
      duration: 320,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'none',
    }
  );
}

function startGame() {
  score       = 0;
  gameRunning = true;
  startTime   = performance.now();

  scoreText.textContent = '0';
  timerText.textContent = GAME_DURATION;
  timerFill.style.width = '100%';
  timerZone = 'safe';
  timerFill.className = 'hud-timer-fill is-safe';
  missText.textContent  = '';

  buildHoles();
  showState(statePlay);

  rafId = requestAnimationFrame(gameLoop);
  scheduleNextSpawn();
}

function endGame() {
  gameRunning = false;
  clearTimeout(spawnTimer);
  cancelAnimationFrame(rafId);
  cancelAnimationFrame(countdownRafId);

  // 모든 고양이 숨기기
  holeState.forEach((h, i) => {
    if (h.active) {
      hideCat(i);
    }
    clearTimeout(h.timeout);
  });

  // 최고 기록
  const prev = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  const isNew = score > prev;
  if (isNew) localStorage.setItem(STORAGE_KEY, score);

  // 등급 계산
  let grade = GRADES[0];
  for (const g of GRADES) {
    if (score >= g.min) grade = g;
  }

  resultEmoji.textContent   = grade.emoji;
  resultScore.textContent   = score;
  resultGrade.textContent   = grade.grade;
  resultMessage.textContent = grade.msg;
  resultBest.textContent    = isNew ? '★ NEW RECORD! ★' : `BEST: ${Math.max(score, prev)}`;

  showState(stateResult);
}

// ── 공유 ──────────────────────────────────────────────
function copyShare() {
  const text = `🐱 고양이 잡기\nSCORE: ${score}\nhttps://eottabom.github.io/playground/cat-whack/`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('COPIED!');
  }).catch(() => {
    showToast('SHARE FAILED');
  });
}

function showToast(msg) {
  clearTimeout(toastTimer);
  shareToast.textContent = msg;
  shareToast.classList.add('is-visible');
  toastTimer = setTimeout(() => shareToast.classList.remove('is-visible'), TOAST_DURATION_MS);
}

// ── 최고기록 표시 ──────────────────────────────────────
function updateIdleBest() {
  const best = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  bestScoreIdle.textContent = best > 0 ? `BEST: ${best}` : '';
}

function updateTimerZone(ratio) {
  let nextZone = 'safe';

  if (ratio < 0.3) {
    nextZone = 'danger';
  } else if (ratio < 0.6) {
    nextZone = 'warning';
  }

  if (nextZone === timerZone) {
    return;
  }

  timerZone = nextZone;
  timerFill.classList.remove('is-safe', 'is-warning', 'is-danger');
  timerFill.classList.add(`is-${nextZone}`);
}

function renderRetroCat(selector, pixelClass) {
  document.querySelectorAll(selector).forEach(element => {
    element.textContent = '';
    element.classList.add('pixel-cat-badge');

    const cat = document.createElement('span');
    cat.className = `pixel-cat pixel-cat--badge ${pixelClass}`;
    cat.setAttribute('aria-hidden', 'true');
    element.appendChild(cat);
  });
}

// ── 이벤트 ────────────────────────────────────────────
startBtn.addEventListener('pointerdown', () => {
  updateIdleBest();
  startCountdown();
});

retryBtn.addEventListener('pointerdown', startCountdown);
shareBtn.addEventListener('pointerdown', copyShare);

// ── 초기화 ────────────────────────────────────────────
renderRetroCat('.header-icon', 'pixel-cat--normal');
renderRetroCat('.guide-item:first-child .guide-emoji', 'pixel-cat--normal');
renderRetroCat('.guide-item--gold .guide-emoji', 'pixel-cat--gold');
updateIdleBest();
