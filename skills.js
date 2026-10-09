// =============================================
//  TECHNICAL ARSENAL — SCROLL ENGINE
//  Apple-style sticky scrollmation
// =============================================

// ── Data ─────────────────────────────────────
const ARSENAL_DATA = [
    {
        id: 'genai',
        label: 'Generative AI',
        tagline: 'Collaborative · Fluid · Emergent',
        accentColor: '#00F0FF',
        gridId: 'genai-chip-grid',
        chipClass: 'chip-genai',
        animIn: 'genai-in',
        skills: [
            'LangChain', 'LangGraph', 'Prompt Engineering',
            'Azure OpenAI', 'Agentic RAG', 'Milvus',
            'ChromaDB', 'Pydantic Structured Output', 'Multi-Agent Systems'
        ]
    },
    {
        id: 'ml',
        label: 'Machine Learning & Deep Learning',
        tagline: 'Structured · Robust · Scientific',
        accentColor: '#A855F7',
        useStaticPanel: true,
        gridId: null,
        chipClass: null,
        animIn: null,
        skills: []
    },
    {
        id: 'nlp',
        label: 'Natural Language Processing',
        tagline: 'Semantic · Linguistic · Dense',
        accentColor: '#34D399',
        useCanvas: true,        // ← drives scramble canvas, not chips
        gridId: null,
        chipClass: null,
        animIn: null,
        skills: []
    },
    {
        id: 'cloud',
        label: 'Cloud & MLOps',
        tagline: 'Scalable · Reliable · Production',
        accentColor: '#FBBF24',
        gridId: 'cloud-chip-grid',
        chipClass: 'chip-cloud',
        animIn: 'cloud-in',
        skills: ['AWS', 'Azure', 'Docker', 'FastAPI', 'PostgreSQL', 'GitHub Actions']
    }
];

const STAGE_COUNT = ARSENAL_DATA.length;
const STAGE_ANCHORS = ARSENAL_DATA.map((_, idx) =>
    STAGE_COUNT <= 1 ? 0 : idx / (STAGE_COUNT - 1)
);

// ── DOM Helpers ───────────────────────────────
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function lerp(a, b, t) { return a + (b - a) * t; }
function invLerp(a, b, v) { return clamp((v - a) / (b - a), 0, 1); }
const ARSENAL_MOBILE_BREAKPOINT = 768;
function isMobileViewport() { return window.innerWidth < ARSENAL_MOBILE_BREAKPOINT; }

// ── Build Chips for the animated stages ──────────────
function buildChips() {
    ARSENAL_DATA.forEach(cat => {
        if (cat.useStaticPanel) return;
        const grid = document.getElementById(cat.gridId);
        if (!grid) return;
        grid.innerHTML = cat.skills.map(skill => `
            <span class="skill-chip ${cat.chipClass}" data-skill="${skill}">
                ${skill}
            </span>
        `).join('');
    });
}

// ── GenAI: Neural Connector Canvas ───────────
let connectorRAF = null;
let connectorCanvas = null;
let connectorCtx   = null;
let connectorNodes = [];

function initConnectorCanvas() {
    connectorCanvas = document.getElementById('genai-connector-canvas');
    if (!connectorCanvas) return;
    connectorCtx = connectorCanvas.getContext('2d');
    sizeConnectorCanvas();
}

function sizeConnectorCanvas() {
    if (!connectorCanvas) return;
    const parent = connectorCanvas.parentElement;
    connectorCanvas.width  = parent.offsetWidth;
    connectorCanvas.height = parent.offsetHeight;
}

function buildConnectorNodes() {
    const chips = document.querySelectorAll('#genai-chip-grid .chip-genai');
    const canvas = connectorCanvas;
    if (!canvas || !chips.length) return;

    const rect = canvas.getBoundingClientRect();
    connectorNodes = Array.from(chips).map(chip => {
        const cr = chip.getBoundingClientRect();
        return {
            x: cr.left - rect.left + cr.width / 2,
            y: cr.top  - rect.top  + cr.height / 2,
            chip
        };
    });
}

function getPointOnBracket(d, n1, n2, midY) {
    if (d <= 0) return { x: n1.x, y: n1.y };
    const D1 = Math.abs(midY - n1.y);
    const D2 = Math.abs(n2.x - n1.x);
    const D3 = Math.abs(n2.y - midY);
    if (d <= D1) {
        return { x: n1.x, y: n1.y + (d / D1) * (midY - n1.y) };
    } else if (d <= D1 + D2) {
        return { x: n1.x + ((d - D1) / D2) * (n2.x - n1.x), y: midY };
    } else if (d <= D1 + D2 + D3) {
        return { x: n2.x, y: midY + ((d - D1 - D2) / D3) * (n2.y - midY) };
    } else {
        return { x: n2.x, y: n2.y };
    }
}

