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
function drawCookieHalf(canvas, side) {
    resizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const random = createSeededRandom(side === "left" ? 17 : 29);
    ctx.clearRect(0, 0, w, h);
    const cx = side === "left" ? w * 0.6 : w * 0.4;
    const cy = h * 0.5;
    const rx = w * 0.41;
    const ry = h * 0.4;
    const tilt = side === "left" ? -0.12 : 0.12;
    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + ry * 0.78, rx * 0.82, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fill();
    ctx.restore();
    // Main cookie body
    const grad = ctx.createRadialGradient(cx - rx * 0.28, cy - ry * 0.34, rx * 0.08, cx, cy, rx);
    grad.addColorStop(0, "#f8e4ab");
    grad.addColorStop(0.24, "#ebc97f");
    grad.addColorStop(0.62, "#cc9946");
    grad.addColorStop(1, "#8a5b23");
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    // Edge shading
    const edgeGrad = ctx.createRadialGradient(cx, cy, rx * 0.55, cx, cy, rx * 1.02);
    edgeGrad.addColorStop(0, "rgba(0,0,0,0)");
    edgeGrad.addColorStop(1, "rgba(80,50,10,0.52)");
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = edgeGrad;
    ctx.fill();
    const glaze = ctx.createLinearGradient(cx - rx * 0.6, cy - ry * 0.8, cx + rx * 0.5, cy + ry * 0.8);
    glaze.addColorStop(0, "rgba(255,255,255,0.2)");
    glaze.addColorStop(0.4, "rgba(255,255,255,0)");
    glaze.addColorStop(1, "rgba(108,62,8,0.24)");
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = glaze;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 225, 153, 0.35)";
    ctx.lineWidth = Math.max(1.5, w * 0.005);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.96, ry * 0.96, tilt, 0.28, Math.PI * 1.62);
    ctx.stroke();
    const foldGrad = ctx.createLinearGradient(cx, cy - ry * 0.55, cx, cy + ry * 0.55);
    foldGrad.addColorStop(0, "rgba(120, 73, 18, 0)");
    foldGrad.addColorStop(0.5, "rgba(120, 73, 18, 0.16)");
    foldGrad.addColorStop(1, "rgba(120, 73, 18, 0)");
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.62, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.fillStyle = foldGrad;
    ctx.fill();
    ctx.restore();
    // Highlight
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.22, cy - ry * 0.26, rx * 0.52, ry * 0.38, -0.36, 0, Math.PI * 2);
    const hlGrad = ctx.createRadialGradient(cx - 25, cy - 40, 5, cx - 25, cy - 40, rx * 0.5);
    hlGrad.addColorStop(0, "rgba(255,230,160,0.35)");
    hlGrad.addColorStop(1, "rgba(255,230,160,0)");
    ctx.fillStyle = hlGrad;
    ctx.fill();
    ctx.restore();
    // Flat edge (broken side)
    const edgeX = side === "left" ? cx + rx * 0.55 : cx - rx * 0.55;
    ctx.save();
    ctx.beginPath();
    ctx.rect(side === "left" ? edgeX : 0, cy - ry, side === "left" ? w - edgeX : edgeX, ry * 2);
    ctx.fillStyle = "rgba(26, 10, 46, 1)";
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill();
    ctx.restore();
    // Broken edge texture
    ctx.save();
    ctx.strokeStyle = "#9b6d26";
    ctx.lineWidth = Math.max(2, w * 0.008);
    ctx.beginPath();
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const ey = cy - ry * 0.85 + t * ry * 1.7;
        const jitter = Math.sin(t * 17) * (w * 0.02) + Math.cos(t * 23) * (w * 0.014);
        const ex = edgeX + jitter;
        if (i === 0)
            ctx.moveTo(ex, ey);
        else
            ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    ctx.restore();
    // Subtle texture bumps
    ctx.fillStyle = "rgba(137, 92, 25, 0.17)";
    for (let i = 0; i < 18; i++) {
        const angle = random() * Math.PI * 2;
        const dist = random() * 0.7;
        const bx = cx + Math.cos(angle) * rx * dist;
        const by = cy + Math.sin(angle) * ry * dist;
        ctx.beginPath();
        ctx.arc(bx, by, w * (0.008 + random() * 0.012), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = "rgba(120, 77, 19, 0.2)";
    for (let i = 0; i < 10; i++) {
        const angle = random() * Math.PI * 2;
        const dist = 0.18 + random() * 0.62;
        const bx = cx + Math.cos(angle) * rx * dist;
        const by = cy + Math.sin(angle) * ry * dist;
        ctx.beginPath();
        ctx.ellipse(bx, by, w * (0.006 + random() * 0.008), h * (0.004 + random() * 0.008), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = "rgba(255, 240, 195, 0.28)";
    ctx.lineWidth = Math.max(1.5, w * 0.005);
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.05, cy - h * 0.08, rx * 0.68, ry * 0.6, -0.34, 0.1, 1.75);
    ctx.stroke();
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
        this.titleEl = document.getElementById("title");
        this.subtitleEl = document.getElementById("subtitle");
        this.homeLink = document.getElementById("homeLink");
        this.langToggle = document.getElementById("langToggle");
        this.introCard = document.getElementById("introCard");
        this.introLabelOne = document.getElementById("introLabelOne");
        this.introValueOne = document.getElementById("introValueOne");
        this.introLabelTwo = document.getElementById("introLabelTwo");
        this.introValueTwo = document.getElementById("introValueTwo");
        this.statusNote = document.getElementById("statusNote");
        this.canvasLeft = document.getElementById("canvasLeft");
        this.canvasRight = document.getElementById("canvasRight");
        this.lang = localStorage.getItem("playground-lang") || "ko";
        this.scene.addEventListener("click", () => this.crack());
        this.resetBtn.addEventListener("click", () => this.reset());
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
        const embedded = document.getElementById("fortuneI18nData");
        if (embedded === null || embedded === void 0 ? void 0 : embedded.textContent) {
            try {
                const data = JSON.parse(embedded.textContent);
                this.content = {
                    ko: data.ko.fortune,
                    en: data.en.fortune,
                };
                this.isReady = true;
                this.applyLang();
                return;
            }
            catch (error) {
                console.error("Failed to parse embedded fortune i18n data", error);
            }
        }
        try {
            const response = await fetch("./i18n.json");
            const data = await response.json();
            this.content = {
                ko: data.ko.fortune,
                en: data.en.fortune,
            };
            this.isReady = true;
            this.applyLang();
        }
        catch (error) {
            console.error("Failed to load fortune i18n data", error);
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
        this.introLabelOne.textContent = t.introLabelOne;
        this.introValueOne.textContent = t.introValueOne;
        this.introLabelTwo.textContent = t.introLabelTwo;
        this.introValueTwo.textContent = t.introValueTwo;
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
        this.introCard.classList.add("hidden");
        this.statusNote.textContent = this.getStrings().openingStatus;
        if (!this.prefersReducedMotion) {
            this.scene.classList.add("shaking");
        }
        setTimeout(() => {
            this.scene.classList.remove("shaking");
            this.scene.classList.add("cracked");
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
        for (let i = 0; i < 35; i++) {
            const p = document.createElement("div");
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 180;
            const size = 3 + Math.random() * 7;
            const colors = ["#ffd700", "#ff8c00", "#ffec8b", "#ffe066"];
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
        this.miniSlip.classList.remove("visible");
        this.resetBtn.classList.remove("visible");
        this.instruction.classList.remove("hidden");
        this.introCard.classList.remove("hidden");
        if (this.isReady) {
            const t = this.getStrings();
            this.instruction.textContent = t.instruction;
            this.statusNote.textContent = t.statusHint;
        }
        this.scene.focus();
        this.drawCookie();
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new FortuneCookie();
});
