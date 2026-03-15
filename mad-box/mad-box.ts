"use strict";

const LONG_PRESS_MS = 500;
const SWIPE_THRESHOLD = 100;
const SMASH_SHATTER_COUNT = 8;
const GUN_BURST_COUNT = 5;
const GUN_BURST_INTERVAL_MS = 70;
const BURN_SPEED = 0.004;
const BURN_END = 1.4;
const EXPLODE_PARTICLE_COUNT = 300;
const MSG_BURN_IGNITE_INTERVAL = 30;
const MSG_BURN_DURATION = 50;
const CATHARSIS_DURATION_MS = 2500;
const SHARE_CANVAS_WIDTH = 400;

class MadBox {
    constructor() {
        this.messages = [];
        this.STORAGE_KEY = 'mad-box-messages';
        this.destroying = false;
        this.animFrame = 0;
        this.vw = 0;
        this.vh = 0;
        this.dpr = 1;

        /* 불 효과 */
        this.fireProgress = 0;
        this.fireParts = [];

        /* 부수기 */
        this.smashCount = 0;
        this.shattering = false;
        this.smashFlash = 0;
        this.shards = [];

        /* 폭발 */
        this.explodeParts = [];
        this.explodeFlash = 0;
        this.explodeRing = 0;
        this.mushroomProgress = 0;

        /* 내려보내기 */
        this.flushProgress = 0;

        /* DOM 요소 */
        this.chatArea = document.getElementById('chatArea');
        this.emptyState = document.getElementById('emptyState');
        this.input = document.getElementById('msgInput');
        this.toolbar = document.getElementById('toolbar');
        this.canvas = document.getElementById('destroyCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.hint = document.getElementById('destroyHint');

        /* 부수기 이벤트 핸들러 */
        this._onSmashClick = (e) => {
            e.preventDefault();
            this.onSmashTap(e.clientX, e.clientY);
        };
        this._onSmashTouch = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            if (t) this.onSmashTap(t.clientX, t.clientY);
        };

        this.load();
        this.render();
        this.bindEvents();
    }