function drawConnectors(timestamp) {
    if (!connectorCtx || !connectorCanvas) return;
    const W = connectorCanvas.width, H = connectorCanvas.height;
    connectorCtx.clearRect(0, 0, W, H);

    if (!connectorNodes.length) buildConnectorNodes();
    if (connectorNodes.length < 2) return;

    const NUM_BEAMS = 2;
    for (let b = 0; b < NUM_BEAMS; b++) {
        const offsetTime = timestamp + b * 1800;
        const cycle = Math.floor(offsetTime / 3000);
        const pulsePhase = (offsetTime % 3000) / 3000;

        const seed = (cycle * 37 + b * 13);
        const idx1 = seed % connectorNodes.length;
        let idx2 = (seed * 7 + 11) % connectorNodes.length;
        if (idx1 === idx2) idx2 = (idx2 + 1) % connectorNodes.length;

        const n1 = connectorNodes[idx1];
        const n2 = connectorNodes[idx2];
        if (!n1 || !n2) continue;

        let midY;
        if (Math.abs(n1.y - n2.y) < 20) {
            midY = n1.y + (idx1 % 2 === 0 ? 35 : -35);
        } else {
            midY = (n1.y + n2.y) / 2;
        }

        const D1 = Math.abs(midY - n1.y);
        const D2 = Math.abs(n2.x - n1.x);
        const D3 = Math.abs(n2.y - midY);
        const totalL = D1 + D2 + D3;

        const tailLength = Math.min(totalL * 0.7, 250);
        const headD = pulsePhase * (totalL + tailLength);
        const tailD = headD - tailLength;

        const SEGMENTS = 30;
        const step = tailLength / SEGMENTS;
        for (let i = 0; i < SEGMENTS; i++) {
            const dStart = tailD + i * step;
            const dEnd = dStart + step * 1.05;

            const validDStart = Math.max(0, dStart);
            const validDEnd = Math.min(totalL, dEnd);
            if (validDStart >= validDEnd) continue;

            const alpha = Math.pow(i / SEGMENTS, 1.8) * 0.8;

            connectorCtx.beginPath();
            const startP = getPointOnBracket(validDStart, n1, n2, midY);
            connectorCtx.moveTo(startP.x, startP.y);

            if (validDStart < D1 && validDEnd > D1) connectorCtx.lineTo(n1.x, midY);
            if (validDStart < D1 + D2 && validDEnd > D1 + D2) connectorCtx.lineTo(n2.x, midY);

            const endP = getPointOnBracket(validDEnd, n1, n2, midY);
            connectorCtx.lineTo(endP.x, endP.y);

            connectorCtx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            connectorCtx.lineWidth = 1.8;
            connectorCtx.lineCap = 'round';
            connectorCtx.lineJoin = 'round';
            connectorCtx.stroke();
        }

        if (headD > 0 && headD < totalL) {
            const pHead = getPointOnBracket(headD, n1, n2, midY);

            connectorCtx.beginPath();
            connectorCtx.arc(pHead.x, pHead.y, 2, 0, Math.PI * 2);
            connectorCtx.fillStyle = '#FFFFFF';
            connectorCtx.shadowBlur = 10;
            connectorCtx.shadowColor = '#00F0FF';
            connectorCtx.fill();
            connectorCtx.shadowBlur = 0;

            connectorCtx.beginPath();
            connectorCtx.arc(pHead.x, pHead.y, 4, 0, Math.PI * 2);
            connectorCtx.fillStyle = 'rgba(0, 240, 255, 0.5)';
            connectorCtx.shadowBlur = 15;
            connectorCtx.shadowColor = '#00F0FF';
            connectorCtx.fill();
            connectorCtx.shadowBlur = 0;
        }
    }

    connectorRAF = requestAnimationFrame(drawConnectors);
}

function startConnectors() {
    if (connectorRAF) return;
    buildConnectorNodes();
    connectorRAF = requestAnimationFrame(drawConnectors);
}

function stopConnectors() {
    if (connectorRAF) cancelAnimationFrame(connectorRAF);
    connectorRAF = null;
    if (connectorCtx && connectorCanvas) {
        connectorCtx.clearRect(0, 0, connectorCanvas.width, connectorCanvas.height);
    }
}

// =============================================
//  NLP SCRAMBLE CANVAS
//  Character-scramble card animation from nlp-v4.
//  Accent: #34D399 (portfolio NLP green)
//  Font:   Inter (matches portfolio)
// =============================================

const NLP_ROWS = [
    { cat: 'Preprocessing & Redaction',   tools: ['spaCy', 'NLTK', 'Microsoft Presidio'] },
    { cat: 'Embedding Models (Dense)',     tools: ['text-embedding-3-large', 'Sentence-Transformers', 'BERT', 'Word2Vec'] },
    { cat: 'Embedding Models (Sparse)',    tools: ['TF-IDF / CountVectorizer', 'rank-bm25'] },
    { cat: 'Vector Storage & Retrieval',   tools: ['Milvus', 'PostgreSQL (pgvector)'] },
];

// Layout constants (unchanged from template)
const NLP_PAD_L      = 36;
const NLP_PAD_T      = 40;
const NLP_PAD_B      = 40;
const NLP_CHAR_W     = 7.8;   // slightly wider — Inter is wider than JetBrains Mono
const NLP_FS         = 13;    // font size that is actually readable
const NLP_CARD_PX    = 14;
const NLP_CARD_PY    = 10;
const NLP_CARD_H     = NLP_FS + NLP_CARD_PY * 2;
const NLP_CARD_GAP   = 12;
const NLP_CAT_H      = 18;
const NLP_CAT_MARGIN = 14;
const NLP_BLOCK_GAP  = 32;

const NLP_C  = '#34D399';
const NLP_ca = a => `rgba(52,211,153,${a})`;
const NLP_wa = a => `rgba(255,255,255,${a})`;
const NLP_POOL = '0123456789.-+019823.5-17. ';
const nlpRndChar = () => NLP_POOL[Math.floor(Math.random() * NLP_POOL.length)];
const nlpEaseIO  = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

const NLP_W = 1100;
const NLP_DPR = Math.min(window.devicePixelRatio || 1, 2);

let nlpRowMaxLen = [];
let nlpRowCardW  = [];
let nlpBlockYs   = [];
let nlpBlockGapCurrent = NLP_BLOCK_GAP;
let nlpCanvasLogicalH = 0;

// Animation timing
const NLP_CARD_CYCLE  = 6200;
const NLP_PH_SCRAM    = 950;
const NLP_CHAR_SET_D  = 42;
const NLP_HOLD_DUR    = 2000;
const NLP_CHAR_UNSET  = 32;
const NLP_STAGGER     = 300;
const NLP_MOBILE_PAIR_SIZE = 2;
const NLP_MOBILE_HOLD_MS = 5000;
const NLP_MOBILE_FALL_MS = 900;

// State
let nlpCanvas   = null;
let nlpCtx      = null;
let nlpCards    = [];
let nlpRAF      = null;
let nlpActive   = false;
let nlpT0       = null;
let nlpMobileCycleEl = null;
let nlpMobileCycleTimer = null;
let nlpMobileCycleRunning = false;
let nlpMobilePairIdx = 0;
let nlpMobileScrambleTimers = [];

