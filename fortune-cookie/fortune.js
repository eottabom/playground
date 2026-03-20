"use strict";
function formatFortuneText(text) {
    const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];
    if (sentences.length <= 1) {
        return text;
    }
    return [sentences[0], sentences.slice(1).join(" ")].join("\n");
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
        this.resetBtn = (document.getElementById("resetBtn") || document.getElementById("resetBtn2"));
        this.shareBtn = document.getElementById("shareBtn");
        this.saveBtn = document.getElementById("saveBtn");
        this.titleEl = document.getElementById("title");
        this.subtitleEl = document.getElementById("subtitle");
        this.homeLink = document.getElementById("homeLink");
        this.langToggle = document.getElementById("langToggle");
        this.statusNote = document.getElementById("statusNote");
        this.lang = localStorage.getItem("playground-lang") || "ko";
        this.scene.addEventListener("click", () => this.crack());
        this.resetBtn.addEventListener("click", () => this.reset());
        document.getElementById("resetBtn2")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.reset();
        });
        this.saveBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.saveImage();
        });
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
        this.initialize();
    }
    async initialize() {
        this.createStars();
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
        if (!embedded?.textContent)
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
        this.applyLang();
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
        const resetBtnText2 = document.getElementById("resetBtnText2");
        if (resetBtnText2)
            resetBtnText2.textContent = t.newCookie;
        const shareBtnText = document.getElementById("shareBtnText");
        if (shareBtnText)
            shareBtnText.textContent = t.shareShort;
        const saveBtnText = document.getElementById("saveBtnText");
        if (saveBtnText)
            saveBtnText.textContent = t.saveShort;
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
            this.updateFortuneContent(text, tag, color);
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
    updateFortuneContent(text, tag, color) {
        const t = this.getStrings();
        this.miniSlipText.textContent = formatFortuneText(text);
        this.miniSlipMeta.innerHTML = `
      <span class="meta-item"><span class="meta-label">${t.numLabel}:</span> <strong>${this.currentLucky}</strong></span>
      <span class="meta-dot">·</span>
      <span class="meta-item"><span class="meta-label">${t.kwLabel}:</span> <strong>${tag}</strong></span>
      <span class="meta-dot">·</span>
      <span class="meta-item"><span class="meta-label">${t.clrLabel}:</span> <span class="color-swatch" style="background:${color.hex}"></span> <strong>${color.name}</strong></span>
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
        this.updateFortuneContent(text, tag, t.luckyColors[this.currentColorIdx]);
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
    }
    async generateShareCard() {
        const t = this.getStrings();
        const idx = Math.min(this.currentFortuneIdx, t.messages.length - 1);
        const text = t.messages[idx];
        const tag = t.tags[this.currentTagIdx % t.tags.length];
        const color = t.luckyColors[this.currentColorIdx % t.luckyColors.length];
        const S = 1080;
        const cv = document.createElement("canvas");
        cv.width = S;
        cv.height = S;
        const ctx = cv.getContext("2d");
        // Load cookie image
        const img = new Image();
        img.src = "fortune-img.png";
        await new Promise((res) => { img.onload = () => res(); img.onerror = () => res(); });
        // Background + cookie image layered
        const bg = ctx.createLinearGradient(0, 0, 0, S);
        bg.addColorStop(0, "#12071c");
        bg.addColorStop(0.5, "#1c1231");
        bg.addColorStop(1, "#0d233f");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, S, S);
        // Title
        ctx.font = "700 44px 'Noto Sans KR',sans-serif";
        ctx.fillStyle = "#ffd46b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`🥠 ${t.title}`, S / 2, S * 0.10);
        // Card area
        const cardX = S * 0.06, cardY = S * 0.18, cardW = S * 0.88, cardH = S * 0.62;
        ctx.fillStyle = "rgba(14,10,28,0.82)";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 28);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,215,0,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 28);
        ctx.stroke();
        // Cookie image inside card as watermark
        if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 28);
            ctx.clip();
            const ratio = img.naturalHeight / img.naturalWidth;
            const imgW = cardW * 1.0;
            const imgH = imgW * ratio;
            const imgX = cardX + (cardW - imgW) / 2;
            const imgY = cardY + (cardH - imgH) / 2;
            ctx.globalAlpha = 0.22;
            ctx.drawImage(img, imgX, imgY, imgW, imgH);
            ctx.globalAlpha = 1;
            // Darken white bg within card
            ctx.fillStyle = "rgba(14,10,28,0.45)";
            ctx.fillRect(cardX, cardY, cardW, cardH);
            ctx.restore();
        }
        // Fortune text
        ctx.font = "600 42px 'Noto Sans KR',sans-serif";
        ctx.fillStyle = "#fff7e8";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const lines = this.wrapText(ctx, text, cardW - 80);
        const lh = 58;
        const blockH = lines.length * lh;
        const textStartY = cardY + (cardH - blockH - 70) / 2 + 10;
        lines.forEach((l, i) => ctx.fillText(l, S / 2, textStartY + i * lh));
        // Dashed divider
        const divY = cardY + cardH - 75;
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cardX + 30, divY);
        ctx.lineTo(cardX + cardW - 30, divY);
        ctx.stroke();
        ctx.setLineDash([]);
        // Meta - chip style like web
        const chips = [
            `${t.numLabel}: ${this.currentLucky}`,
            `${t.kwLabel}: ${tag}`,
            `${t.clrLabel}: ${color.name}`
        ];
        const metaY = divY + 38;
        ctx.font = "500 22px 'Noto Sans KR',sans-serif";
        const chipPad = 20, chipH = 34, chipR = 17;
        const chipWidths = chips.map(c => ctx.measureText(c).width + chipPad * 2);
        const dotW = ctx.measureText(" · ").width;
        const totalW = chipWidths.reduce((a, b) => a + b, 0) + dotW * 2;
        let mx = (S - totalW) / 2;
        chips.forEach((chip, i) => {
            const cw = chipWidths[i];
            ctx.fillStyle = "rgba(255,215,0,0.10)";
            ctx.beginPath();
            ctx.roundRect(mx, metaY - chipH / 2, cw, chipH, chipR);
            ctx.fill();
            ctx.strokeStyle = "rgba(255,215,0,0.22)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(mx, metaY - chipH / 2, cw, chipH, chipR);
            ctx.stroke();
            ctx.fillStyle = "rgba(255,248,230,0.85)";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(chip, mx + chipPad, metaY);
            mx += cw;
            if (i < 2) {
                ctx.fillStyle = "rgba(255,255,255,0.25)";
                ctx.textAlign = "center";
                ctx.fillText("·", mx + dotW / 2, metaY);
                mx += dotW;
            }
        });
        // CTA button
        const ctaY = S * 0.84;
        const ctaText = t.shareCta;
        ctx.font = "600 30px 'Noto Sans KR',sans-serif";
        const ctaW = ctx.measureText(ctaText).width + 56;
        ctx.fillStyle = "rgba(255,215,0,0.12)";
        ctx.beginPath();
        ctx.roundRect((S - ctaW) / 2, ctaY - 20, ctaW, 48, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,215,0,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect((S - ctaW) / 2, ctaY - 20, ctaW, 48, 24);
        ctx.stroke();
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ctaText, S / 2, ctaY + 3);
        // URL embedded in image
        const shareUrl = `${location.origin}${location.pathname}`;
        ctx.font = "400 22px 'Noto Sans KR',sans-serif";
        ctx.fillStyle = "rgba(255,215,0,0.75)";
        ctx.textBaseline = "top";
        ctx.fillText(shareUrl, S / 2, ctaY + 42);
        // Footer
        ctx.font = "400 18px 'Noto Sans KR',sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.textBaseline = "bottom";
        ctx.fillText("eottabom.github.io", S / 2, S - 20);
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
            if (ctx.measureText(test).width > maxWidth && cur.trim()) {
                lines.push(cur.trim());
                cur = w.trimStart();
            }
            else {
                cur = test;
            }
        }
        if (cur.trim())
            lines.push(cur.trim());
        return lines;
    }
    downloadBlob(blob, filename) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    async saveImage() {
        const t = this.getStrings();
        try {
            const blob = await this.generateShareCard();
            const file = new File([blob], "fortune-cookie.png", { type: "image/png" });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: t.title });
                return;
            }
            this.downloadBlob(blob, "fortune-cookie.png");
            this.showToast(t.imageSaved);
        }
        catch { /* silent */ }
    }
    buildShareText() {
        const t = this.getStrings();
        const url = `${location.origin}${location.pathname}`;
        const idx = Math.min(this.currentFortuneIdx, t.messages.length - 1);
        const text = t.messages[idx];
        const tag = t.tags[this.currentTagIdx % t.tags.length];
        const color = t.luckyColors[this.currentColorIdx % t.luckyColors.length];
        const meta = `${t.numLabel}: ${this.currentLucky} · ${t.kwLabel}: ${tag} · ${t.clrLabel}: ${color.name}`;
        return `🥠 ${t.title}\n\n"${text}"\n\n${meta}\n\n${t.shareCta}\n${url}`;
    }
    async shareFortune() {
        const t = this.getStrings();
        const url = `${location.origin}${location.pathname}`;
        try {
            const blob = await this.generateShareCard();
            const file = new File([blob], 'fortune-cookie.png', { type: 'image/png' });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    url,
                });
                return;
            }
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                this.showToast(t.imageCopied);
            }
            catch {
                this.downloadBlob(blob, 'fortune-cookie.png');
                this.showToast(t.imageSaved);
            }
        }
        catch {
            if (navigator.share) {
                try {
                    await navigator.share({ url });
                    return;
                }
                catch {
                    // fall through
                }
            }
            try {
                await navigator.clipboard.writeText(url);
                this.showToast(t.shareToast);
            }
            catch {
                prompt(this.lang === 'ko' ? '링크를 복사하세요:' : 'Copy this link:', url);
            }
        }
    }
    showToast(message) {
        const toast = document.getElementById("shareToast");
        toast.textContent = message;
        toast.classList.add("visible");
        setTimeout(() => toast.classList.remove("visible"), 2500);
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new FortuneCookie();
});