    /* 저장 */

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            this.messages = raw ? JSON.parse(raw) : [];
        } catch { this.messages = []; }
    }

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
    }

    /* 시간 */

    formatTime(ts) {
        const d = new Date(ts);
        const h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
    }

    /* 채팅 CRUD */

    addMessage(text) {
        if (this.destroying) return;
        const msg = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            text: text.trim(),
            time: Date.now(),
        };
        this.messages.push(msg);
        this.save();
        this.appendBubble(msg, true);
        this.updateUI();
        this.scrollToBottom();
    }

    deleteMessage(id) {
        this.messages = this.messages.filter(m => m.id !== id);
        this.save();
        const el = this.chatArea.querySelector(`[data-id="${id}"]`);
        if (el) {
            el.style.transition = 'transform 0.4s ease, opacity 0.4s';
            el.style.transform = 'translateX(-120%) scale(0.8)';
            el.style.opacity = '0';
            setTimeout(() => { el.remove(); this.updateUI(); }, 400);
        }
    }

    /* 렌더링 */

    render() {
        this.chatArea.querySelectorAll('.msg-row').forEach(el => el.remove());
        this.messages.forEach(msg => this.appendBubble(msg, false));
        this.updateUI();
        requestAnimationFrame(() => this.scrollToBottom());
    }

    appendBubble(msg, animate) {
        const row = document.createElement('div');
        row.className = 'msg-row';
        row.dataset.id = msg.id;

        const time = document.createElement('span');
        time.className = 'msg-time';
        time.textContent = this.formatTime(msg.time);

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = msg.text;

        row.appendChild(time);
        row.appendChild(bubble);
        this.chatArea.insertBefore(row, this.emptyState);

        this.setupLongPress(row, msg.id);
        this.setupSwipe(row, msg.id);

        if (animate) {
            requestAnimationFrame(() => row.classList.add('show'));
        } else {
            row.classList.add('show');
        }
    }

    updateUI() {
        const has = this.messages.length > 0;
        this.emptyState.style.display = has ? 'none' : 'flex';
        this.toolbar.classList.add('visible');
    }

    scrollToBottom() {
        this.chatArea.scrollTop = this.chatArea.scrollHeight;
    }

    /* 롱프레스 */

    setupLongPress(el, id) {
        let timer = 0, cancelled = false;
        const start = () => { cancelled = false; timer = setTimeout(() => { if (!cancelled && !this.destroying) this.deleteMessage(id); }, 500); };
        const cancel = () => { cancelled = true; clearTimeout(timer); };
        el.addEventListener('touchstart', start, { passive: true });
        el.addEventListener('touchend', cancel);
        el.addEventListener('touchmove', cancel);
        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', cancel);
        el.addEventListener('mouseleave', cancel);
    }

    /* 스와이프 */

    setupSwipe(el, id) {
        let sx = 0, cx = 0, active = false;
        el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; cx = sx; active = true; el.style.transition = 'none'; }, { passive: true });
        el.addEventListener('touchmove', (e) => {
            if (!active) return;
            cx = e.touches[0].clientX;
            const d = cx - sx;
            if (d < 0) { el.style.transform = `translateX(${d}px)`; el.style.opacity = `${Math.max(0, 1 + d / 250)}`; }
        }, { passive: true });
        el.addEventListener('touchend', () => {
            if (!active) return;
            active = false;
            if (cx - sx < -SWIPE_THRESHOLD) {
                el.style.transition = 'transform 0.3s, opacity 0.3s';
                el.style.transform = 'translateX(-120%)';
                el.style.opacity = '0';
                setTimeout(() => this.deleteMessage(id), 300);
            } else { el.style.transition = 'transform 0.3s, opacity 0.3s'; el.style.transform = ''; el.style.opacity = ''; }
        });
    }

    /* 캔버스 헬퍼 */

    resizeCanvas() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.vw = window.innerWidth;
        this.vh = window.innerHeight;
        this.canvas.width = this.vw * this.dpr;
        this.canvas.height = this.vh * this.dpr;
        this.canvas.style.width = this.vw + 'px';
        this.canvas.style.height = this.vh + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    showCanvas() {
        if (!this.canvas.classList.contains('active')) {
            this.resizeCanvas();
            this.canvas.classList.add('active');
        }
    }

    hideCanvas() {
        this.canvas.classList.remove('active', 'interactive', 'smash-cursor');
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.clearRect(0, 0, this.vw, this.vh);
    }

    /* Canvas를 지우지 않고 interactive만 해제 */
    deactivateCanvas() {
        this.canvas.classList.remove('interactive', 'smash-cursor', 'gun-cursor', 'lightning-cursor', 'paint-cursor', 'water-cursor', 'axe-cursor');
    }

    clearCanvas() {
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.ctx.clearRect(0, 0, this.vw, this.vh);
        this.canvas.classList.remove('active', 'interactive', 'smash-cursor', 'gun-cursor', 'lightning-cursor', 'paint-cursor', 'water-cursor', 'axe-cursor');
    }

    showHint(text) {
        this.hint.textContent = text;
        this.hint.classList.add('show');
    }

    hideHint() {
        this.hint.classList.remove('show');
    }

    /* 파괴 모드 디스패처 */

    startDestroy(mode) {
        const interactive = ['smash', 'throw', 'yeot', 'egg', 'gun', 'water', 'paint', 'lightning', 'axe', 'dynamite'];

        /* 같은 인터랙티브 모드면 토글 OFF */
        if (this.destroying && this.activeMode === mode && interactive.includes(mode)) {
            this.exitInteractive();
            return;
        }

        /* 다른 인터랙티브 모드로 전환: 이전 해제 후 시작 */
        if (this.destroying && interactive.includes(this.activeMode)) {
            this.exitInteractive();
        }

        /* 자동재생(불/폭발) 중에는 중단 불가 */
        if (this.destroying) return;

        this.destroying = true;
        this.activeMode = mode;

        /* 활성 버튼 하이라이트 */
        this.toolbar.querySelectorAll('[data-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        /* 인터랙티브 모드 시 툴바를 캔버스 위로 */
        if (interactive.includes(mode)) {
            this.toolbar.classList.add('z-top');
        }

        switch (mode) {
            case 'burn': this.startBurn(); break;
            case 'smash': this.startSmash(); break;
            case 'explode': this.startExplode(); break;
            case 'throw': this.startThrow(); break;
            case 'yeot': this.startYeot(); break;
            case 'egg': this.startEgg(); break;
            case 'gun': this.startGun(); break;
            case 'water': this.startWater(); break;
            case 'paint': this.startPaint(); break;
            case 'lightning': this.startLightning(); break;
            case 'axe': this.startAxe(); break;
            case 'dynamite': this.startDynamite(); break;
        }
    }

    /* Auto-play 종료 (불/폭발): 캔버스 클리어 */
    finishDestroy() {
        cancelAnimationFrame(this.animFrame);
        this.hideCanvas();
        this.hideHint();
        this.activeMode = null;
        this.toolbar.querySelectorAll('[data-mode]').forEach(btn => btn.classList.remove('active'));
        this.toolbar.classList.remove('z-top');

        /* 초기화 모드였으면 메시지 삭제 */
        if (this._resetAfterBurn) {
            this._resetAfterBurn = false;
            this.messages = [];
            this.save();
            this.chatArea.querySelectorAll('.msg-row').forEach(el => el.remove());
            this.updateUI();
            this.showToast('모두 태워버렸어요 🔥');
        } else {
            this.showCatharsis();
        }

        this.destroying = false;
    }

    /* Interactive 종료 (부수기/깡통/계란/총): 캔버스 그대로 유지 */
    exitInteractive() {
        this.canvas.removeEventListener('click', this._onSmashClick);
        this.canvas.removeEventListener('touchstart', this._onSmashTouch);
        if (this._onThrowClick) { this.canvas.removeEventListener('click', this._onThrowClick); this._onThrowClick = null; }
        if (this._onThrowTouch) { this.canvas.removeEventListener('touchstart', this._onThrowTouch); this._onThrowTouch = null; }
        if (this._onEggClick) { this.canvas.removeEventListener('click', this._onEggClick); this._onEggClick = null; }
        if (this._onEggTouch) { this.canvas.removeEventListener('touchstart', this._onEggTouch); this._onEggTouch = null; }
        if (this._onGunClick) { this.canvas.removeEventListener('click', this._onGunClick); this._onGunClick = null; }
        if (this._onGunTouch) { this.canvas.removeEventListener('touchstart', this._onGunTouch); this._onGunTouch = null; }
        this._cleanupYeot();
        this._cleanupWater();
        this._cleanupPaint();
        this._cleanupLightning();
        this._cleanupAxe();
        this._cleanupDynamite();

        /* 캔버스 내용 유지, interactive만 해제 */
        this.deactivateCanvas();
        this.hideHint();
        this.activeMode = null;
        this.toolbar.querySelectorAll('[data-mode]').forEach(btn => btn.classList.remove('active'));
        this.toolbar.classList.remove('z-top');
        this.destroying = false;
    }

    showCatharsis() {
        const el = document.createElement('div');
        el.className = 'catharsis';
        el.textContent = '시원하죠? 😌';
        this.chatArea.insertBefore(el, this.emptyState);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.add('hide');
            setTimeout(() => el.remove(), 400);
        }, 2500);
    }

    /* 
          🔥 BURN — 화면을 불태우기
           */

    startBurn() {
        this.fireProgress = 0;
        this.fireParts = [];
        this.showCanvas();
        this.animFrame = requestAnimationFrame(() => this.animateBurn());
    }

    animateBurn() {
        const ctx = this.ctx;
        const w = this.vw, h = this.vh;
        ctx.clearRect(0, 0, w, h);

        this.fireProgress += BURN_SPEED;
        const fy = h * (1 - this.fireProgress);

        /* 1. 불탄 영역 (어두운 잿빛) */
        const ash = ctx.createLinearGradient(0, fy, 0, fy + 80);
        ash.addColorStop(0, 'rgba(8,3,0,0)');
        ash.addColorStop(0.3, 'rgba(8,3,0,0.75)');
        ash.addColorStop(1, 'rgba(5,2,0,0.98)');
        ctx.fillStyle = ash;
        ctx.fillRect(0, fy, w, h - fy + 10);

        /* 2. 불꽃 벽 그라데이션 */
        const band = ctx.createLinearGradient(0, fy - 100, 0, fy + 20);
        band.addColorStop(0, 'rgba(80,20,0,0)');
        band.addColorStop(0.25, 'rgba(180,40,0,0.15)');
        band.addColorStop(0.5, 'rgba(220,80,0,0.35)');
        band.addColorStop(0.7, 'rgba(255,120,20,0.45)');
        band.addColorStop(0.85, 'rgba(255,80,0,0.3)');
        band.addColorStop(1, 'rgba(150,30,0,0.1)');
        ctx.fillStyle = band;
        ctx.fillRect(0, fy - 100, w, 120);

        /* 3. 파티클 대량 생성 */

        /* 큰 기본 불꽃 */
        for (let i = 0; i < 20; i++) {
            this.fireParts.push({
                x: Math.random() * w,
                y: fy + (Math.random() - 0.3) * 50,
                s: 8 + Math.random() * 18,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -(0.5 + Math.random() * 2.5),
                life: 35 + (Math.random() * 30) | 0,
                max: 65,
            });
        }

        /* 중간 불꽃 */
        for (let i = 0; i < 10; i++) {
            this.fireParts.push({
                x: Math.random() * w,
                y: fy + (Math.random() - 0.4) * 30,
                s: 4 + Math.random() * 10,
                vx: (Math.random() - 0.5) * 2,
                vy: -(2 + Math.random() * 4),
                life: 30 + (Math.random() * 25) | 0,
                max: 55,
            });
        }

        /* 밝은 불꽃 끝 */
        for (let i = 0; i < 5; i++) {
            this.fireParts.push({
                x: Math.random() * w,
                y: fy + (Math.random() - 0.5) * 15,
                s: 2 + Math.random() * 5,
                vx: (Math.random() - 0.5) * 1,
                vy: -(3 + Math.random() * 5),
                life: 18 + (Math.random() * 15) | 0,
                max: 33,
                tip: true,
            });
        }

        /* 불씨 */
        for (let i = 0; i < 2; i++) {
            this.fireParts.push({
                x: Math.random() * w,
                y: fy - Math.random() * 15,
                s: 0.6 + Math.random() * 1.8,
                vx: (Math.random() - 0.5) * 4.5,
                vy: -(5 + Math.random() * 7),
                life: 60 + (Math.random() * 50) | 0,
                max: 110,
                ember: true,
            });
        }

        /* 연기 */
        if (Math.random() > 0.5 && this.fireProgress > 0.1) {
            this.fireParts.push({
                x: Math.random() * w,
                y: fy - 50 - Math.random() * 80,
                s: 12 + Math.random() * 28,
                vx: (Math.random() - 0.5) * 0.6,
                vy: -(0.2 + Math.random() * 0.6),
                life: 45 + (Math.random() * 30) | 0,
                max: 75,
                smoke: true,
            });
        }

        /* 4. 연기 먼저 그리기 (불 뒤) */
        for (let i = this.fireParts.length - 1; i >= 0; i--) {
            const p = this.fireParts[i];
            if (!p.smoke) continue;
            p.x += p.vx; p.y += p.vy; p.life--; p.s *= 0.998;
            if (p.life <= 0) { this.fireParts.splice(i, 1); continue; }
            const t = p.life / p.max;
            ctx.globalAlpha = Math.min(0.22, t * 0.3);
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.s * 1.3, p.s, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        /* 5. 불꽃 그리기 (additive) */
        ctx.globalCompositeOperation = 'lighter';

        for (let i = this.fireParts.length - 1; i >= 0; i--) {
            const p = this.fireParts[i];
            if (p.smoke) continue;
            p.x += p.vx; p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.25;
            p.life--; p.s *= (p.ember ? 0.993 : 0.98);
            if (p.life <= 0 || p.s < 0.1) { this.fireParts.splice(i, 1); continue; }

            const t = p.life / p.max;

            /* 불씨: 작고 밝은 점 */
            if (p.ember) {
                ctx.globalAlpha = Math.min(1, t * 2.5);
                ctx.fillStyle = t > 0.5 ? '#ffcc44' : '#ff6622';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
                continue;
            }

            /* 수명에 따른 색상 변화 */
            let r, g, b;
            if (p.tip) {
                r = 255; g = 220 + t * 35; b = 120 + t * 80;
            } else if (t > 0.65) {
                r = 255; g = 160 + (t - 0.65) * 270; b = (t - 0.65) * 120;
            } else if (t > 0.35) {
                r = 255; g = 40 + (t - 0.35) * 400; b = 0;
            } else {
                r = 120 + (t / 0.35) * 135; g = (t / 0.35) * 30 | 0; b = 0;
            }

            ctx.globalAlpha = Math.min(0.55, t * 1.2);
            ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.s * 0.5, p.s * 1.4, 0, 0, Math.PI * 2);
            ctx.fill();

            /* 큰 파티클 중심부 밝은 빛 */
            if (p.s > 6 && t > 0.35) {
                ctx.globalAlpha = t * 0.35;
                ctx.fillStyle = `rgb(255,${200 + t * 55 | 0},${50 + t * 60 | 0})`;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.s * 0.2, p.s * 0.55, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        if (this.fireProgress >= BURN_END) {
            this.finishDestroy();
        } else {
            this.animFrame = requestAnimationFrame(() => this.animateBurn());
        }
    }

    /* 
          🔨 SMASH — 망치로 화면 깨기
           */

    startSmash() {
        this.smashCount = 0;
        this.shattering = false;
        this.shards = [];
        this.showCanvas();
        this.canvas.classList.add('interactive', 'smash-cursor');

        /* 유리 오버레이 */
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, this.vw, this.vh);
        grad.addColorStop(0, 'rgba(200, 220, 255, 0.03)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, 'rgba(200, 220, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.vw, this.vh);

        this.showHint('화면을 탭해서 부수세요! 🔨');

        this.canvas.addEventListener('click', this._onSmashClick);
        this.canvas.addEventListener('touchstart', this._onSmashTouch);
    }

    onSmashTap(x, y) {
        if (this.shattering) return;
        this.smashCount++;
        if (this.smashCount === 1) this.hideHint();

        this.showHammerStrike(x, y);

        setTimeout(() => {
            this.drawCrack(x, y);
            navigator.vibrate?.(40);

            if (this.smashCount >= SMASH_SHATTER_COUNT) {
                setTimeout(() => this.triggerShatter(), 150);
            }
        }, 120);
    }

    showHammerStrike(x, y) {
        const el = document.createElement('div');
        el.textContent = '🔨';
        el.style.cssText = `position:fixed;left:${x - 24}px;top:${y - 48}px;font-size:3rem;z-index:102;pointer-events:none;transform:rotate(-60deg) translate(-10px,-20px);transition:transform 0.12s cubic-bezier(0.2,0,0.8,1);`;
        document.body.appendChild(el);

        requestAnimationFrame(() => {
            el.style.transform = 'rotate(10deg) translate(0,0)';
        });

        setTimeout(() => {
            el.style.transition = 'transform 0.15s ease-out, opacity 0.2s';
            el.style.transform = 'rotate(-30deg) translate(-10px,-15px)';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
        }, 140);
    }

    drawCrack(cx, cy) {
        const ctx = this.ctx;

        /* 충격점 */
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        /* 보조 원 */
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 + Math.random() * 10, 0, Math.PI * 2);
        ctx.stroke();

        const branches = 3 + (Math.random() * 2) | 0;
        for (let b = 0; b < branches; b++) {
            let angle = (Math.PI * 2 / branches) * b + (Math.random() - 0.5) * 0.7;
            let px = cx, py = cy;
            const totalLen = 25 + Math.random() * 55;
            const segs = 4 + (Math.random() * 4) | 0;
            const segLen = totalLen / segs;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.strokeStyle = `rgba(200,220,255,${0.45 + Math.random() * 0.4})`;
            ctx.lineWidth = 1.5 + Math.random() * 2;

            for (let s = 0; s < segs; s++) {
                angle += (Math.random() - 0.5) * 0.9;
                px += Math.cos(angle) * segLen;
                py += Math.sin(angle) * segLen;
                ctx.lineTo(px, py);

                /* 가지 */
                if (Math.random() > 0.45 && s > 0) {
                    ctx.stroke();
                    const sa = angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.7);
                    let bx = px, by = py;
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    ctx.lineWidth = 0.5 + Math.random() * 1;
                    ctx.strokeStyle = `rgba(200,220,255,${0.25 + Math.random() * 0.3})`;
                    for (let ss = 0; ss < 2 + (Math.random() * 3) | 0; ss++) {
                        bx += Math.cos(sa + (Math.random() - 0.5) * 0.5) * segLen * 0.45;
                        by += Math.sin(sa + (Math.random() - 0.5) * 0.5) * segLen * 0.45;
                        ctx.lineTo(bx, by);
                    }
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineWidth = 1.5 + Math.random() * 2;
                    ctx.strokeStyle = `rgba(200,220,255,${0.45 + Math.random() * 0.4})`;
                }
            }
            ctx.stroke();
        }
    }

    triggerShatter() {
        this.shattering = true;
        this.canvas.removeEventListener('click', this._onSmashClick);
        this.canvas.removeEventListener('touchstart', this._onSmashTouch);
        this.canvas.classList.remove('interactive');

        this.smashFlash = 1;
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
        navigator.vibrate?.(100);

        this.shards = [];
        for (let i = 0; i < 30; i++) {
            this.shards.push({
                x: Math.random() * this.vw, y: Math.random() * this.vh,
                vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 8,
                rot: Math.random() * Math.PI * 2, rv: (Math.random() - 0.5) * 0.2,
                w: 15 + Math.random() * 45, h: 10 + Math.random() * 30,
                a: 0.4 + Math.random() * 0.45,
            });
        }
        this.animFrame = requestAnimationFrame(() => this.animateShatter());
    }

    animateShatter() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.vw, this.vh);

        if (this.smashFlash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${this.smashFlash})`;
            ctx.fillRect(0, 0, this.vw, this.vh);
            this.smashFlash -= 0.05;
        }

        let alive = 0;
        for (const s of this.shards) {
            s.x += s.vx; s.y += s.vy; s.vy += 0.35;
            s.rot += s.rv; s.a -= 0.007;
            if (s.a <= 0 || s.y > this.vh + 60) continue;
            alive++;

            ctx.save();
            ctx.translate(s.x, s.y); ctx.rotate(s.rot);
            ctx.globalAlpha = s.a;
            ctx.fillStyle = 'rgba(180,200,230,0.2)';
            ctx.strokeStyle = 'rgba(220,235,255,0.4)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, -s.h / 2); ctx.lineTo(s.w / 2, s.h / 2); ctx.lineTo(-s.w / 3, s.h / 3);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        if (alive === 0 && this.smashFlash <= 0) {
            /* Shatter 끝나도 캔버스 유지 (금 자국 남기기) */
            this.deactivateCanvas();
            this.hideHint();
            this.activeMode = null;
            this.toolbar.querySelectorAll('[data-mode]').forEach(btn => btn.classList.remove('active'));
            this.toolbar.classList.remove('z-top');
            this.showCatharsis();
            this.destroying = false;
        } else {
            this.animFrame = requestAnimationFrame(() => this.animateShatter());
        }
    }

    finishSmash() {
        this.canvas.removeEventListener('click', this._onSmashClick);
        this.canvas.removeEventListener('touchstart', this._onSmashTouch);
        this.finishDestroy();
    }

    /* 
          💣 EXPLODE — 핵폭발
           */

    startExplode() {
        this.explodeFlash = 1.5;
        this.explodeRing = 0;
        this.mushroomProgress = 0;
        this.explodeParts = [];
        this.groundFire = [];

        const cx = this.vw / 2, cy = this.vh * 0.4;
        const colors = ['#fff', '#fff', '#fffbe6', '#ffed8a', '#ffb700', '#ff8c00', '#ff4500', '#ff2200', '#cc0000'];

        /* 주 폭발 파티클 */
        for (let i = 0; i < 300; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 18;
            this.explodeParts.push({
                x: cx + (Math.random() - 0.5) * 40,
                y: cy + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - Math.random() * 4,
                s: 2 + Math.random() * 10,
                color: colors[(Math.random() * colors.length) | 0],
                life: 40 + (Math.random() * 60) | 0,
                max: 100,
            });
        }

        /* 지면 화재 */
        for (let i = 0; i < 40; i++) {
            this.groundFire.push({
                x: Math.random() * this.vw,
                y: this.vh * (0.6 + Math.random() * 0.4),
                s: 3 + Math.random() * 8,
                vx: (Math.random() - 0.5) * 2,
                vy: -(Math.random() * 3),
                life: 80 + (Math.random() * 50) | 0, max: 130,
            });
        }

        /* 강한 화면 흔들림 */
        document.body.classList.add('shake');
        setTimeout(() => {
            document.body.classList.remove('shake');
            setTimeout(() => { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 400); }, 100);
        }, 500);
        navigator.vibrate?.([80, 30, 120, 40, 200, 30, 100]);

        this.showCanvas();
        this.animFrame = requestAnimationFrame(() => this.animateExplode());
    }

    animateExplode() {
        const ctx = this.ctx;
        const w = this.vw, h = this.vh;
        const cx = w / 2, cy = h * 0.4;
        ctx.clearRect(0, 0, w, h);

        this.mushroomProgress += 0.009;

        /* 눈부신 플래시 */
        if (this.explodeFlash > 0) {
            const a = Math.min(1, this.explodeFlash);
            ctx.fillStyle = `rgba(255,255,240,${a})`;
            ctx.fillRect(0, 0, w, h);
            /* 2차 따뜻한 플래시 */
            if (this.explodeFlash < 1) {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.7);
                grad.addColorStop(0, `rgba(255,200,50,${a * 0.5})`);
                grad.addColorStop(1, 'rgba(255,100,0,0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }
            this.explodeFlash -= 0.02;
        }

        /* 버섯구름 */
        const mp = Math.min(this.mushroomProgress * 1.3, 1);
        if (mp > 0.03) {
            const capR = mp * Math.min(w, h) * 0.5;
            const capY = cy - mp * h * 0.28;
            const stemW = mp * 90;
            const stemH = cy + h * 0.15 - capY;

            /* 기둥 */
            const stemGrad = ctx.createLinearGradient(cx - stemW, 0, cx + stemW, 0);
            stemGrad.addColorStop(0, 'rgba(160,60,10,0)');
            stemGrad.addColorStop(0.2, `rgba(200,80,20,${0.5 * mp})`);
            stemGrad.addColorStop(0.5, `rgba(220,120,30,${0.6 * mp})`);
            stemGrad.addColorStop(0.8, `rgba(200,80,20,${0.5 * mp})`);
            stemGrad.addColorStop(1, 'rgba(160,60,10,0)');
            ctx.fillStyle = stemGrad;
            ctx.fillRect(cx - stemW, capY + capR * 0.2, stemW * 2, stemH);

            /* 구름 모자 */
            const capGrad = ctx.createRadialGradient(cx, capY, 0, cx, capY, capR);
            capGrad.addColorStop(0, `rgba(255,240,120,${0.9 * mp})`);
            capGrad.addColorStop(0.2, `rgba(255,180,30,${0.8 * mp})`);
            capGrad.addColorStop(0.45, `rgba(255,100,0,${0.6 * mp})`);
            capGrad.addColorStop(0.7, `rgba(200,40,0,${0.35 * mp})`);
            capGrad.addColorStop(1, 'rgba(100,15,0,0)');
            ctx.fillStyle = capGrad;
            ctx.beginPath(); ctx.arc(cx, capY, capR, 0, Math.PI * 2); ctx.fill();

            /* 밝은 중심부 */
            const coreR = capR * 0.3 * mp;
            const coreGrad = ctx.createRadialGradient(cx, capY, 0, cx, capY, coreR);
            coreGrad.addColorStop(0, `rgba(255,255,255,${0.7 * mp})`);
            coreGrad.addColorStop(1, 'rgba(255,220,100,0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath(); ctx.arc(cx, capY, coreR, 0, Math.PI * 2); ctx.fill();
        }

        /* 다중 충격파 */
        this.explodeRing += 0.018;
        for (let ring = 0; ring < 3; ring++) {
            const delay = ring * 0.2;
            const rp = this.explodeRing - delay;
            if (rp <= 0 || rp > 2) continue;
            const ringR = rp * Math.max(w, h) * 0.6;
            const ringA = Math.max(0, 1 - rp * 0.55);
            ctx.strokeStyle = `rgba(255,${180 - ring * 40},${60 - ring * 20},${ringA * 0.4})`;
            ctx.lineWidth = (3 - ring) + (1 - Math.min(1, rp)) * 14;
            ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();
        }

        /* 폭발 파티클 */
        let alive = 0;
        for (const p of this.explodeParts) {
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.05; p.vx *= 0.997;
            p.life--;
            if (p.life <= 0) continue;
            alive++;

            const t = p.life / p.max;
            ctx.globalAlpha = Math.min(1, t * 2.2);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.s * Math.max(0.15, t), 0, Math.PI * 2);
            ctx.fill();

            if (Math.abs(p.vx) + Math.abs(p.vy) > 5) {
                ctx.globalAlpha = t * 0.3;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.s * 0.5;
                ctx.beginPath(); ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); ctx.stroke();
            }
        }

        /* 지면 화재 */
        for (const gf of this.groundFire) {
            gf.x += gf.vx + (Math.random() - 0.5) * 0.5;
            gf.y += gf.vy; gf.life--; gf.s *= 0.994;
            if (gf.life <= 0) continue;
            alive++;
            const t = gf.life / gf.max;
            ctx.globalAlpha = t * 0.6;
            ctx.fillStyle = t > 0.5 ? '#ff6b00' : '#cc2200';
            ctx.beginPath(); ctx.arc(gf.x, gf.y, gf.s, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        /* 연기/어두운 오버레이 */
        if (this.mushroomProgress > 0.7) {
            const smokeA = Math.min(0.95, (this.mushroomProgress - 0.7) * 1.2);
            ctx.fillStyle = `rgba(8,5,15,${smokeA})`;
            ctx.fillRect(0, 0, w, h);
        }

        if (alive === 0 && this.mushroomProgress > 1.5) {
            this.finishDestroy();
        } else {
            this.animFrame = requestAnimationFrame(() => this.animateExplode());
        }
    }

    /* 
          🗑️ FLUSH — 내려보내기 (drain)
           */


    /* 
          📱 THROW — 핸드폰 던지기
           */

    startThrow() {
        this.showCanvas();
        this.canvas.classList.add('interactive');
        this.showHint('화면을 탭해서 던지세요! 🥫');
        const cans = ['🥫', '🍺', '🥤', '🧃', '🫙'];
        const randomCan = () => cans[(Math.random() * cans.length) | 0];
        this._onThrowClick = (e) => { e.preventDefault(); this.onThrowTap(e.clientX, e.clientY, randomCan()); };
        this._onThrowTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onThrowTap(t.clientX, t.clientY, randomCan()); };
        this.canvas.addEventListener('click', this._onThrowClick);
        this.canvas.addEventListener('touchstart', this._onThrowTouch);
    }

    /* 
          🍬 YEOT — 엿던지기
           */

    startYeot() {
        this.showCanvas();
        this.canvas.classList.add('interactive');
        this.showHint('이 엿 먹어라!! 🍬');
        this._onYeotClick = (e) => { e.preventDefault(); this.onYeotTap(e.clientX, e.clientY); };
        this._onYeotTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onYeotTap(t.clientX, t.clientY); };
        this.canvas.addEventListener('click', this._onYeotClick);
        this.canvas.addEventListener('touchstart', this._onYeotTouch);
    }

    onYeotTap(tx, ty) {
        this.hideHint();
        const yeots = ['🍬', '🍭', '🍫', '🍩'];
        const emoji = yeots[(Math.random() * yeots.length) | 0];

        const el = document.createElement('div');
        el.textContent = emoji;
        const sx = this.vw * (0.3 + Math.random() * 0.4);
        el.style.cssText = `position:fixed;left:${sx}px;bottom:-40px;font-size:2.5rem;z-index:102;pointer-events:none;transition:all 0.3s cubic-bezier(0.25,0,0.5,1);`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.left = `${tx - 16}px`;
            el.style.bottom = `${this.vh - ty - 16}px`;
            el.style.transform = `rotate(${200 + Math.random() * 400}deg) scale(0.7)`;
        });

        setTimeout(() => {
            el.remove();
            this.drawYeotSplat(tx, ty);
            navigator.vibrate?.(30);
        }, 300);
    }

    drawYeotSplat(cx, cy) {
        const ctx = this.ctx;
        /* 끈적한 엿 자국 */
        ctx.fillStyle = 'rgba(160,100,30,0.55)';
        ctx.beginPath(); ctx.arc(cx, cy, 14 + Math.random() * 8, 0, Math.PI * 2); ctx.fill();

        /* 광택 */
        ctx.fillStyle = 'rgba(200,150,60,0.3)';
        ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 5 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();

        /* 늘어지는 엿 — 끈적끈적 줄 */
        for (let i = 0; i < 3; i++) {
            const angle = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
            const len = 20 + Math.random() * 35;
            ctx.strokeStyle = `rgba(150,90,25,${0.3 + Math.random() * 0.2})`;
            ctx.lineWidth = 2 + Math.random() * 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const sx = cx + (Math.random() - 0.5) * 12;
            ctx.moveTo(sx, cy + 8);
            ctx.quadraticCurveTo(
                sx + (Math.random() - 0.5) * 15, cy + len * 0.6,
                sx + (Math.random() - 0.5) * 8, cy + len
            );
            ctx.stroke();
        }

        /* "이 엿 먹어라" 텍스트 */
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,200,80,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('이 엿 먹어라!', cx, cy - 22);
        ctx.textAlign = 'left';
    }

    _cleanupYeot() {
        if (this._onYeotClick) {
            this.canvas.removeEventListener('click', this._onYeotClick);
            this.canvas.removeEventListener('touchstart', this._onYeotTouch);
            this._onYeotClick = null; this._onYeotTouch = null;
        }
    }

    /* 
          🥚 EGG — 계란 던지기
           */

    startEgg() {
        this.showCanvas();
        this.canvas.classList.add('interactive');
        this.showHint('화면을 탭해서 던지세요! 🥚');
        this._onEggClick = (e) => { e.preventDefault(); this.onThrowTap(e.clientX, e.clientY, '🥚'); };
        this._onEggTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onThrowTap(t.clientX, t.clientY, '🥚'); };
        this.canvas.addEventListener('click', this._onEggClick);
        this.canvas.addEventListener('touchstart', this._onEggTouch);
    }

    onThrowTap(tx, ty, emoji) {
        this.hideHint();
        const el = document.createElement('div');
        el.textContent = emoji;
        const startX = this.vw * (0.3 + Math.random() * 0.4);
        el.style.cssText = `position:fixed;left:${startX}px;bottom:-50px;font-size:2.8rem;z-index:102;pointer-events:none;transition:all 0.35s cubic-bezier(0.25,0,0.5,1);`;
        document.body.appendChild(el);

        requestAnimationFrame(() => {
            el.style.left = `${tx - 20}px`;
            el.style.bottom = `${this.vh - ty - 20}px`;
            el.style.transform = `rotate(${360 + Math.random() * 360}deg) scale(0.7)`;
        });

        setTimeout(() => {
            el.remove();
            navigator.vibrate?.(40);
            if (emoji === '🥚') {
                this.drawEggSplat(tx, ty);
            } else {
                /* 깡통 충돌: 찌그러짐 */
                this.drawCanDent(tx, ty);
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 250);
            }
        }, 350);
    }

    drawEggSplat(cx, cy) {
        const ctx = this.ctx;
        /* 흰자 퍼짐 */
        ctx.fillStyle = 'rgba(245,240,225,0.45)';
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = 10 + Math.random() * 25;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6 + Math.random() * 12, 4 + Math.random() * 8, a, 0, Math.PI * 2);
            ctx.fill();
        }
        /* 노른자 중심 */
        ctx.fillStyle = 'rgba(255,200,40,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, 12 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
        /* 노른자 광택 */
        ctx.fillStyle = 'rgba(255,230,80,0.5)';
        ctx.beginPath();
        ctx.arc(cx - 3, cy - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        /* 흘러내림 */
        for (let i = 0; i < 3; i++) {
            const dx = cx + (Math.random() - 0.5) * 20;
            const div = document.createElement('div');
            div.className = 'egg-drip';
            div.style.cssText = `left:${dx}px;top:${cy + 10}px;width:${4 + Math.random() * 6}px;height:${6 + Math.random() * 10}px;background:rgba(255,200,40,0.5);`;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 1500);
        }
    }

    drawCanDent(cx, cy) {
        const ctx = this.ctx;
        /* 찌그러진 캔 잔해 */
        const cans = ['🥫', '🍺', '🥤', '🧃', '🫙'];
        const trash = ['🗑️', '📦', '🧻'];
        const items = [...cans, ...trash];
        const emoji = items[(Math.random() * items.length) | 0];
        const size = 18 + Math.random() * 14;
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((Math.random() - 0.5) * 0.8);
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.fillText(emoji, 0, 0);
        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 1;
    }

    finishThrow() {
        this.canvas.removeEventListener('click', this._onThrowClick);
        this.canvas.removeEventListener('touchstart', this._onThrowTouch);
        this.canvas.removeEventListener('click', this._onEggClick);
        this.canvas.removeEventListener('touchstart', this._onEggTouch);
        this.finishDestroy();
    }

    /* 
          🔫 GUN — 총쏘기 (5연발 버스트)
           */

    startGun() {
        this.showCanvas();
        this.canvas.classList.add('interactive', 'gun-cursor');
        this.showHint('화면을 탭! 타타타타타 🔫');
        this._onGunClick = (e) => { e.preventDefault(); this.onGunTap(e.clientX, e.clientY); };
        this._onGunTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onGunTap(t.clientX, t.clientY); };
        this.canvas.addEventListener('click', this._onGunClick);
        this.canvas.addEventListener('touchstart', this._onGunTouch);
    }

    onGunTap(cx, cy) {
        this.hideHint();
        const spread = 40;
        for (let i = 0; i < 5; i++) {
            const bx = cx + (Math.random() - 0.5) * spread;
            const by = cy + (Math.random() - 0.5) * spread;
            setTimeout(() => {
                this.drawBulletHole(bx, by);
                this.showMuzzleFlash(bx, by);
                navigator.vibrate?.(15);
            }, i * 70);
        }
        /* Screen micro-shake */
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 300);
    }

    drawBulletHole(cx, cy) {
        const ctx = this.ctx;
        const r = 3 + Math.random() * 3;

        /* 검은 구멍 중심 */
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

        /* 그을림 링 */
        ctx.strokeStyle = 'rgba(60,50,40,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();

        /* 바깥 크랙 링 */
        ctx.strokeStyle = 'rgba(180,180,180,0.2)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(cx, cy, r + 5 + Math.random() * 3, 0, Math.PI * 2); ctx.stroke();

        /* 총알구멍 크랙 */
        const cracks = 3 + (Math.random() * 3) | 0;
        for (let i = 0; i < cracks; i++) {
            const a = (Math.PI * 2 / cracks) * i + (Math.random() - 0.5) * 0.6;
            const len = 8 + Math.random() * 18;
            ctx.strokeStyle = `rgba(200,200,210,${0.2 + Math.random() * 0.2})`;
            ctx.lineWidth = 0.5 + Math.random() * 0.8;
            ctx.beginPath();
            let px = cx + Math.cos(a) * (r + 2);
            let py = cy + Math.sin(a) * (r + 2);
            ctx.moveTo(px, py);
            let ang = a;
            for (let s = 0; s < 3; s++) {
                ang += (Math.random() - 0.5) * 0.6;
                px += Math.cos(ang) * (len / 3);
                py += Math.sin(ang) * (len / 3);
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }

    showMuzzleFlash(x, y) {
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;left:${x - 15}px;top:${y - 15}px;width:30px;height:30px;
            background:radial-gradient(circle,rgba(255,240,150,0.9),rgba(255,150,50,0.4),transparent 70%);
            border-radius:50%;z-index:102;pointer-events:none;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 80);
    }

    /* 
          💦 WATER — 물풍선
           */

    startWater() {
        this.showCanvas();
        this.canvas.classList.add('interactive', 'water-cursor');
        this.showHint('화면을 탭! 물풍선이 터집니다 💦');
        this._onWaterClick = (e) => { e.preventDefault(); this.onWaterTap(e.clientX, e.clientY); };
        this._onWaterTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onWaterTap(t.clientX, t.clientY); };
        this.canvas.addEventListener('click', this._onWaterClick);
        this.canvas.addEventListener('touchstart', this._onWaterTouch);
    }

    onWaterTap(tx, ty) {
        this.hideHint();

        /* 풍선 날아오기 */
        const el = document.createElement('div');
        el.textContent = '🎈';
        const sx = this.vw * (0.2 + Math.random() * 0.6);
        el.style.cssText = `position:fixed;left:${sx}px;bottom:-40px;font-size:2.5rem;z-index:102;pointer-events:none;transition:all 0.3s cubic-bezier(0.25,0,0.5,1);`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.left = `${tx - 16}px`;
            el.style.bottom = `${this.vh - ty - 16}px`;
            el.style.transform = 'scale(0.6)';
        });

        setTimeout(() => {
            el.remove();
            this.drawWaterSplash(tx, ty);
            navigator.vibrate?.(25);
        }, 300);
    }

    drawWaterSplash(cx, cy) {
        const ctx = this.ctx;

        /* 중심 물보라 */
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
        grad.addColorStop(0, 'rgba(100,180,255,0.35)');
        grad.addColorStop(0.6, 'rgba(80,160,255,0.15)');
        grad.addColorStop(1, 'rgba(60,140,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.fill();

        /* 물방울 튀기 */
        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = 15 + Math.random() * 35;
            const r = 2 + Math.random() * 5;
            ctx.fillStyle = `rgba(100,180,255,${0.25 + Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.6, r, a + Math.PI / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        /* 물 흘러내림 DOM 요소 */
        for (let i = 0; i < 4; i++) {
            const dx = cx + (Math.random() - 0.5) * 40;
            const div = document.createElement('div');
            div.className = 'egg-drip';
            div.style.cssText = `left:${dx}px;top:${cy + 8}px;width:${3 + Math.random() * 4}px;height:${5 + Math.random() * 8}px;background:rgba(100,180,255,0.35);`;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 1500);
        }
    }

    _cleanupWater() {
        if (this._onWaterClick) {
            this.canvas.removeEventListener('click', this._onWaterClick);
            this.canvas.removeEventListener('touchstart', this._onWaterTouch);
            this._onWaterClick = null; this._onWaterTouch = null;
        }
    }

    /* 
          🎨 PAINT — 낙서
           */

    startPaint() {
        this.showCanvas();
        this.canvas.classList.add('interactive', 'paint-cursor');
        this.showHint('드래그해서 낙서하세요! 🎨');
        this._painting = false;
        this._paintLast = null;
        this._paintColor = '#ff4757';
        const colors = ['#ff4757', '#ff6b81', '#ffa502', '#2ed573', '#1e90ff', '#a55eea', '#fff'];

        this._onPaintDown = (e) => {
            e.preventDefault();
            this.hideHint();
            this._painting = true;
            const p = this._getPos(e);
            this._paintLast = p;
            this._paintDot(p.x, p.y);
        };
        this._onPaintMove = (e) => {
            if (!this._painting) return;
            e.preventDefault();
            const p = this._getPos(e);
            this._paintLine(this._paintLast.x, this._paintLast.y, p.x, p.y);
            this._paintLast = p;
        };
        this._onPaintUp = () => {
            this._painting = false;
            this._paintLast = null;
            /* 한 획 끝나면 다음 색 */
            this._paintColor = colors[(Math.random() * colors.length) | 0];
        };

        this.canvas.addEventListener('mousedown', this._onPaintDown);
        this.canvas.addEventListener('mousemove', this._onPaintMove);
        this.canvas.addEventListener('mouseup', this._onPaintUp);
        this.canvas.addEventListener('mouseleave', this._onPaintUp);
        this.canvas.addEventListener('touchstart', this._onPaintDown, { passive: false });
        this.canvas.addEventListener('touchmove', this._onPaintMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onPaintUp);
    }

    _getPos(e) {
        if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    }

    _paintDot(x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = this._paintColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    _paintLine(x1, y1, x2, y2) {
        const ctx = this.ctx;
        ctx.strokeStyle = this._paintColor;
        ctx.lineWidth = 4 + Math.random() * 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        /* 빠르게 그으면 페인트 튐 */
        const speed = Math.hypot(x2 - x1, y2 - y1);
        if (speed > 15 && Math.random() > 0.5) {
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const sx = x2 + (Math.random() - 0.5) * speed * 0.8;
                const sy = y2 + (Math.random() - 0.5) * speed * 0.8;
                ctx.beginPath();
                ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    _cleanupPaint() {
        if (this._onPaintDown) {
            this.canvas.removeEventListener('mousedown', this._onPaintDown);
            this.canvas.removeEventListener('mousemove', this._onPaintMove);
            this.canvas.removeEventListener('mouseup', this._onPaintUp);
            this.canvas.removeEventListener('mouseleave', this._onPaintUp);
            this.canvas.removeEventListener('touchstart', this._onPaintDown);
            this.canvas.removeEventListener('touchmove', this._onPaintMove);
            this.canvas.removeEventListener('touchend', this._onPaintUp);
            this._onPaintDown = null; this._onPaintMove = null; this._onPaintUp = null;
        }
    }

    /* 
          ⚡ LIGHTNING — 벼락
           */

    startLightning() {
        this.showCanvas();
        this.canvas.classList.add('interactive', 'lightning-cursor');
        this.showHint('화면을 탭! 벼락이 내리칩니다 ⚡');
        this._onLightClick = (e) => { e.preventDefault(); this.onLightningTap(e.clientX, e.clientY); };
        this._onLightTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onLightningTap(t.clientX, t.clientY); };
        this.canvas.addEventListener('click', this._onLightClick);
        this.canvas.addEventListener('touchstart', this._onLightTouch);
    }

    onLightningTap(tx, ty) {
        this.hideHint();
        this.drawLightningBolt(tx, ty);
        this.drawLightningFlash(tx, ty);
        navigator.vibrate?.([20, 10, 40]);
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 200);
    }

    drawLightningBolt(tx, ty) {
        const ctx = this.ctx;
        /* 번개 본체 */
        const startX = tx + (Math.random() - 0.5) * 80;
        const startY = 0;
        const segs = 10 + (Math.random() * 8) | 0;
        const dx = (tx - startX) / segs;
        const dy = (ty - startY) / segs;

        /* 발광 레이어 */
        for (let pass = 0; pass < 2; pass++) {
            const isGlow = pass === 0;
            ctx.strokeStyle = isGlow ? 'rgba(150,180,255,0.3)' : 'rgba(220,240,255,0.9)';
            ctx.lineWidth = isGlow ? 8 : 2 + Math.random();
            ctx.lineCap = 'round';
            ctx.beginPath();

            let x = startX, y = startY;
            ctx.moveTo(x, y);
            for (let i = 0; i < segs; i++) {
                x += dx + (Math.random() - 0.5) * 40;
                y += dy;
                ctx.lineTo(x, y);

                /* 가지 */
                if (!isGlow && Math.random() > 0.55 && i > 1) {
                    ctx.stroke();
                    const bLen = 3 + (Math.random() * 4) | 0;
                    const bAngle = (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.8);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(180,210,255,${0.4 + Math.random() * 0.3})`;
                    ctx.lineWidth = 1 + Math.random();
                    let bx = x, by = y;
                    ctx.moveTo(bx, by);
                    for (let j = 0; j < bLen; j++) {
                        bx += Math.cos(Math.PI * 0.5 + bAngle) * (8 + Math.random() * 12);
                        by += 8 + Math.random() * 12;
                        ctx.lineTo(bx, by);
                    }
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.strokeStyle = 'rgba(220,240,255,0.9)';
                    ctx.lineWidth = 2 + Math.random();
                }
            }
            ctx.lineTo(tx, ty);
            ctx.stroke();
        }

        /* 충돌점 발광 */
        const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 40);
        grad.addColorStop(0, 'rgba(200,220,255,0.6)');
        grad.addColorStop(0.5, 'rgba(150,180,255,0.2)');
        grad.addColorStop(1, 'rgba(100,150,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(tx, ty, 40, 0, Math.PI * 2); ctx.fill();

        /* 그을림 자국 */
        ctx.fillStyle = 'rgba(30,20,10,0.5)';
        ctx.beginPath(); ctx.arc(tx, ty, 6 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
    }

    drawLightningFlash(tx, ty) {
        /* 짧은 번개 플래시 */
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;inset:0;background:rgba(200,220,255,0.25);z-index:99;pointer-events:none;transition:opacity 0.15s;`;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 150); }, 50);
    }

    _cleanupLightning() {
        if (this._onLightClick) {
            this.canvas.removeEventListener('click', this._onLightClick);
            this.canvas.removeEventListener('touchstart', this._onLightTouch);
            this._onLightClick = null; this._onLightTouch = null;
        }
    }

    /* 
          🪓 AXE — 도끼로 나무 깨기
           */

    startAxe() {
        this.showCanvas();
        this.canvas.classList.add('interactive', 'axe-cursor');
        this.showHint('화면을 내려쳐서 쪼개세요! 🪓');
        this._onAxeClick = (e) => { e.preventDefault(); this.onAxeTap(e.clientX, e.clientY); };
        this._onAxeTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onAxeTap(t.clientX, t.clientY); };
        this.canvas.addEventListener('click', this._onAxeClick);
        this.canvas.addEventListener('touchstart', this._onAxeTouch);
    }

    onAxeTap(tx, ty) {
        this.hideHint();

        /* 도끼 내려치기 애니메이션 */
        const el = document.createElement('div');
        el.textContent = '🪓';
        el.style.cssText = `position:fixed;left:${tx - 24}px;top:${ty - 60}px;font-size:3rem;z-index:102;pointer-events:none;transform:rotate(-80deg) translateY(-30px);transition:transform 0.13s cubic-bezier(0.2,0,0.9,1);`;
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.transform = 'rotate(15deg) translateY(0)'; });
        setTimeout(() => {
            el.style.transition = 'transform 0.15s ease-out, opacity 0.2s';
            el.style.transform = 'rotate(-40deg) translateY(-15px)';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
        }, 130);

        /* 충격 후 나무 갈라짐 + 파편 */
        setTimeout(() => {
            this.drawWoodSplit(tx, ty);
            navigator.vibrate?.([30, 10, 50]);
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 250);
        }, 120);
    }

    drawWoodSplit(cx, cy) {
        const ctx = this.ctx;

        /* 세로 갈라짐 — 도끼로 내려친 듯한 수직 크랙 */
        const splitLen = 40 + Math.random() * 80;
        ctx.strokeStyle = 'rgba(90,60,30,0.7)';
        ctx.lineWidth = 2.5 + Math.random() * 2;
        ctx.beginPath();
        let y = cy - splitLen / 2;
        ctx.moveTo(cx, y);
        for (let i = 0; i < 8; i++) {
            y += splitLen / 8;
            ctx.lineTo(cx + (Math.random() - 0.5) * 8, y);
        }
        ctx.stroke();

        /* 갈라진 틈 내부 — 밝은 나무색 */
        ctx.strokeStyle = 'rgba(180,140,80,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        y = cy - splitLen / 2 + 5;
        ctx.moveTo(cx + 1, y);
        for (let i = 0; i < 6; i++) {
            y += splitLen / 6;
            ctx.lineTo(cx + 1 + (Math.random() - 0.5) * 4, y);
        }
        ctx.stroke();

        /* 충격점 */
        ctx.fillStyle = 'rgba(60,40,15,0.6)';
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

        /* 가로 크랙 (작게) */
        for (let i = 0; i < 2; i++) {
            const angle = (Math.random() > 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
            const len = 12 + Math.random() * 25;
            ctx.strokeStyle = `rgba(100,70,35,${0.3 + Math.random() * 0.2})`;
            ctx.lineWidth = 1 + Math.random();
            ctx.beginPath();
            ctx.moveTo(cx, cy + (Math.random() - 0.5) * 15);
            ctx.lineTo(cx + Math.cos(angle) * len, cy + (Math.random() - 0.5) * 15 + Math.sin(angle) * len);
            ctx.stroke();
        }

        /* 나무 파편 튀기 */
        const chips = ['🪵', '🌳', '🍂'];
        for (let i = 0; i < 3; i++) {
            const chip = document.createElement('div');
            chip.textContent = chips[i % chips.length];
            const dx = (Math.random() - 0.5) * 80;
            const dy = -(20 + Math.random() * 60);
            chip.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-size:${1 + Math.random() * 0.8}rem;z-index:102;pointer-events:none;transition:all 0.5s cubic-bezier(0.2,0,0.5,1);opacity:1;`;
            document.body.appendChild(chip);
            requestAnimationFrame(() => {
                chip.style.left = `${cx + dx}px`;
                chip.style.top = `${cy + dy}px`;
                chip.style.transform = `rotate(${(Math.random() - 0.5) * 360}deg) scale(0.4)`;
                chip.style.opacity = '0';
            });
            setTimeout(() => chip.remove(), 600);
        }
    }

    /* 
          🧨 DYNAMITE — 다이나마이트 던지면 펑
           */

    startDynamite() {
        this.showCanvas();
        this.canvas.classList.add('interactive');
        this.showHint('화면을 탭! 다이나마이트 투척 💥');
        this._onDynaClick = (e) => { e.preventDefault(); this.onDynamiteTap(e.clientX, e.clientY); };
        this._onDynaTouch = (e) => { e.preventDefault(); const t = e.touches[0]; if (t) this.onDynamiteTap(t.clientX, t.clientY); };
        this.canvas.addEventListener('click', this._onDynaClick);
        this.canvas.addEventListener('touchstart', this._onDynaTouch);
    }

    onDynamiteTap(tx, ty) {
        this.hideHint();

        /* 다이나마이트 날아가기 */
        const el = document.createElement('div');
        el.textContent = '🧨';
        const sx = this.vw * (0.3 + Math.random() * 0.4);
        el.style.cssText = `position:fixed;left:${sx}px;bottom:-40px;font-size:2.5rem;z-index:102;pointer-events:none;transition:all 0.35s cubic-bezier(0.25,0,0.6,1);`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.left = `${tx - 16}px`;
            el.style.bottom = `${this.vh - ty - 16}px`;
            el.style.transform = `rotate(${300 + Math.random() * 400}deg)`;
        });

        /* 착지 후 잠깐 대기 → 펑 */
        setTimeout(() => {
            el.textContent = '💥';
            el.style.transition = 'transform 0.1s';
            el.style.transform += ' scale(1.5)';

            setTimeout(() => {
                el.remove();
                this.drawDynamiteBlast(tx, ty);
                navigator.vibrate?.([40, 20, 80]);
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 400);
            }, 150);
        }, 400);
    }

    drawDynamiteBlast(cx, cy) {
        const ctx = this.ctx;

        /* 폭발 섬광 */
        const flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        flash.addColorStop(0, 'rgba(255,240,150,0.6)');
        flash.addColorStop(0.4, 'rgba(255,150,50,0.3)');
        flash.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = flash;
        ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();

        /* 그을림 자국 */
        const soot = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
        soot.addColorStop(0, 'rgba(20,15,5,0.7)');
        soot.addColorStop(0.6, 'rgba(40,30,10,0.3)');
        soot.addColorStop(1, 'rgba(60,40,15,0)');
        ctx.fillStyle = soot;
        ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();

        /* 방사형 크랙 */
        const cracks = 5 + (Math.random() * 4) | 0;
        for (let i = 0; i < cracks; i++) {
            let angle = (Math.PI * 2 / cracks) * i + (Math.random() - 0.5) * 0.5;
            const len = 30 + Math.random() * 50;
            ctx.strokeStyle = `rgba(80,60,30,${0.3 + Math.random() * 0.25})`;
            ctx.lineWidth = 1 + Math.random() * 1.5;
            ctx.beginPath();
            let px = cx, py = cy;
            ctx.moveTo(px, py);
            for (let s = 0; s < 5; s++) {
                angle += (Math.random() - 0.5) * 0.6;
                px += Math.cos(angle) * (len / 5);
                py += Math.sin(angle) * (len / 5);
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        /* 파편 튀기 */
        const debris = ['💥', '🔥', '💨', '✨'];
        for (let i = 0; i < 6; i++) {
            const d = document.createElement('div');
            d.textContent = debris[i % debris.length];
            d.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-size:${1.2 + Math.random()}rem;z-index:102;pointer-events:none;transition:all 0.5s cubic-bezier(0.15,0,0.4,1);opacity:1;`;
            document.body.appendChild(d);
            const dx = (Math.random() - 0.5) * 140;
            const dy = -(30 + Math.random() * 100);
            requestAnimationFrame(() => {
                d.style.left = `${cx + dx}px`;
                d.style.top = `${cy + dy}px`;
                d.style.transform = `rotate(${(Math.random() - 0.5) * 400}deg) scale(0.3)`;
                d.style.opacity = '0';
            });
            setTimeout(() => d.remove(), 600);
        }
    }

    _cleanupDynamite() {
        if (this._onDynaClick) {
            this.canvas.removeEventListener('click', this._onDynaClick);
            this.canvas.removeEventListener('touchstart', this._onDynaTouch);
            this._onDynaClick = null; this._onDynaTouch = null;
        }
    }

    _cleanupAxe() {
        if (this._onAxeClick) {
            this.canvas.removeEventListener('click', this._onAxeClick);
            this.canvas.removeEventListener('touchstart', this._onAxeTouch);
            this._onAxeClick = null; this._onAxeTouch = null;
        }
    }

    /*  Custom Modal  */

    showModal(title, message, confirmText, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal"><h2>${title}</h2><p>${message}</p><div class="modal-actions"><button class="modal-cancel">취소</button><button class="modal-confirm">${confirmText}</button></div></div>`;
        overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.modal-confirm').addEventListener('click', () => { onConfirm(); overlay.remove(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    }

    /*  Reset with burn effect  */

    resetWithBurn() {
        const rows = [...this.chatArea.querySelectorAll('.msg-row')];
        if (!rows.length) return;

        /* 맨 위로 스크롤 후 시작 */
        this.chatArea.scrollTop = 0;

        /* 스크롤 완료 후 시작 (레이아웃 반영 대기) */
        requestAnimationFrame(() => {
            this.clearCanvas();
            this.resizeCanvas();
            this.canvas.classList.add('active');
            this._msgBurnParts = [];
            this._msgBurnQueue = rows;
            this._msgBurnIdx = 0;
            this._msgBurnFrame = 0;

            this.animFrame = requestAnimationFrame(() => this._animMsgBurn());
        });
    }

    _animMsgBurn() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.vw, this.vh);
        this._msgBurnFrame++;

        /* Ignite next message every 30 frames */
        if (this._msgBurnFrame % MSG_BURN_IGNITE_INTERVAL === 1 && this._msgBurnIdx < this._msgBurnQueue.length) {
            this._msgBurnQueue[this._msgBurnIdx]._ignite = this._msgBurnFrame;
            this._msgBurnIdx++;
        }

        let allGone = true;

        for (const el of this._msgBurnQueue) {
            if (!el._ignite) { allGone = false; continue; }
            if (!el.parentNode) continue;

            const age = this._msgBurnFrame - el._ignite;
            const bubble = el.querySelector('.msg-bubble');
            const rect = bubble ? bubble.getBoundingClientRect() : el.getBoundingClientRect();

            if (age < 50) {
                allGone = false;
                const t = age / 50;
                const b = bubble || el;

                /* CSS 효과는 bubble에만 — 번쩍임 없이 바로 타들어감 */
                b.style.transition = 'none';
                if (t < 0.5) {
                    const p = t / 0.5;
                    b.style.filter = `sepia(${p}) saturate(${1 + p})`;
                    b.style.boxShadow = `0 0 ${p * 12}px rgba(255,60,0,${p * 0.4})`;
                } else {
                    const p = (t - 0.5) / 0.5;
                    b.style.filter = `brightness(${1 - p * 0.9}) sepia(1)`;
                    b.style.transform = `scale(${1 - p * 0.4}) rotate(${p * 2}deg)`;
                    b.style.opacity = `${1 - p}`;
                    b.style.boxShadow = 'none';
                }
                const timeEl = el.querySelector('.msg-time');
                if (timeEl) timeEl.style.opacity = `${1 - t}`;

                /* Spawn fire particles on this message */
                if (t > 0.05 && t < 0.8) {
                    for (let i = 0; i < 5; i++) {
                        this._msgBurnParts.push({
                            x: rect.left + Math.random() * rect.width,
                            y: rect.top + Math.random() * rect.height * 0.6,
                            s: 3 + Math.random() * 9,
                            vx: (Math.random() - 0.5) * 1.5,
                            vy: -(1 + Math.random() * 3.5),
                            life: 25 + (Math.random() * 20) | 0,
                            max: 45,
                        });
                    }
                    /* Embers */
                    if (Math.random() > 0.5) {
                        this._msgBurnParts.push({
                            x: rect.left + Math.random() * rect.width,
                            y: rect.top,
                            s: 0.7 + Math.random() * 1.5,
                            vx: (Math.random() - 0.5) * 3.5,
                            vy: -(4 + Math.random() * 5),
                            life: 50 + (Math.random() * 30) | 0,
                            max: 80,
                            ember: true,
                        });
                    }
                }
            } else {
                el.remove();
            }
        }

        /* Draw fire particles (additive) */
        ctx.globalCompositeOperation = 'lighter';
        for (let i = this._msgBurnParts.length - 1; i >= 0; i--) {
            const p = this._msgBurnParts[i];
            p.x += p.vx; p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.2;
            p.life--; p.s *= (p.ember ? 0.993 : 0.978);
            if (p.life <= 0 || p.s < 0.1) { this._msgBurnParts.splice(i, 1); continue; }
            const t = p.life / p.max;

            if (p.ember) {
                ctx.globalAlpha = Math.min(1, t * 2.5);
                ctx.fillStyle = t > 0.5 ? '#ffcc44' : '#ff6622';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
                continue;
            }

            let r = 255, g, b;
            if (t > 0.6) { g = 160 + (t - 0.6) * 250; b = (t - 0.6) * 100; }
            else if (t > 0.3) { g = 40 + (t - 0.3) * 400; b = 0; }
            else { r = 130 + (t / 0.3) * 125; g = 0; b = 0; }

            ctx.globalAlpha = Math.min(0.6, t * 1.3);
            ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.s * 0.45, p.s * 1.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        /* Done? */
        const rowsDone = this._msgBurnQueue.every(el => !el.parentNode);
        if (rowsDone && this._msgBurnParts.length === 0) {
            cancelAnimationFrame(this.animFrame);
            this.hideCanvas();
            this.messages = [];
            this.save();
            this.updateUI();
            this.showToast('모두 태워버렸어요 🔥');
            return;
        }

        this.animFrame = requestAnimationFrame(() => this._animMsgBurn());
    }

    /*  Share  */

    async share() {
        if (!this.messages.length) { this.showToast('공유할 메시지가 없어요'); return; }

        /* 현재 화면에 보이는 메시지만 수집 */
        const chatRect = this.chatArea.getBoundingClientRect();
        const visibleMsgs = [];
        for (const msg of this.messages) {
            const row = this.chatArea.querySelector(`[data-id="${msg.id}"]`);
            if (!row) continue;
            const r = row.getBoundingClientRect();
            /* 채팅 영역과 겹치면 보이는 것 */
            if (r.bottom > chatRect.top && r.top < chatRect.bottom) {
                visibleMsgs.push(msg);
            }
        }

        if (!visibleMsgs.length) { this.showToast('화면에 보이는 메시지가 없어요'); return; }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const W = SHARE_CANVAS_WIDTH, PAD = 24, LH = 22, BP = 14, GAP = 16;

        ctx.font = '15px -apple-system, "Apple SD Gothic Neo", sans-serif';
        let totalH = 80;
        for (const msg of visibleMsgs) {
            totalH += this.wrapText(ctx, msg.text, W - PAD * 2 - BP * 2).length * LH + BP * 2 + 20 + GAP;
        }
        totalH += 50;

        canvas.width = W * dpr; canvas.height = totalH * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, totalH);
        ctx.fillStyle = '#ff4757'; ctx.font = 'bold 20px -apple-system, "Apple SD Gothic Neo", sans-serif';
        ctx.fillText('🤬 Mad Box', PAD, 36);
        ctx.fillStyle = 'rgba(232,224,240,0.4)'; ctx.font = '12px -apple-system, "Apple SD Gothic Neo", sans-serif';
        ctx.fillText('🔒 이건 나만 보는 거예요', PAD, 56);

        let y = 80;
        ctx.font = '15px -apple-system, "Apple SD Gothic Neo", sans-serif'; ctx.textAlign = 'left';
        for (const msg of visibleMsgs) {
            const lines = this.wrapText(ctx, msg.text, W - PAD * 2 - BP * 2);
            const bh = lines.length * LH + BP * 2;
            const bw = Math.min(W - PAD * 2, Math.max(...lines.map(l => ctx.measureText(l).width)) + BP * 2);
            const bx = W - PAD - bw;

            ctx.fillStyle = '#2d1b4e'; ctx.beginPath(); this.roundRect(ctx, bx, y, bw, bh, 14); ctx.fill();
            ctx.fillStyle = '#e8e0f0';
            lines.forEach((l, i) => ctx.fillText(l, bx + BP, y + BP + 14 + i * LH));

            ctx.fillStyle = 'rgba(232,224,240,0.4)'; ctx.font = '11px -apple-system, "Apple SD Gothic Neo", sans-serif';
            ctx.textAlign = 'right'; ctx.fillText(this.formatTime(msg.time), W - PAD, y + bh + 16);
            ctx.textAlign = 'left'; ctx.font = '15px -apple-system, "Apple SD Gothic Neo", sans-serif';
            y += bh + 20 + GAP;
        }

        ctx.fillStyle = 'rgba(255,71,87,0.6)'; ctx.font = '11px -apple-system, "Apple SD Gothic Neo", sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('⚠️ 공유하면 그대로 보입니다', W / 2, totalH - 20);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], 'mad-box.png', { type: 'image/png' });
            try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch {}
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mad-box.png'; a.click();
            URL.revokeObjectURL(a.href); this.showToast('이미지 저장 완료');
        }, 'image/png');
    }

    wrapText(ctx, text, maxW) {
        const lines = []; let line = '';
        for (const ch of text) {
            const test = line + ch;
            if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = ch; }
            else { line = test; }
        }
        if (line) lines.push(line);
        return lines.length ? lines : [''];
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }

    /*  Toast  */

    showToast(text) {
        let t = document.querySelector('.toast');
        if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
        t.textContent = text; t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2000);
    }

    /*  Events  */

    bindEvents() {
        const send = () => {
            const text = this.input.value.trim();
            if (!text) return;
            this.addMessage(text);
            this.input.value = '';
            this.input.focus();
        };

        document.getElementById('sendBtn').addEventListener('click', send);
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); }
        });

        this.toolbar.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => this.startDestroy(btn.dataset.mode));
        });

        document.getElementById('shareBtn').addEventListener('click', () => this.share());
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.showModal('초기화', '모든 메시지와 화면 효과를 지울까요?', '태워버리기 🔥', () => {
                this.clearCanvas();
                this.resetWithBurn();
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new MadBox());