function rebuildNLPLayout() {
    nlpBlockGapCurrent = isMobileViewport() ? (NLP_BLOCK_GAP + 16) : NLP_BLOCK_GAP;
    nlpRowMaxLen = NLP_ROWS.map(row => Math.max(...row.tools.map(t => t.length)));
    nlpRowCardW  = nlpRowMaxLen.map(ml => Math.ceil(ml * NLP_CHAR_W) + NLP_CARD_PX * 2);

    nlpBlockYs = [];
    let cy = NLP_PAD_T;
    NLP_ROWS.forEach(() => {
        nlpBlockYs.push(cy);
        cy += NLP_CAT_H + NLP_CAT_MARGIN + NLP_CARD_H + nlpBlockGapCurrent;
    });
    nlpCanvasLogicalH = nlpBlockYs[nlpBlockYs.length - 1] + NLP_CAT_H + NLP_CAT_MARGIN + NLP_CARD_H + NLP_PAD_B;
}

function sizeNLPCanvasForViewport() {
    if (!nlpCanvas || !nlpCtx) return;

    rebuildNLPLayout();
    nlpCanvas.width  = NLP_W * NLP_DPR;
    nlpCanvas.height = nlpCanvasLogicalH * NLP_DPR;

    if (isMobileViewport()) {
        nlpCanvas.style.width = '100%';
        nlpCanvas.style.height = 'auto';
    } else {
        nlpCanvas.style.width = NLP_W + 'px';
        nlpCanvas.style.height = nlpCanvasLogicalH + 'px';
    }

    nlpCtx.setTransform(NLP_DPR, 0, 0, NLP_DPR, 0, 0);
    nlpBuildCards();
}

function initNLPMobileCycle() {
    nlpMobileCycleEl = document.getElementById('nlp-mobile-cycle');
}

function stopNLPMobileCycleTimer() {
    if (nlpMobileCycleTimer) {
        clearTimeout(nlpMobileCycleTimer);
        nlpMobileCycleTimer = null;
    }
}

function clearNLPMobileScrambleTimers() {
    nlpMobileScrambleTimers.forEach(id => clearTimeout(id));
    nlpMobileScrambleTimers = [];
}

