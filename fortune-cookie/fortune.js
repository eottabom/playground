function createSeededRandom(seed) {
    let value = seed >>> 0;
    return () => {
        value = (value * 1664525 + 1013904223) >>> 0;
        return value / 4294967296;
    };
}
function resizeCanvas(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.clientWidth || Number(canvas.getAttribute("width")) || 320;
    const cssHeight = canvas.clientHeight || Number(canvas.getAttribute("height")) || 400;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
}
function formatFortuneText(text) {
    var _a, _b;
    const sentences = (_b = (_a = text.match(/[^.!?]+[.!?]?/g)) === null || _a === void 0 ? void 0 : _a.map((part) => part.trim()).filter(Boolean)) !== null && _b !== void 0 ? _b : [text];
    if (sentences.length <= 1) {
        return text;
    }
    return [sentences[0], sentences.slice(1).join(" ")].join("\n");
}
function drawClosedCookie(canvas) {
    resizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const random = createSeededRandom(7);
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.58;
    const topY = h * 0.16;
    const bottomY = h * 0.84;
    const wingOuter = w * 0.19;
    const wingInner = w * 0.09;
    const path = new Path2D();
    path.moveTo(cx, topY);
    path.bezierCurveTo(cx - wingInner, h * 0.2, cx - wingOuter, h * 0.29, cx - wingOuter, h * 0.42);
    path.bezierCurveTo(cx - wingOuter, h * 0.58, cx - wingInner * 1.25, h * 0.76, cx, bottomY);
    path.bezierCurveTo(cx + wingInner * 1.25, h * 0.76, cx + wingOuter, h * 0.58, cx + wingOuter, h * 0.42);
    path.bezierCurveTo(cx + wingOuter, h * 0.29, cx + wingInner, h * 0.2, cx, topY);
    path.closePath();
    const shadow = ctx.createRadialGradient(cx, h * 0.87, 0, cx, h * 0.87, w * 0.22);
    shadow.addColorStop(0, "rgba(0,0,0,0.22)");
    shadow.addColorStop(0.5, "rgba(0,0,0,0.08)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.87, w * 0.17, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    const body = ctx.createRadialGradient(w * 0.38, h * 0.28, w * 0.04, cx, cy, w * 0.44);
    body.addColorStop(0, "#fce9b6");
    body.addColorStop(0.20, "#f5d57c");
    body.addColorStop(0.45, "#e8b44d");
    body.addColorStop(0.70, "#d49332");
    body.addColorStop(1, "#b07025");
    ctx.fillStyle = body;
    ctx.fill(path);
    ctx.clip(path);
    // Ambient occlusion - darken edges
    const ao = ctx.createRadialGradient(cx, cy, w * 0.06, cx, cy, w * 0.26);
    ao.addColorStop(0, "rgba(0,0,0,0)");
    ao.addColorStop(0.55, "rgba(0,0,0,0)");
    ao.addColorStop(0.78, "rgba(80,40,10,0.14)");
    ao.addColorStop(1.0, "rgba(60,25,5,0.32)");
    ctx.fillStyle = ao;
    ctx.fillRect(0, 0, w, h);
    const leftShade = ctx.createLinearGradient(cx - wingOuter, 0, cx - wingOuter * 0.4, 0);
    leftShade.addColorStop(0, "rgba(100,55,15,0.28)");
    leftShade.addColorStop(1, "rgba(100,55,15,0)");
    ctx.fillStyle = leftShade;
    ctx.fillRect(0, 0, w, h);
    const rightShade = ctx.createLinearGradient(cx + wingOuter, 0, cx + wingOuter * 0.4, 0);
    rightShade.addColorStop(0, "rgba(100,55,15,0.30)");
    rightShade.addColorStop(1, "rgba(100,55,15,0)");
    ctx.fillStyle = rightShade;
    ctx.fillRect(0, 0, w, h);
    // Top/bottom pinch darkening
    const topDk = ctx.createLinearGradient(0, topY, 0, topY + h * 0.14);
    topDk.addColorStop(0, "rgba(90,45,10,0.32)");
    topDk.addColorStop(1, "rgba(90,45,10,0)");
    ctx.fillStyle = topDk;
    ctx.fillRect(0, 0, w, h);
    const botDk = ctx.createLinearGradient(0, bottomY, 0, bottomY - h * 0.14);
    botDk.addColorStop(0, "rgba(90,45,10,0.32)");
    botDk.addColorStop(1, "rgba(90,45,10,0)");
    ctx.fillStyle = botDk;
    ctx.fillRect(0, 0, w, h);
    // Main specular highlight - upper left
    const highlight = ctx.createRadialGradient(w * 0.36, h * 0.30, 0, w * 0.36, h * 0.30, w * 0.24);
    highlight.addColorStop(0, "rgba(255,252,235,0.50)");
    highlight.addColorStop(0.25, "rgba(255,248,220,0.28)");
    highlight.addColorStop(0.55, "rgba(255,245,210,0.08)");
    highlight.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = highlight;
    ctx.fillRect(0, 0, w, h);
    // Secondary highlight - upper right
    const highlight2 = ctx.createRadialGradient(w * 0.62, h * 0.34, 0, w * 0.62, h * 0.34, w * 0.18);
    highlight2.addColorStop(0, "rgba(255,250,230,0.20)");
    highlight2.addColorStop(0.5, "rgba(255,248,220,0.05)");
    highlight2.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = highlight2;
    ctx.fillRect(0, 0, w, h);
    // Glaze sheen - diagonal reflection
    const glaze = ctx.createLinearGradient(w * 0.25, h * 0.15, w * 0.75, h * 0.85);
    glaze.addColorStop(0, "rgba(255,255,255,0)");
    glaze.addColorStop(0.30, "rgba(255,255,255,0.05)");
    glaze.addColorStop(0.48, "rgba(255,255,255,0.10)");
    glaze.addColorStop(0.65, "rgba(255,255,255,0.03)");
    glaze.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glaze;
    ctx.fillRect(0, 0, w, h);
    // Center fold seam
    ctx.strokeStyle = "rgba(145,92,34,0.22)";
    ctx.lineWidth = w * 0.007;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, topY + h * 0.03);
    ctx.bezierCurveTo(cx - wingInner * 0.45, h * 0.32, cx - wingInner * 0.42, h * 0.67, cx, bottomY - h * 0.03);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, topY + h * 0.03);
    ctx.bezierCurveTo(cx + wingInner * 0.45, h * 0.32, cx + wingInner * 0.42, h * 0.67, cx, bottomY - h * 0.03);
    ctx.stroke();
    // Soft fold shadow
    const foldSh = ctx.createLinearGradient(cx - w * 0.035, 0, cx + w * 0.035, 0);
    foldSh.addColorStop(0, "rgba(0,0,0,0)");
    foldSh.addColorStop(0.3, "rgba(90,50,15,0.06)");
    foldSh.addColorStop(0.5, "rgba(90,50,15,0.10)");
    foldSh.addColorStop(0.7, "rgba(90,50,15,0.06)");
    foldSh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = foldSh;
    ctx.fillRect(cx - w * 0.05, topY, w * 0.10, bottomY - topY);
    // Surface texture - fine dots
    for (let i = 0; i < 45; i++) {
        const angle = random() * Math.PI * 2;
        const dist = random() * 0.80;
        const px = cx + Math.cos(angle) * wingOuter * 0.8 * dist;
        const py = cy + Math.sin(angle) * (bottomY - topY) * 0.38 * dist;
        ctx.beginPath();
        ctx.arc(px, py, w * (0.0012 + random() * 0.0028), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(118,72,20,${0.04 + random() * 0.05})`;
        ctx.fill();
    }
    // Larger baked spots
    for (let i = 0; i < 10; i++) {
        const angle = random() * Math.PI * 2;
        const dist = 0.12 + random() * 0.58;
        const px = cx + Math.cos(angle) * wingOuter * 0.65 * dist;
        const py = cy + Math.sin(angle) * (bottomY - topY) * 0.32 * dist;
        const gs = w * (0.003 + random() * 0.006);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(random() * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, gs, gs * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,80,25,${0.03 + random() * 0.04})`;
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}
function drawCookieHalf(canvas, side) {
    resizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const random = createSeededRandom(side === "left" ? 17 : 29);
    ctx.clearRect(0, 0, w, h);
    const isLeft = side === "left";
    // Break edge (faces scene center), outer edge (far edge of the folded wafer)
    const breakX = isLeft ? w * 0.535 : w * 0.465;
    const outerX = isLeft ? w * 0.22 : w * 0.78;
    const cy = h * 0.52;
    const pinchH = h * 0.13;
    // Folded wafer silhouette: taller and more tucked in so it reads as a folded cookie, not a dumpling.
    function cookiePath() {
        ctx.beginPath();
        if (isLeft) {
            ctx.moveTo(breakX, cy - pinchH);
            ctx.bezierCurveTo(w * 0.46, cy - h * 0.29, outerX + w * 0.13, cy - h * 0.2, outerX + w * 0.01, cy - h * 0.015);
            ctx.bezierCurveTo(outerX + w * 0.035, cy + h * 0.075, outerX + w * 0.12, cy + h * 0.2, breakX, cy + pinchH);
        }
        else {
            ctx.moveTo(breakX, cy - pinchH);
            ctx.bezierCurveTo(w * 0.54, cy - h * 0.29, outerX - w * 0.13, cy - h * 0.2, outerX - w * 0.01, cy - h * 0.015);
            ctx.bezierCurveTo(outerX - w * 0.035, cy + h * 0.075, outerX - w * 0.12, cy + h * 0.2, breakX, cy + pinchH);
        }
        ctx.closePath(); // straight line = break edge
    }
    // Approximate visual center of this cookie half
    const bodyCx = isLeft ? w * 0.425 : w * 0.575;
    const bodyCy = cy;
    // Drop shadow beneath the cookie
    ctx.save();
    const shadowGrad = ctx.createRadialGradient(bodyCx, cy + h * 0.41, 0, bodyCx, cy + h * 0.41, w * 0.40);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.22)");
    shadowGrad.addColorStop(0.55, "rgba(0,0,0,0.09)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.ellipse(bodyCx, cy + h * 0.36, w * 0.28, h * 0.042, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore();
    // Fold seam to suggest the original wafer being bent inward
    ctx.save();
    cookiePath();
    ctx.clip();
    ctx.strokeStyle = "rgba(142, 92, 34, 0.34)";
    ctx.lineWidth = w * 0.01;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (isLeft) {
        ctx.moveTo(breakX - w * 0.05, cy - h * 0.12);
        ctx.quadraticCurveTo(outerX + w * 0.11, cy, breakX - w * 0.05, cy + h * 0.12);
    }
    else {
        ctx.moveTo(breakX + w * 0.05, cy - h * 0.12);
        ctx.quadraticCurveTo(outerX - w * 0.11, cy, breakX + w * 0.05, cy + h * 0.12);
    }
    ctx.stroke();
    ctx.restore();
    // ── Cookie body (all layers clipped to wing shape) ──
    ctx.save();
    cookiePath();
    ctx.clip();
    // Main colour — warm golden‑brown, light source from outer-upper corner
    const lightX = isLeft ? outerX + w * 0.1 : outerX - w * 0.1;
    const lightY = cy - h * 0.19;
    const mainGrad = ctx.createRadialGradient(lightX, lightY, w * 0.02, bodyCx, bodyCy, w * 0.56);
    mainGrad.addColorStop(0, "#fae7ab");
    mainGrad.addColorStop(0.24, "#f1d27a");
    mainGrad.addColorStop(0.52, "#dfab4e");
    mainGrad.addColorStop(0.78, "#c07f2f");
    mainGrad.addColorStop(1.0, "#9d5e22");
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, w, h);
    // Edge/rim darkening
    const rimGrad = ctx.createRadialGradient(bodyCx, bodyCy, w * 0.14, bodyCx, bodyCy, w * 0.5);
    rimGrad.addColorStop(0, "rgba(0,0,0,0)");
    rimGrad.addColorStop(0.62, "rgba(0,0,0,0)");
    rimGrad.addColorStop(0.8, "rgba(72,36,8,0.18)");
    rimGrad.addColorStop(1.0, "rgba(72,36,8,0.4)");
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 0, w, h);
    // Top taper darkening (surface curls away from viewer)
    const topDark = ctx.createLinearGradient(0, cy - pinchH, 0, cy - h * 0.28);
    topDark.addColorStop(0, "rgba(82,40,7,0)");
    topDark.addColorStop(1, "rgba(82,40,7,0.22)");
    ctx.fillStyle = topDark;
    ctx.fillRect(0, 0, w, h);
    // Bottom taper darkening
    const botDark = ctx.createLinearGradient(0, cy + pinchH, 0, cy + h * 0.3);
    botDark.addColorStop(0, "rgba(82,40,7,0)");
    botDark.addColorStop(1, "rgba(82,40,7,0.26)");
    ctx.fillStyle = botDark;
    ctx.fillRect(0, 0, w, h);
    // Specular highlight
    const specGrad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, w * 0.34);
    specGrad.addColorStop(0, "rgba(255,248,220,0.4)");
    specGrad.addColorStop(0.42, "rgba(255,248,220,0.12)");
    specGrad.addColorStop(1, "rgba(255,248,215,0)");
    ctx.fillStyle = specGrad;
    ctx.fillRect(0, 0, w, h);
    // Glaze sheen
    const glazeDir = isLeft ? -1 : 1;
    const glaze = ctx.createLinearGradient(bodyCx + glazeDir * w * 0.18, cy - h * 0.2, bodyCx - glazeDir * w * 0.18, cy + h * 0.18);
    glaze.addColorStop(0, "rgba(255,255,255,0.12)");
    glaze.addColorStop(0.45, "rgba(255,255,255,0)");
    glaze.addColorStop(1, "rgba(80,38,8,0.12)");
    ctx.fillStyle = glaze;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // ── Surface texture (sesame grain + pores) ──
    ctx.save();
    cookiePath();
    ctx.clip();
    for (let i = 0; i < 14; i++) {
        const angle = random() * Math.PI * 2;
        const dist = 0.14 + random() * 0.64;
        const bx = bodyCx + Math.cos(angle) * w * 0.23 * dist;
        const by = bodyCy + Math.sin(angle) * h * 0.23 * dist;
        const gs = w * (0.004 + random() * 0.006);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(random() * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, gs, gs * 0.52, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(127,78,22,${0.08 + random() * 0.06})`;
        ctx.fill();
        ctx.restore();
    }
    for (let i = 0; i < 34; i++) {
        const angle = random() * Math.PI * 2;
        const dist = random() * 0.78;
        const bx = bodyCx + Math.cos(angle) * w * 0.24 * dist;
        const by = bodyCy + Math.sin(angle) * h * 0.24 * dist;
        ctx.beginPath();
        ctx.arc(bx, by, w * (0.0016 + random() * 0.003), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(118,72,20,${0.07 + random() * 0.06})`;
        ctx.fill();
    }
    ctx.restore();
    // ── Break-edge cross-section (shows cookie thickness) ──
    const rimW = w * 0.012;
    const inward = isLeft ? -1 : 1;
    const steps = 12;
    ctx.save();
    cookiePath();
    ctx.clip();
    for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        const ey1 = (cy - pinchH) + t1 * pinchH * 2;
        const ey2 = (cy - pinchH) + t2 * pinchH * 2;
        const j1 = Math.sin(t1 * 21) * (w * 0.016) + Math.cos(t1 * 33) * (w * 0.008);
        const j2 = Math.sin(t2 * 21) * (w * 0.016) + Math.cos(t2 * 33) * (w * 0.008);
        ctx.beginPath();
        ctx.moveTo(breakX + j1, ey1);
        ctx.lineTo(breakX + j2, ey2);
        ctx.lineTo(breakX + j2 + inward * rimW, ey2);
        ctx.lineTo(breakX + j1 + inward * rimW, ey1);
        ctx.closePath();
        ctx.fillStyle = "rgba(232,186,96,0.44)";
        ctx.fill();
    }
    ctx.restore();
    // Subtle inner fold line. Keep it soft so the cookie does not look pre-cracked.
    ctx.save();
    ctx.strokeStyle = "rgba(187,124,49,0.26)";
    ctx.lineWidth = Math.max(0.9, w * 0.0028);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ey = (cy - pinchH) + t * pinchH * 2;
        const jitter = Math.sin(t * 21) * (w * 0.006) + Math.cos(t * 33) * (w * 0.003);
        const ex = breakX + jitter;
        if (i === 0)
            ctx.moveTo(ex, ey);
        else
            ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.restore();
}
class FortuneCookie {
    constructor() {
        this.content = null;
        this.isCracked = false;
        this.isReady = false;
        this.currentFortuneIdx = -1;
        this.currentLucky = 0;
        this.currentTagIdx = 0;
        this.currentColorIdx = 0;
        this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.scene = document.getElementById("cookieScene");
        this.miniSlip = document.getElementById("miniSlip");
        this.miniSlipText = document.getElementById("miniSlipText");
        this.miniSlipMeta = document.getElementById("miniSlipMeta");
        this.instruction = document.getElementById("instruction");
        this.resetBtn = document.getElementById("resetBtn");
        this.shareBtn = document.getElementById("shareBtn");
        this.titleEl = document.getElementById("title");
        this.subtitleEl = document.getElementById("subtitle");
        this.homeLink = document.getElementById("homeLink");
        this.langToggle = document.getElementById("langToggle");
        this.statusNote = document.getElementById("statusNote");
        this.canvasLeft = document.getElementById("canvasLeft");
        this.canvasRight = document.getElementById("canvasRight");
        this.canvasClosed = document.getElementById("canvasClosed");
        this.lang = localStorage.getItem("playground-lang") || "ko";
        this.scene.addEventListener("click", () => this.crack());
        this.resetBtn.addEventListener("click", () => this.reset());
        this.shareBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.shareFortune();
        });
        this.langToggle.addEventListener("click", () => {
            this.lang = this.lang === "ko" ? "en" : "ko";
            localStorage.setItem("playground-lang", this.lang);
            if (this.isReady) {
                this.applyLang();
            }
        });
        window.addEventListener("resize", () => this.drawCookie());
        this.initialize();
    }
    async initialize() {
        this.createStars();
        this.drawCookie();
        const data = this.loadI18nData();
        if (!data) {
            try {
                const response = await fetch("./i18n.json");
                this.applyI18nData(await response.json());
            }
            catch (error) {
                console.error("Failed to load fortune i18n data", error);
            }
        }
    }
    loadI18nData() {
        const embedded = document.getElementById("fortuneI18nData");
        if (!(embedded === null || embedded === void 0 ? void 0 : embedded.textContent))
            return false;
        try {
            this.applyI18nData(JSON.parse(embedded.textContent));
            return true;
        }
        catch (error) {
            console.error("Failed to parse embedded fortune i18n data", error);
            return false;
        }
    }
    applyI18nData(data) {
        this.content = {
            ko: data.ko.fortune,
            en: data.en.fortune,
        };
        this.isReady = true;
        const fromHash = this.loadFromHash();
        if (fromHash)
            this.isCracked = true;
        this.applyLang();
        if (fromHash) {
            this.instruction.classList.add("hidden");
            this.scene.classList.add("cracked");
            this.miniSlip.classList.add("visible");
            this.resetBtn.classList.add("visible");
        }
    }
    getStrings() {
        if (!this.content) {
            throw new Error("Fortune content not loaded");
        }
        return this.content[this.lang];
    }
    applyLang() {
        const t = this.getStrings();
        document.documentElement.lang = this.lang;
        this.titleEl.textContent = t.title;
        this.subtitleEl.textContent = t.subtitle;
        this.shareBtn.textContent = t.share;
        if (!this.isCracked) {
            this.instruction.textContent = t.instruction;
            this.statusNote.textContent = t.statusHint;
        }
        else if (this.currentFortuneIdx >= 0) {
            this.statusNote.textContent = t.readyStatus;
        }
        this.resetBtn.textContent = t.reset;
        this.homeLink.textContent = t.home;
        this.langToggle.textContent = t.toggle;
        this.scene.setAttribute("aria-label", t.sceneAria);
        // Update displayed fortune if cracked
        if (this.isCracked && this.currentFortuneIdx >= 0) {
            const list = t.messages;
            const idx = Math.min(this.currentFortuneIdx, list.length - 1);
            const text = list[idx];
            const tag = t.tags[this.currentTagIdx % t.tags.length];
            const color = t.luckyColors[this.currentColorIdx % t.luckyColors.length];
            this.updateFortuneContent(text, tag, color, t.luckyLabel, t.keywordLabel, t.colorLabel);
        }
        document.title = this.lang === "ko"
            ? "포츈쿠키 - 오늘의 운세 | Fortune Cookie"
            : "Fortune Cookie - Today's Fortune | 포츈쿠키";
    }
    createStars() {
        for (let i = 0; i < 40; i++) {
            const star = document.createElement("div");
            star.className = "star";
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            const size = `${1 + Math.random() * 2.5}px`;
            star.style.width = size;
            star.style.height = size;
            document.body.appendChild(star);
        }
    }
    drawCookie() {
        drawClosedCookie(this.canvasClosed);
        drawCookieHalf(this.canvasLeft, "left");
        drawCookieHalf(this.canvasRight, "right");
    }
    updateFortuneContent(text, tag, color, luckyLabel, keywordLabel, colorLabel) {
        this.miniSlipText.textContent = formatFortuneText(text);
        this.miniSlipMeta.innerHTML = `
      <span class="meta-chip">
        <span aria-hidden="true">🔮</span>
        <span class="meta-label">${luckyLabel}</span>
        <strong>${this.currentLucky}</strong>
      </span>
      <span class="meta-chip keyword">
        <span class="meta-label">${keywordLabel}</span>
        <strong>${tag}</strong>
      </span>
      <span class="meta-chip color-chip">
        <span class="color-swatch" style="background:${color.hex}" tabindex="0" aria-label="${colorLabel} ${color.hex}">
          <span class="color-tooltip">${color.hex}</span>
        </span>
        <span class="meta-label">${colorLabel}</span>
        <strong>${color.name}</strong>
      </span>
    `;
    }
    crack() {
        if (this.isCracked || !this.isReady)
            return;
        this.isCracked = true;
        this.instruction.classList.add("hidden");
        this.statusNote.textContent = this.getStrings().openingStatus;
        if (!this.prefersReducedMotion) {
            this.scene.classList.add("shaking");
        }
        setTimeout(() => {
            this.scene.classList.remove("shaking");
            this.scene.classList.add("cracked");
            if (!this.prefersReducedMotion) {
                this.scene.classList.add("crack-flash");
            }
            this.spawnGlowParticles();
            this.showFortune();
        }, this.prefersReducedMotion ? 40 : 500);
    }
    spawnGlowParticles() {
        if (this.prefersReducedMotion)
            return;
        const rect = this.scene.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const container = document.getElementById("particles");
        for (let i = 0; i < 50; i++) {
            const p = document.createElement("div");
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 220;
            const size = 3 + Math.random() * 9;
            const colors = ["#ffd700", "#ff8c00", "#ffec8b", "#ffe066", "#fff5cc", "#ffaa33"];
            p.style.cssText = `
        position: fixed;
        left: ${cx}px; top: ${cy}px;
        width: ${size}px; height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 51;
        transition: all ${0.6 + Math.random() * 0.6}s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 1;
      `;
            container.appendChild(p);
            requestAnimationFrame(() => {
                p.style.left = `${cx + Math.cos(angle) * distance}px`;
                p.style.top = `${cy + Math.sin(angle) * distance}px`;
                p.style.opacity = "0";
                p.style.transform = "scale(0)";
            });
            setTimeout(() => p.remove(), 1500);
        }
    }
    showFortune() {
        const t = this.getStrings();
        const list = t.messages;
        this.currentFortuneIdx = Math.floor(Math.random() * list.length);
        this.currentLucky = Math.floor(Math.random() * 99) + 1;
        const tagList = t.tags;
        const tagIdx = Math.floor(Math.random() * tagList.length);
        this.currentColorIdx = Math.floor(Math.random() * t.luckyColors.length);
        this.currentTagIdx = tagIdx;
        const text = list[this.currentFortuneIdx];
        const tag = tagList[tagIdx];
        this.updateFortuneContent(text, tag, t.luckyColors[this.currentColorIdx], t.luckyLabel, t.keywordLabel, t.colorLabel);
        setTimeout(() => {
            this.miniSlip.classList.add("visible");
        }, this.prefersReducedMotion ? 20 : 300);
        setTimeout(() => {
            this.resetBtn.classList.add("visible");
            this.resetBtn.focus();
        }, this.prefersReducedMotion ? 40 : 800);
        this.statusNote.textContent = t.readyStatus;
    }
    reset() {
        this.isCracked = false;
        this.currentFortuneIdx = -1;
        this.scene.classList.remove("cracked");
        this.scene.classList.remove("crack-flash");
        this.miniSlip.classList.remove("visible");
        this.resetBtn.classList.remove("visible");
        this.instruction.classList.remove("hidden");
        if (this.isReady) {
            const t = this.getStrings();
            this.instruction.textContent = t.instruction;
            this.statusNote.textContent = t.statusHint;
        }
        this.scene.focus();
        history.replaceState(null, "", location.pathname);
        this.drawCookie();
    }
    async generateShareCard() {
        const t = this.getStrings();
        const idx = Math.min(this.currentFortuneIdx, t.messages.length - 1);
        const text = t.messages[idx];
        const tag = t.tags[this.currentTagIdx % t.tags.length];
        const S = 1080;
        const cv = document.createElement("canvas");
        cv.width = S; cv.height = S;
        const ctx = cv.getContext("2d");
        const bg = ctx.createRadialGradient(S/2, S*0.36, S*0.08, S/2, S*0.5, S*0.85);
        bg.addColorStop(0, "#4a5cd6"); bg.addColorStop(1, "#252a7a");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
        ctx.save(); ctx.translate(S*0.48, S*0.30); ctx.scale(3.2, 3.2);
        ctx.beginPath(); ctx.ellipse(0, 82, 50, 10, 0, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fill();
        ctx.save(); ctx.translate(28, 38); ctx.rotate(0.22);
        ctx.fillStyle = "#fffdf5"; ctx.beginPath(); ctx.roundRect(-22, -12, 58, 48, 4); ctx.fill();
        ctx.strokeStyle = "#c0c0c0"; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.font = "bold 26px sans-serif"; ctx.fillStyle = "#3b4cca";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 7, 12);
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(8,-72);
        ctx.bezierCurveTo(-22,-75,-72,-42,-76,6); ctx.bezierCurveTo(-73,46,-34,70,8,72);
        ctx.bezierCurveTo(30,66,52,34,50,0); ctx.bezierCurveTo(46,-36,26,-66,8,-72); ctx.closePath();
        const ck = ctx.createLinearGradient(-68,-55,45,55);
        ck.addColorStop(0,"#f5d88a"); ck.addColorStop(0.5,"#e8b550"); ck.addColorStop(1,"#c88a30");
        ctx.fillStyle = ck; ctx.fill();
        ctx.strokeStyle = "#4a3218"; ctx.lineWidth = 3.2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3,-65); ctx.bezierCurveTo(-10,-20,-7,22,3,65);
        ctx.strokeStyle = "#9a6020"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-28,-28,22,16,-0.4,0,Math.PI*2);
        ctx.fillStyle = "rgba(255,240,200,0.22)"; ctx.fill();
        ctx.restore();
        const cardX = S*0.08, cardY = S*0.56, cardW = S*0.84, cardH = S*0.34;
        ctx.fillStyle = "rgba(8,6,24,0.72)"; ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,cardH,20); ctx.fill();
        ctx.strokeStyle = "rgba(255,212,107,0.2)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,cardH,20); ctx.stroke();
        ctx.font = "600 36px 'Noto Sans KR',sans-serif"; ctx.fillStyle = "#fff7e8";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        const lines = this.wrapText(ctx, text, cardW - 72);
        const lh = 50, sy = cardY + (cardH - lines.length*lh - 36)/2 + 8;
        lines.forEach((l, i) => ctx.fillText(l, S/2, sy + i*lh));
        ctx.font = "500 26px 'Noto Sans KR',sans-serif"; ctx.fillStyle = "rgba(255,212,107,0.6)";
        ctx.textBaseline = "bottom";
        ctx.fillText(`🔮 ${t.luckyLabel} ${this.currentLucky}  ·  ${tag}`, S/2, cardY+cardH-16);
        ctx.font = "bold 28px 'Noto Sans KR',sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText(t.title, S/2, S-32);
        return new Promise((resolve, reject) => {
            cv.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
        });
    }
    wrapText(ctx, text, maxWidth) {
        const words = text.split(/(\s+)/);
        const lines = [];
        let cur = "";
        for (const w of words) {
            const test = cur + w;
            if (ctx.measureText(test).width > maxWidth && cur.trim()) { lines.push(cur.trim()); cur = w.trimStart(); }
            else { cur = test; }
        }
        if (cur.trim()) lines.push(cur.trim());
        return lines;
    }
    async shareFortune() {
        const t = this.getStrings();
        const hash = `#f=${this.currentFortuneIdx}&l=${this.currentLucky}&t=${this.currentTagIdx}&c=${this.currentColorIdx}&lang=${this.lang}`;
        const url = `${location.origin}${location.pathname}${hash}`;
        try {
            const blob = await this.generateShareCard();
            const file = new File([blob], "fortune-cookie.png", { type: "image/png" });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: t.title, url });
                return;
            }
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "fortune-cookie.png";
            a.click();
            URL.revokeObjectURL(a.href);
            this.showToast(this.lang === "ko" ? "이미지가 저장됐어요 ✓" : "Image saved ✓");
            return;
        }
        catch (_a) { }
        if (navigator.share) {
            try { await navigator.share({ url, title: t.title }); return; }
            catch (_b) { }
        }
        try {
            await navigator.clipboard.writeText(url);
            this.showToast(t.shareToast);
        }
        catch (_c) {
            prompt(this.lang === "ko" ? "URL을 복사하세요:" : "Copy this URL:", url);
        }
    }
    showToast(message) {
        const toast = document.getElementById("shareToast");
        toast.textContent = message;
        toast.classList.add("visible");
        setTimeout(() => toast.classList.remove("visible"), 2500);
    }
    loadFromHash() {
        var _a, _b, _c, _d;
        const hash = location.hash;
        if (!hash)
            return false;
        const params = new URLSearchParams(hash.slice(1));
        const f = parseInt((_a = params.get("f")) !== null && _a !== void 0 ? _a : "", 10);
        const l = parseInt((_b = params.get("l")) !== null && _b !== void 0 ? _b : "", 10);
        const t = parseInt((_c = params.get("t")) !== null && _c !== void 0 ? _c : "", 10);
        const c = parseInt((_d = params.get("c")) !== null && _d !== void 0 ? _d : "", 10);
        const lang = params.get("lang");
        if (isNaN(f) || isNaN(l) || isNaN(t) || isNaN(c))
            return false;
        if (lang === "ko" || lang === "en") {
            this.lang = lang;
            localStorage.setItem("playground-lang", lang);
        }
        this.currentFortuneIdx = f;
        this.currentLucky = l;
        this.currentTagIdx = t;
        this.currentColorIdx = c;
        return true;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new FortuneCookie();
});