function nlpEscapeHTML(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function nlpMobileRndChar() {
    return NLP_POOL[Math.floor(Math.random() * NLP_POOL.length)];
}

function nlpMobileCharHTML(ch, className = '') {
    if (ch === ' ') return `<span class="nlp-mobile-char${className ? ` ${className}` : ''}">&nbsp;</span>`;
    return `<span class="nlp-mobile-char${className ? ` ${className}` : ''}">${nlpEscapeHTML(ch)}</span>`;
}

function nlpRenderMobilePillText(pill, finalText, settledCount = 0, glowIdx = -1) {
    const textEl = pill.querySelector('.nlp-mobile-pill-text');
    if (!textEl) return;

    const html = Array.from(finalText || '').map((ch, idx) => {
        if (idx < settledCount) {
            const settledClass = idx === glowIdx ? 'settled glow' : 'settled';
            return nlpMobileCharHTML(ch, settledClass);
        }
        return nlpMobileCharHTML(nlpMobileRndChar());
    }).join('');

    textEl.innerHTML = html;
}

function nlpNumberTokenFromText(text) {
    const sizeHint = (text || '').length;
    const count = Math.max(4, Math.min(9, Math.round(sizeHint / 6) + 2));
    const values = Array.from({ length: count }, () => {
        const v = (Math.random() * 2) - 1; // [-1, 1]
        return v.toFixed(2);
    });
    return `[${values.join(', ')}]`;
}

function nlpMobilePairCount() {
    return Math.max(1, Math.ceil(NLP_ROWS.length / NLP_MOBILE_PAIR_SIZE));
}

function nlpGetMobilePair(pairIdx) {
    const count = nlpMobilePairCount();
    const safePair = ((pairIdx % count) + count) % count;
    const start = safePair * NLP_MOBILE_PAIR_SIZE;
    return NLP_ROWS.slice(start, start + NLP_MOBILE_PAIR_SIZE);
}

function renderNLPMobilePair(pairIdx) {
    if (!nlpMobileCycleEl) return;
    clearNLPMobileScrambleTimers();

    const rows = nlpGetMobilePair(pairIdx);
    const html = rows.map((row) => {
        const toolsHtml = row.tools.map((tool) => {
            const escapedFinal = nlpEscapeHTML(tool);
            return `<span class="nlp-mobile-pill is-scrambling" data-final-text="${escapedFinal}"><span class="nlp-mobile-pill-text" aria-hidden="true"></span></span>`;
        }).join('');
        return `
            <div class="nlp-mobile-group">
                <div class="nlp-mobile-cat-wrap">
                    <p class="nlp-mobile-cat-title">${nlpEscapeHTML(row.cat)}</p>
                    <span class="nlp-mobile-cat-line" aria-hidden="true"></span>
                </div>
                <div class="nlp-mobile-pill-stack">${toolsHtml}</div>
            </div>
        `;
    }).join('');

    nlpMobileCycleEl.innerHTML = html;
    requestAnimationFrame(() => {
        nlpMobileCycleEl?.querySelectorAll('.nlp-mobile-group').forEach((group) => {
            group.classList.add('in-view');
        });
        nlpMobileCycleEl?.querySelectorAll('.nlp-mobile-pill').forEach((pill) => {
            pill.classList.add('in-view');
        });
        runNLPMobilePillScrambleReveal();
    });
}

function runNLPMobilePillScrambleReveal() {
    if (!nlpMobileCycleEl) return;
    const pills = Array.from(nlpMobileCycleEl.querySelectorAll('.nlp-mobile-pill'));

    pills.forEach((pill, idx) => {
        const finalText = pill.getAttribute('data-final-text') || pill.textContent || '';
        const charCount = finalText.length;
        const startDelay = idx * NLP_STAGGER;
        const scrambleStartId = setTimeout(() => {
            pill.classList.add('is-scrambling');
            pill.classList.remove('is-settling', 'is-settled');
            nlpRenderMobilePillText(pill, finalText, 0);

            const scrambleUntil = performance.now() + NLP_PH_SCRAM;
            const scrambleTick = () => {
                if (!nlpMobileCycleRunning) return;
                if (performance.now() >= scrambleUntil) return;
                nlpRenderMobilePillText(pill, finalText, 0);
                const nextId = setTimeout(scrambleTick, NLP_CHAR_SET_D);
                nlpMobileScrambleTimers.push(nextId);
            };
            scrambleTick();

            Array.from(finalText).forEach((_, charIdx) => {
                const settleId = setTimeout(() => {
                    if (!nlpMobileCycleRunning) return;
                    const settledCount = charIdx + 1;
                    pill.classList.add('is-settling');
                    nlpRenderMobilePillText(pill, finalText, settledCount, charIdx);
                    if (settledCount >= charCount) {
                        pill.classList.remove('is-scrambling', 'is-settling');
                        pill.classList.add('is-settled');
                    }
                }, NLP_PH_SCRAM + (charIdx * NLP_CHAR_SET_D));
                nlpMobileScrambleTimers.push(settleId);
            });
        }, startDelay);

        nlpMobileScrambleTimers.push(scrambleStartId);
    });
}

function triggerNLPMobileFallAndNext() {
    if (!nlpMobileCycleRunning || !nlpMobileCycleEl) return;

    const titles = Array.from(nlpMobileCycleEl.querySelectorAll('.nlp-mobile-cat-title'));
    const lines = Array.from(nlpMobileCycleEl.querySelectorAll('.nlp-mobile-cat-line'));
    const pills = Array.from(nlpMobileCycleEl.querySelectorAll('.nlp-mobile-pill'));
    titles.forEach((title, idx) => {
        title.textContent = nlpNumberTokenFromText(title.textContent || '');
        title.style.animationDelay = `${idx * 55}ms`;
        title.classList.add('number-fall');
    });
    lines.forEach((line, idx) => {
        line.style.animationDelay = `${idx * 55}ms`;
        line.classList.add('line-fall');
    });
    pills.forEach((pill, idx) => {
        pill.textContent = nlpNumberTokenFromText(pill.textContent || '');
        pill.style.animationDelay = `${(Math.max(titles.length, lines.length) * 55) + idx * 45}ms`;
        pill.classList.add('number-fall');
    });

    const cycleDelay = NLP_MOBILE_FALL_MS + Math.max(titles.length, lines.length) * 55 + pills.length * 45 + 120;
    stopNLPMobileCycleTimer();
    nlpMobileCycleTimer = setTimeout(() => {
        if (!nlpMobileCycleRunning) return;
        nlpMobilePairIdx = (nlpMobilePairIdx + 1) % nlpMobilePairCount();
        runNLPMobileCycleStep();
    }, cycleDelay);
}

function runNLPMobileCycleStep() {
    if (!nlpMobileCycleRunning || !nlpMobileCycleEl) return;
    renderNLPMobilePair(nlpMobilePairIdx);
    stopNLPMobileCycleTimer();
    nlpMobileCycleTimer = setTimeout(() => {
        triggerNLPMobileFallAndNext();
    }, NLP_MOBILE_HOLD_MS);
}

function startNLPMobileCycle() {
    if (!nlpMobileCycleEl) return;
    stopNLPCanvas();
    clearNLPMobileScrambleTimers();
    nlpMobileCycleRunning = true;
    nlpMobilePairIdx = 0;
    runNLPMobileCycleStep();
}

function stopNLPMobileCycle() {
    nlpMobileCycleRunning = false;
    stopNLPMobileCycleTimer();
    clearNLPMobileScrambleTimers();
    if (nlpMobileCycleEl) nlpMobileCycleEl.innerHTML = '';
}

function nlpBuildCards() {
    nlpCards = [];
    let globalIdx = 0;
    NLP_ROWS.forEach((row, ri) => {
        const toolsY = nlpBlockYs[ri] + NLP_CAT_H + NLP_CAT_MARGIN;
        const cw     = nlpRowCardW[ri];
        const ml     = nlpRowMaxLen[ri];

        row.tools.forEach((tool, ti) => {
            const cardX = NLP_PAD_L + ti * (cw + NLP_CARD_GAP);
            const chars = Array.from({ length: ml }, (_, ci) => ({
                final: ci < tool.length ? tool[ci] : null,
                cur:   nlpRndChar(),
                phase: 'scramble',
                glowT: 0,
            }));
            const n = ml;
            const card = {
                gIdx: globalIdx++,
                ri, ti, tool,
                x: cardX, y: toolsY, w: cw, h: NLP_CARD_H,
                chars, maxLen: ml,
                cycleOffset: globalIdx * NLP_STAGGER,
                settleStart: NLP_PH_SCRAM,
                settleEnd:   NLP_PH_SCRAM + n * NLP_CHAR_SET_D,
                holdEnd:     NLP_PH_SCRAM + n * NLP_CHAR_SET_D + NLP_HOLD_DUR,
                unsetEnd:    NLP_PH_SCRAM + n * NLP_CHAR_SET_D + NLP_HOLD_DUR + tool.length * NLP_CHAR_UNSET,
            };
            nlpCards.push(card);
        });
    });
}

function nlpRrFill(x, y, w, h, r, style, a) {
    if (a <= 0) return;
    nlpCtx.save(); nlpCtx.globalAlpha = a; nlpCtx.fillStyle = style;
    nlpCtx.beginPath(); nlpCtx.roundRect(x, y, w, h, r); nlpCtx.fill(); nlpCtx.restore();
}
function nlpRrStroke(x, y, w, h, r, style, a, lw) {
    if (a <= 0) return;
    nlpCtx.save(); nlpCtx.globalAlpha = a; nlpCtx.strokeStyle = style; nlpCtx.lineWidth = lw;
    nlpCtx.beginPath(); nlpCtx.roundRect(x, y, w, h, r); nlpCtx.stroke(); nlpCtx.restore();
}
function nlpSeg(x1, y1, x2, y2, style, a, lw) {
    if (a <= 0) return;
    nlpCtx.save(); nlpCtx.globalAlpha = a; nlpCtx.strokeStyle = style;
    nlpCtx.lineWidth = lw; nlpCtx.lineCap = 'round';
    nlpCtx.beginPath(); nlpCtx.moveTo(x1,y1); nlpCtx.lineTo(x2,y2); nlpCtx.stroke(); nlpCtx.restore();
}
function nlpGlowAt(x, y, r, a) {
    if (a <= 0) return;
    const g = nlpCtx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, NLP_ca(a)); g.addColorStop(1,'rgba(0,0,0,0)');
    nlpCtx.fillStyle = g; nlpCtx.beginPath(); nlpCtx.arc(x,y,r,0,Math.PI*2); nlpCtx.fill();
}
function nlpCharAt(ch, x, y, color, a) {
    if (!ch || a <= 0) return;
    nlpCtx.save();
    nlpCtx.globalAlpha = a; nlpCtx.fillStyle = color;
    // Use Inter — matches portfolio; weight 500 for legibility
    nlpCtx.font = `500 ${NLP_FS}px 'Inter', sans-serif`;
    nlpCtx.textAlign = 'center'; nlpCtx.textBaseline = 'middle';
    nlpCtx.fillText(ch, x, y); nlpCtx.restore();
}

function nlpDrawCard(card) {
    const toolLen    = card.tool.length;
    const allSettled = card.chars.slice(0, toolLen).every(c => c.phase === 'settled');
    const anySettled = card.chars.some(c => c.phase === 'settled');

    nlpRrFill  (card.x, card.y, card.w, card.h, 5, NLP_ca(1), allSettled ? 0.07 : 0.025);
    nlpRrStroke(card.x, card.y, card.w, card.h, 5, NLP_C,
                allSettled ? 0.45 : anySettled ? 0.22 : 0.09, 0.8);

    if (allSettled) nlpGlowAt(card.x + card.w/2, card.y + card.h/2, card.w * 0.6, 0.04);

    const ty = card.y + card.h / 2;
    card.chars.forEach((ch, ci) => {
        const cx    = card.x + NLP_CARD_PX + ci * NLP_CHAR_W + NLP_CHAR_W / 2;
        const isPad = ch.final === null;

        if (ch.glowT > 0) {
            const gt = nlpEaseIO(ch.glowT / 22);
            nlpGlowAt(cx, ty, 10, gt * 0.5);
            nlpCharAt(ch.cur, cx, ty, NLP_C, 0.7 + gt * 0.3);
            ch.glowT--;
        } else if (ch.phase === 'settled') {
            if (!isPad) nlpCharAt(ch.cur, cx, ty, '#ffffff', 0.92);
        } else if (ch.phase === 'scramble') {
            const dimA = isPad ? (allSettled ? 0 : 0.28) : 0.52;
            nlpCharAt(ch.cur, cx, ty, NLP_ca(dimA), dimA);
        }
    });
}

function nlpFrame(ts) {
    if (!nlpActive) return;
    if (!nlpT0) nlpT0 = ts;
    const now = ts - nlpT0;

    nlpCtx.clearRect(0, 0, NLP_W, nlpCanvasLogicalH);

    // Update char states
    nlpCards.forEach(card => {
        const raw = now - card.cycleOffset;
        if (raw < 0) return;
        const el = raw % NLP_CARD_CYCLE;

        card.chars.forEach((ch, ci) => {
            const isPad       = ch.final === null;
            const charSetAt   = card.settleStart + ci * NLP_CHAR_SET_D;
            const charUnsetAt = card.holdEnd + (isPad ? 0 : ci * NLP_CHAR_UNSET);

            if (el < card.settleStart) {
                ch.phase = 'scramble';
                if (Math.random() < 0.09) ch.cur = nlpRndChar();
            } else if (el < card.settleEnd) {
                if (el >= charSetAt && ch.phase === 'scramble') {
                    ch.phase = 'settled'; ch.cur = isPad ? '' : ch.final;
                    if (!isPad) ch.glowT = 22;
                } else if (ch.phase === 'scramble') {
                    if (Math.random() < 0.09) ch.cur = nlpRndChar();
                }
            } else if (el < card.holdEnd) {
                if (ch.phase !== 'settled') { ch.phase = 'settled'; ch.cur = isPad ? '' : ch.final; }
            } else if (el < card.unsetEnd) {
                if (!isPad && el >= charUnsetAt && ch.phase === 'settled') {
                    ch.phase = 'scramble'; ch.cur = nlpRndChar();
                }
                if (ch.phase === 'scramble' && Math.random() < 0.09) ch.cur = nlpRndChar();
            } else {
                if (ch.phase === 'settled') { ch.phase = 'scramble'; ch.cur = nlpRndChar(); }
                if (Math.random() < 0.09) ch.cur = nlpRndChar();
            }
        });
    });

    // Draw cards
    nlpCards.forEach(nlpDrawCard);

    // Draw category headers
    NLP_ROWS.forEach((row, ri) => {
        const by = nlpBlockYs[ri];
        const ty = by + NLP_CAT_H / 2;

        // Green pip
        nlpCtx.save();
        nlpCtx.globalAlpha = 0.7;
        nlpCtx.fillStyle   = NLP_C;
        nlpCtx.beginPath(); nlpCtx.arc(NLP_PAD_L - 14, ty, 3, 0, Math.PI*2); nlpCtx.fill();
        nlpCtx.restore();

        // Category label — Inter 500, 14px, very readable
        nlpCtx.save();
        nlpCtx.globalAlpha  = 0.85;
        nlpCtx.font         = `500 14px 'Inter', sans-serif`;
        nlpCtx.fillStyle    = '#cccccc';
        nlpCtx.textAlign    = 'left';
        nlpCtx.textBaseline = 'middle';
        nlpCtx.fillText(row.cat, NLP_PAD_L, ty);
        nlpCtx.restore();

        // Hairline under category
        const nT     = row.tools.length;
        const totalW = nT * nlpRowCardW[ri] + (nT - 1) * NLP_CARD_GAP;
        nlpSeg(NLP_PAD_L, by + NLP_CAT_H + 5, NLP_PAD_L + totalW, by + NLP_CAT_H + 5, NLP_C, 0.12, 0.5);

        // Section separator
        if (ri < NLP_ROWS.length - 1) {
            const sepY = by + NLP_CAT_H + NLP_CAT_MARGIN + NLP_CARD_H + nlpBlockGapCurrent / 2;
            nlpSeg(NLP_PAD_L - 20, sepY, NLP_W - 36, sepY, NLP_wa(1), 0.025, 0.5);
        }
    });

    nlpRAF = requestAnimationFrame(nlpFrame);
}

function initNLPCanvas() {
    nlpCanvas = document.getElementById('nlp-scramble-canvas');
    if (!nlpCanvas) return;
    nlpCtx = nlpCanvas.getContext('2d');
    sizeNLPCanvasForViewport();
}

function startNLPCanvas() {
    stopNLPMobileCycle();
    if (nlpRAF) return;
    nlpActive = true;
    nlpT0     = null;
    // Reset all chars to scramble state
    nlpCards.forEach(card => {
        card.chars.forEach(ch => { ch.phase = 'scramble'; ch.cur = nlpRndChar(); ch.glowT = 0; });
    });
    document.fonts.ready.then(() => {
        nlpRAF = requestAnimationFrame(nlpFrame);
    });
}

function stopNLPCanvas() {
    nlpActive = false;
    if (nlpRAF) { cancelAnimationFrame(nlpRAF); nlpRAF = null; }
    nlpT0 = null;
    if (nlpCtx && nlpCanvas) {
        nlpCtx.clearRect(0, 0, NLP_W, nlpCanvasLogicalH);
    }
}

// ── Animation Helpers ─────────────────────────

let nlpWaveInterval     = null;
let cloudHeartbeatTimeout = null;
let cloudSyncTimeout    = null;

function retriggerAnimationClass(chip, className) {
    chip.classList.remove(className);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => chip.classList.add(className));
    });
}

// ── Animate Chips In ─────────────────────────
function animateChipsIn(stageData, onDone) {
    if (stageData.useStaticPanel) {
        if (onDone) onDone();
        return;
    }
    // NLP uses the scramble canvas.
    if (stageData.useCanvas) {
        if (isMobileViewport()) startNLPMobileCycle();
        else startNLPCanvas();
        if (onDone) setTimeout(onDone, 200);
        return;
    }

    const chips = Array.from(
        document.querySelectorAll(`#${stageData.id}-chip-grid .${stageData.chipClass}`)
    );
    if (!chips.length) { if (onDone) onDone(); return; }

    // ── GenAI: stagger fade-up + cyan glow border ──────────────
    if (stageData.id === 'genai') {
        chips.forEach((chip, i) => {
            setTimeout(() => {
                chip.classList.add('genai-in');
                if (i === chips.length - 1) {
                    setTimeout(() => {
                        chips.forEach(c => c.classList.add('genai-glow'));
                        if (onDone) onDone();
                    }, 450);
                }
            }, 60 + i * 75);
        });
    }

    // ── Cloud: sequential boot-flicker, opacity locked by animationend ──
    else if (stageData.id === 'cloud') {
        let booted = 0;
        chips.forEach((chip, i) => {
            setTimeout(() => {
                chip.classList.add('cloud-booting');
                chip.addEventListener('animationend', () => {
                    chip.style.opacity = '1';
                    chip.classList.remove('cloud-booting');
                    booted++;
                    if (booted === chips.length) {
                        cloudHeartbeatTimeout = setTimeout(() => {
                            chips.forEach(c => c.classList.add('cloud-idle'));
                            startCloudSync(chips);
                        }, 600);
                        if (onDone) onDone();
                    }
                }, { once: true });
            }, 80 + i * 180);
        });
    }

    else {
        chips.forEach((chip, i) => {
            setTimeout(() => chip.classList.add(stageData.animIn), 60 + i * 80);
        });
        if (onDone) setTimeout(onDone, 60 + chips.length * 80 + 200);
    }
}

// (NLP wave replaced by canvas scramble engine above)

let cloudSyncStopped = false;
function startCloudSync(chips) {
    if (cloudSyncTimeout) return;
    cloudSyncStopped = false;
    let idx = 0;
    function triggerSync() {
        if (cloudSyncStopped) return;
        const chip = chips[idx % chips.length];
        retriggerAnimationClass(chip, 'cloud-sync');
        idx++;
        cloudSyncTimeout = setTimeout(triggerSync, 430);
    }
    cloudSyncTimeout = setTimeout(triggerSync, 320);
}

function stopCloudSync() {
    cloudSyncStopped = true;
    if (cloudSyncTimeout) { clearTimeout(cloudSyncTimeout); cloudSyncTimeout = null; }
}

// ── Animation Cleanup ─────────────────────────
function animateChipsOut(stageData) {
    if (stageData.useStaticPanel) return;
    // NLP uses the scramble canvas
    if (stageData.useCanvas) {
        stopNLPCanvas();
        stopNLPMobileCycle();
        return;
    }

    const chips = Array.from(
        document.querySelectorAll(`#${stageData.id}-chip-grid .${stageData.chipClass}`)
    );
    chips.forEach(chip => {
        chip.classList.remove(stageData.animIn, 'genai-glow',
                              'cloud-booting', 'cloud-idle', 'cloud-sync');
        if (stageData.id === 'cloud') chip.style.opacity = '';
    });
    if (stageData.id === 'cloud') {
        if (cloudHeartbeatTimeout) { clearTimeout(cloudHeartbeatTimeout); cloudHeartbeatTimeout = null; }
        stopCloudSync();
    }
}

// ── Scroll Engine ─────────────────────────────
let currentStage   = -1;
let stageAnimated  = ARSENAL_DATA.map(() => false);
let lastIsMobileViewport = isMobileViewport();
let lastScrollY = window.scrollY;
let lastGestureDirection = 1;
let transitionLockUntil = 0;
let programmaticScrollTimer = null;
let touchStartY = null;
let touchCaptured = false;

const STAGE_TRANSITION_LOCK_MS = 420;
const WHEEL_MOMENTUM_THRESHOLD = 140;
const TOUCH_CAPTURE_THRESHOLD = 24;
const TOUCH_MOMENTUM_THRESHOLD = 110;
const ARSENAL_ACTIVATION_TOP_THRESHOLD = 120;

function isTransitionLocked() {
    return performance.now() < transitionLockUntil;
}

function lockTransitions() {
    transitionLockUntil = performance.now() + STAGE_TRANSITION_LOCK_MS;
}

function setProgrammaticScrollActive() {
    if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
    programmaticScrollTimer = setTimeout(() => {
        programmaticScrollTimer = null;
    }, STAGE_TRANSITION_LOCK_MS + 140);
}

function isProgrammaticScrollActive() {
    return programmaticScrollTimer !== null;
}

function getArsenalMetrics() {
    const section = document.getElementById('arsenal');
    if (!section) return null;

    const rect = section.getBoundingClientRect();
    const sectionScrollRoom = section.offsetHeight - window.innerHeight;
    return { section, rect, sectionScrollRoom };
}

function isArsenalInControl(metrics = getArsenalMetrics()) {
    if (!metrics || metrics.sectionScrollRoom <= 0) return false;
    return metrics.rect.top <= 0 && metrics.rect.bottom >= window.innerHeight;
}

function isArsenalGestureActive(metrics = getArsenalMetrics()) {
    if (!metrics || metrics.sectionScrollRoom <= 0) return false;
    return metrics.rect.top <= ARSENAL_ACTIVATION_TOP_THRESHOLD
        && metrics.rect.bottom >= (window.innerHeight * 0.6);
}

function isArsenalHintVisible(metrics = getArsenalMetrics()) {
    if (!metrics || currentStage < 0) return false;
    return isArsenalGestureActive(metrics);
}

function getScrollProgress() {
    const metrics = getArsenalMetrics();
    if (!metrics || metrics.sectionScrollRoom <= 0) return 0;
    const scrolled = -metrics.rect.top;
    return clamp(scrolled / metrics.sectionScrollRoom, 0, 1);
}

function progressToStage(progress) {
    if (STAGE_COUNT <= 1) return 0;
    return clamp(Math.round(progress * (STAGE_COUNT - 1)), 0, STAGE_COUNT - 1);
}

function stageToProgress(stageIdx) {
    const idx = clamp(stageIdx, 0, STAGE_COUNT - 1);
    return STAGE_ANCHORS[idx] ?? 0;
}

const ACCENTS = ARSENAL_DATA.map(d => d.accentColor);

function setAccentColor(color) {
    document.documentElement.style.setProperty('--arsenal-accent', color);
}

function updateProgressIndicator(activeStage) {
    const fill = document.getElementById('arsenal-progress-fill');
    if (fill) {
        const fillPercent = stageToProgress(activeStage) * 100;
        fill.style.height = `${fillPercent.toFixed(1)}%`;
    }

    for (let i = 0; i < STAGE_COUNT; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (!dot) continue;
        dot.classList.toggle('dot-active', i === activeStage);
    }
}

function updateScrollHint(stageIdx, direction, isVisible) {
    const hint = document.getElementById('arsenal-scroll-hint');
    if (!hint) return;

    hint.classList.toggle('is-hidden', !isVisible);
    if (!isVisible) return;

    const finalStage = STAGE_COUNT - 1;
    let dir = 'down';
    if (stageIdx === 0) dir = 'down';
    else if (stageIdx === finalStage) dir = 'up';
    else dir = direction < 0 ? 'up' : 'down';

    hint.dataset.direction = dir;
    hint.classList.toggle('hint-down', dir === 'down');
    hint.classList.toggle('hint-up', dir === 'up');

    const arrows = hint.querySelectorAll('[data-hint-arrow]');
    arrows.forEach((arrow) => {
        arrow.textContent = dir === 'up' ? 'Ʌ' : 'V';
    });
}

function scrollToStageAnchor(stageIdx) {
    const metrics = getArsenalMetrics();
    if (!metrics || metrics.sectionScrollRoom <= 0) return;

    const targetProgress = stageToProgress(stageIdx);
    const targetTop = window.scrollY + metrics.rect.top + (metrics.sectionScrollRoom * targetProgress);
    setProgrammaticScrollActive();
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
}

function isBoundaryReleaseDirection(direction) {
    if (direction < 0 && currentStage <= 0) return true;
    if (direction > 0 && currentStage >= STAGE_COUNT - 1) return true;
    return false;
}

function momentumStepsFromDelta(delta, threshold) {
    return Math.abs(delta) >= threshold ? 2 : 1;
}

function resetStageAnimations() {
    ARSENAL_DATA.forEach((cat, idx) => {
        if (!stageAnimated[idx]) return;
        animateChipsOut(cat);
        stageAnimated[idx] = false;
    });
}

function applyActiveStage(stageIdx, opts = {}) {
    const options = {
        direction: lastGestureDirection,
        shouldLock: false,
        shouldScrollToAnchor: false,
        force: false,
        ...opts
    };

    const nextStage = clamp(stageIdx, 0, STAGE_COUNT - 1);
    if (options.direction !== 0) {
        lastGestureDirection = options.direction > 0 ? 1 : -1;
    }

    const stageChanged = nextStage !== currentStage;
    if (!stageChanged && !options.force) {
        updateProgressIndicator(nextStage);
        updateScrollHint(nextStage, lastGestureDirection, isArsenalHintVisible());
        return;
    }

    if (options.shouldLock) lockTransitions();
    currentStage = nextStage;

    setAccentColor(ACCENTS[nextStage]);
    updateProgressIndicator(nextStage);

    ARSENAL_DATA.forEach((cat, idx) => {
        const stageEl = document.getElementById(`stage-${cat.id}`);
        const isActive = idx === nextStage;
        if (stageEl) {
            stageEl.classList.toggle('as-visible', isActive);
            stageEl.style.opacity = isActive ? '1' : '0';
        }

        if (!isActive && stageAnimated[idx]) {
            animateChipsOut(cat);
            stageAnimated[idx] = false;
        }
    });

    if (!stageAnimated[nextStage]) {
        stageAnimated[nextStage] = true;
        animateChipsIn(ARSENAL_DATA[nextStage], () => {
            if (nextStage === 0) startConnectors();
        });
    }

    if (options.shouldScrollToAnchor) {
        scrollToStageAnchor(nextStage);
    }

    updateScrollHint(nextStage, lastGestureDirection, isArsenalHintVisible());
}

function navigateByDelta(delta, source) {
    if (delta === 0) return false;
    if (currentStage < 0) {
        currentStage = progressToStage(getScrollProgress());
    }

    const direction = delta > 0 ? 1 : -1;
    if (isBoundaryReleaseDirection(direction)) return false;

    const threshold = source === 'touch'
        ? TOUCH_MOMENTUM_THRESHOLD
        : WHEEL_MOMENTUM_THRESHOLD;
    const steps = momentumStepsFromDelta(delta, threshold);
    const targetStage = clamp(currentStage + (direction * steps), 0, STAGE_COUNT - 1);
    if (targetStage === currentStage) return false;

    applyActiveStage(targetStage, {
        direction,
        shouldLock: true,
        shouldScrollToAnchor: true
    });
    return true;
}

function canScrollArsenalPanel(target, delta) {
    const panel = target instanceof Element ? target.closest('.genai-explorer, .ml-skills-panel') : null;
    if (!panel) return false;
    if (panel.matches('.ml-skills-panel')) {
        if (currentStage !== 1) return false;
    } else if (currentStage !== 0) {
        return false;
    }
    const remaining = panel.scrollHeight - panel.clientHeight;
    if (remaining < 2) return false;
    return delta > 0 ? panel.scrollTop < remaining - 1 : panel.scrollTop > 1;
}

function onArsenalWheel(e) {
    if (!isArsenalGestureActive()) {
        if (currentStage >= 0) updateScrollHint(currentStage, lastGestureDirection, false);
        return;
    }

    if (canScrollArsenalPanel(e.target, e.deltaY)) return;
    if (Math.abs(e.deltaY) < 8) return;
    const direction = e.deltaY > 0 ? 1 : -1;

    if (isTransitionLocked()) {
        if (isBoundaryReleaseDirection(direction)) return;
        e.preventDefault();
        return;
    }

    const consumed = navigateByDelta(e.deltaY, 'wheel');
    if (consumed) e.preventDefault();
}

function onArsenalTouchStart(e) {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
    touchCaptured = false;
}

function onArsenalTouchMove(e) {
    if (touchStartY === null || !e.touches || e.touches.length !== 1) return;
    if (!isArsenalGestureActive()) return;

    const currentY = e.touches[0].clientY;
    const delta = touchStartY - currentY;
    if (canScrollArsenalPanel(e.target, delta)) return;
    if (!touchCaptured && Math.abs(delta) < TOUCH_CAPTURE_THRESHOLD) return;

    const direction = delta > 0 ? 1 : -1;
    if (isTransitionLocked()) {
        if (isBoundaryReleaseDirection(direction)) return;
        e.preventDefault();
        touchCaptured = true;
        return;
    }

    if (!touchCaptured) {
        const consumed = navigateByDelta(delta, 'touch');
        if (consumed) {
            e.preventDefault();
            touchCaptured = true;
        }
        return;
    }

    e.preventDefault();
}

function onArsenalTouchEnd() {
    touchStartY = null;
    touchCaptured = false;
}

function onScrollTick(force = false) {
    const isMobile = isMobileViewport();
    if (isMobile !== lastIsMobileViewport) {
        resetStageAnimations();
        currentStage = -1;
        lastIsMobileViewport = isMobile;
    }

    const scrollDelta = window.scrollY - lastScrollY;
    if (Math.abs(scrollDelta) > 0.5) {
        lastGestureDirection = scrollDelta > 0 ? 1 : -1;
    }
    lastScrollY = window.scrollY;

    const stageFromScroll = progressToStage(getScrollProgress());
    if (force || currentStage < 0) {
        applyActiveStage(stageFromScroll, { force: true });
        return;
    }

    if (!isTransitionLocked() && !isProgrammaticScrollActive() && stageFromScroll !== currentStage) {
        applyActiveStage(stageFromScroll, { direction: lastGestureDirection });
        return;
    }

    updateProgressIndicator(currentStage);
    updateScrollHint(currentStage, lastGestureDirection, isArsenalHintVisible());
}

// ── Init ──────────────────────────────────────
function initArsenal() {
    buildChips();
    initConnectorCanvas();
    initNLPCanvas();
    initNLPMobileCycle();

    window.addEventListener('scroll', () => onScrollTick(false), { passive: true });
    window.addEventListener('wheel', onArsenalWheel, { passive: false });
    window.addEventListener('touchstart', onArsenalTouchStart, { passive: true });
    window.addEventListener('touchmove', onArsenalTouchMove, { passive: false });
    window.addEventListener('touchend', onArsenalTouchEnd, { passive: true });
    window.addEventListener('resize', () => {
        sizeConnectorCanvas();
        buildConnectorNodes();
        sizeNLPCanvasForViewport();
        if (nlpMobileCycleRunning && isMobileViewport()) {
            runNLPMobileCycleStep();
        }
        onScrollTick(true);
    });

    onScrollTick(true);

    const section = document.getElementById('arsenal');
    if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 0) {
            onScrollTick(true);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArsenal);
} else {
    initArsenal();
}
