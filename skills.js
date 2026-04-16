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
        label: 'Machine Learning',
        tagline: 'Structured · Robust · Scientific',
        accentColor: '#A855F7',
        useTree: true,          // ← drives canvas tree, not chips
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

// Scroll timeline: [stageIndex, startFraction, endFraction]
// The scroll room is 400vh. Fractions are of (sectionScrollHeight - vh).
const STAGE_WINDOWS = [
    { stage: 0, start: 0.00, peak: 0.10, end: 0.30 },
    { stage: 1, start: 0.25, peak: 0.38, end: 0.55 },
    { stage: 2, start: 0.50, peak: 0.63, end: 0.78 },
    { stage: 3, start: 0.73, peak: 0.83, end: 1.00 }
];

// ── DOM Helpers ───────────────────────────────
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function lerp(a, b, t) { return a + (b - a) * t; }
function invLerp(a, b, v) { return clamp((v - a) / (b - a), 0, 1); }

// ── Build Chips (skip ML — it uses a canvas tree) ──────────────
function buildChips() {
    ARSENAL_DATA.forEach(cat => {
        if (cat.useTree) return;
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
//  ML TREE CANVAS — purple-themed version of
//  the branching tree from ml-tree-v3.html
//  Color: #A855F7 (portfolio ML accent)
//  Fonts: JetBrains Mono (already loaded)
// =============================================

const ML_TREE_CATEGORIES = [
    {
        name: 'Data Processing',
        skills: ['Apache Spark (PySpark)', 'Apache Airflow', 'Polars', 'Dask', 'DuckDB']
    },
    {
        name: 'Feature Stores',
        skills: ['Feast', 'Tecton', 'Hopsworks', 'Databricks / Snowflake FS']
    },
    {
        name: 'Modelling',
        skills: ['XGBoost / LightGBM / CatBoost', 'Scikit-Learn', 'HuggingFace']
    },
    {
        name: 'Experiment Tracking',
        skills: ['MLflow', 'Weights & Biases (W&B)']
    },
    {
        name: 'Deployment & Monitoring',
        skills: ['AWS SageMaker / Azure ML', 'Docker + Kubernetes', 'BentoML / Seldon / KServe', 'Evidently AI / Arize AI']
    }
];

const ML_N = ML_TREE_CATEGORIES.length;

// Purple palette (matches portfolio ML accent #A855F7)
const ML_C  = '#A855F7';
const ML_ca = a => `rgba(168,85,247,${a})`;
const ML_wa = a => `rgba(255,255,255,${a})`;

// Layout constants (same proportions as ml-tree-v3)
const ML_W        = 1100;
const ML_H        = 520;
const ML_CAT_Y    = 62;
const ML_CAT_PAD_X= 90;
const ML_TRUNK_Y  = 118;
const ML_FORK_Y   = 172;
const ML_DOT_R    = 3;
const ML_MARGIN   = 52;
const ML_DURATION = 6800;
const ML_T_DRAW_END = 0.42;
const ML_T_HOLD_END = 0.74;

const ML_DPR = Math.min(window.devicePixelRatio || 1, 2);

// Derived
const ML_colW  = (ML_W - ML_CAT_PAD_X * 2) / (ML_N - 1);
const ML_catXs = ML_TREE_CATEGORIES.map((_, i) => ML_CAT_PAD_X + i * ML_colW);

// State
let mlTreeCanvas   = null;
let mlTreeCtx      = null;
let mlPillRowEl    = null;
let mlCurrentCat   = 0;
let mlAnimStart    = null;
let mlTreeRAF      = null;
let mlTreeActive   = false;

// Helper drawing functions (operate on mlTreeCtx)
const mlClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mlMap   = (v, a, b, c, d) => c + (d - c) * mlClamp((v - a) / (b - a), 0, 1);
const mlEaseO = t => 1 - Math.pow(1 - t, 3);

function mlLn(x1, y1, x2, y2, alpha, color, width) {
    if (alpha <= 0) return;
    mlTreeCtx.save();
    mlTreeCtx.globalAlpha = alpha;
    mlTreeCtx.strokeStyle = color;
    mlTreeCtx.lineWidth   = width;
    mlTreeCtx.lineCap     = 'round';
    mlTreeCtx.beginPath(); mlTreeCtx.moveTo(x1, y1); mlTreeCtx.lineTo(x2, y2); mlTreeCtx.stroke();
    mlTreeCtx.restore();
}

function mlPln(x1, y1, x2, y2, p, alpha, color, width) {
    if (p <= 0 || alpha <= 0) return;
    p = Math.min(p, 1);
    mlLn(x1, y1, x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, alpha, color, width);
}

function mlCirc(x, y, r, alpha, color) {
    if (alpha <= 0) return;
    mlTreeCtx.save();
    mlTreeCtx.globalAlpha = alpha;
    mlTreeCtx.fillStyle   = color;
    mlTreeCtx.beginPath(); mlTreeCtx.arc(x, y, r, 0, Math.PI * 2); mlTreeCtx.fill();
    mlTreeCtx.restore();
}

function mlGlow(x, y, r, alpha) {
    if (alpha <= 0) return;
    const g = mlTreeCtx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, ML_ca(alpha)); g.addColorStop(1, 'rgba(0,0,0,0)');
    mlTreeCtx.fillStyle = g;
    mlTreeCtx.beginPath(); mlTreeCtx.arc(x, y, r, 0, Math.PI * 2); mlTreeCtx.fill();
}

function mlTxt(str, x, y, font, color, alpha, align) {
    if (alpha <= 0) return;
    mlTreeCtx.save();
    mlTreeCtx.globalAlpha  = alpha;
    mlTreeCtx.fillStyle    = color;
    mlTreeCtx.font         = font;
    mlTreeCtx.textAlign    = align || 'center';
    mlTreeCtx.textBaseline = 'middle';
    mlTreeCtx.fillText(str, x, y);
    mlTreeCtx.restore();
}

function mlSkillXs(catIdx) {
    const skills    = ML_TREE_CATEGORIES[catIdx].skills;
    const nS        = skills.length;
    const centerX   = ML_catXs[catIdx];
    const rawSpread = Math.min(nS * 128, 560);
    const rawXs     = skills.map((_, si) => {
        if (nS === 1) return centerX;
        return centerX - rawSpread / 2 + si * (rawSpread / (nS - 1));
    });
    const minRaw = Math.min(...rawXs);
    const maxRaw = Math.max(...rawXs);
    let shift = 0;
    if (minRaw < ML_MARGIN)        shift = ML_MARGIN - minRaw;
    if (maxRaw > ML_W - ML_MARGIN) shift = (ML_W - ML_MARGIN) - maxRaw;
    return rawXs.map(x => x + shift);
}

function mlTreeFrame(ts) {
    if (!mlTreeActive) return;
    if (!mlAnimStart) mlAnimStart = ts;

    const t     = mlClamp((ts - mlAnimStart) / ML_DURATION, 0, 1);
    const drawT = mlClamp(t / ML_T_DRAW_END, 0, 1);

    let bA;
    if      (t < ML_T_DRAW_END) bA = mlEaseO(t / ML_T_DRAW_END);
    else if (t < ML_T_HOLD_END) bA = 1;
    else                        bA = 1 - mlEaseO((t - ML_T_HOLD_END) / (1 - ML_T_HOLD_END));

    mlTreeCtx.clearRect(0, 0, ML_W, ML_H);

    const activeX = ML_catXs[mlCurrentCat];
    const cat     = ML_TREE_CATEGORIES[mlCurrentCat];
    const skills  = cat.skills;
    const nS      = skills.length;
    const sXs     = mlSkillXs(mlCurrentCat);

    // Horizontal category bar
    mlLn(ML_catXs[0], ML_CAT_Y, ML_catXs[ML_N - 1], ML_CAT_Y, 0.08, ML_C, 0.5);

    ML_TREE_CATEGORIES.forEach((c, i) => {
        const x      = ML_catXs[i];
        const active = i === mlCurrentCat;

        mlCirc(x, ML_CAT_Y, active ? 4.5 : 2.5, active ? 0.9 : 0.25, active ? ML_C : ML_wa(0.4));
        if (active && bA > 0) mlGlow(x, ML_CAT_Y, 22, bA * 0.25);

        // Category labels — use Inter to match the portfolio's font stack
        mlTxt(
            c.name,
            x, ML_CAT_Y - 32,
            `${active ? '600' : '500'} 15px 'Inter', sans-serif`,
            active ? '#ffffff' : ML_wa(0.8),
            active ? 1 : 0.4
        );
    });

    // S1: vertical spine down to trunk level
    const s1 = mlMap(drawT, 0, 0.18, 0, 1);
    mlPln(activeX, ML_CAT_Y + 5, activeX, ML_TRUNK_Y, s1, bA * 0.9, ML_C, 1);

    // S2: horizontal trunk spreading left & right
    const leftX  = sXs[0];
    const rightX = sXs[nS - 1];
    const s2     = mlMap(drawT, 0.15, 0.36, 0, 1);

    if (nS > 1) {
        mlPln(activeX, ML_TRUNK_Y, leftX,  ML_TRUNK_Y, s2, bA * 0.75, ML_C, 0.9);
        mlPln(activeX, ML_TRUNK_Y, rightX, ML_TRUNK_Y, s2, bA * 0.75, ML_C, 0.9);
    }

    // S3: vertical drops + skill dots + labels
    const stagger = 0.34;
    const perW    = 0.30;

    skills.forEach((skill, si) => {
        const sx     = sXs[si];
        const start  = 0.32 + (si / nS) * stagger;
        const skillT = mlMap(drawT, start, start + perW, 0, 1);
        if (skillT <= 0) return;

        mlPln(sx, ML_TRUNK_Y, sx, ML_FORK_Y, mlMap(skillT, 0, 0.45, 0, 1), bA * 0.72, ML_C, 0.85);

        const dotA = mlMap(skillT, 0.40, 0.65, 0, 1);
        if (dotA > 0) {
            mlGlow(sx, ML_FORK_Y, 10, bA * dotA * 0.25);
            mlCirc(sx, ML_FORK_Y, ML_DOT_R, bA * dotA, ML_C);
        }

        const textA = mlMap(skillT, 0.58, 0.90, 0, 1);
        if (textA > 0) {
            const parts = skill.split(' / ');
            if (parts.length > 1 && skill.length > 22) {
                // Use Inter for skill text — matches portfolio font
                mlTxt(parts[0],                    sx, ML_FORK_Y + 26, "500 14px 'Inter', sans-serif", '#ffffff', bA * textA * 0.9);
                mlTxt(parts.slice(1).join(' / '), sx, ML_FORK_Y + 44, "400 13px 'Inter', sans-serif",  ML_wa(0.7),   bA * textA * 0.8);
            } else {
                mlTxt(skill, sx, ML_FORK_Y + 26, "400 14px 'Inter', sans-serif", '#ffffff', bA * textA * 0.9);
            }
        }
    });

    // Progress pills (visual only — hit areas are DOM buttons)
    const pillW  = 16, pillH = 2.5, pillGap = 8;
    const totalP = ML_N * pillW + (ML_N - 1) * pillGap;
    const px0    = (ML_W - totalP) / 2;
    const pillY  = ML_H - 22;

    ML_TREE_CATEGORIES.forEach((_, i) => {
        const px     = px0 + i * (pillW + pillGap);
        const active = i === mlCurrentCat;

        mlTreeCtx.save();
        mlTreeCtx.globalAlpha = 0.10;
        mlTreeCtx.fillStyle   = ML_C;
        mlTreeCtx.beginPath(); mlTreeCtx.roundRect(px, pillY, pillW, pillH, pillH / 2); mlTreeCtx.fill();

        mlTreeCtx.globalAlpha = active ? 0.70 : 0.20;
        mlTreeCtx.fillStyle   = active ? ML_C : ML_wa(0.3);
        const fw = active ? pillW * mlClamp(t / 0.98, 0, 1) : pillW;
        if (fw > 0) {
            mlTreeCtx.beginPath(); mlTreeCtx.roundRect(px, pillY, fw, pillH, pillH / 2); mlTreeCtx.fill();
        }

        if (active) {
            mlTreeCtx.globalAlpha = 0.18;
            mlTreeCtx.strokeStyle = ML_C;
            mlTreeCtx.lineWidth   = 1;
            mlTreeCtx.beginPath(); mlTreeCtx.roundRect(px - 2, pillY - 2, pillW + 4, pillH + 4, (pillH + 4) / 2); mlTreeCtx.stroke();
        }
        mlTreeCtx.restore();
    });

    // Auto-advance to next category
    if (t >= 1) {
        mlAnimStart  = null;
        mlCurrentCat = (mlCurrentCat + 1) % ML_N;
    }

    mlTreeRAF = requestAnimationFrame(mlTreeFrame);
}

function mlJumpTo(idx) {
    mlCurrentCat = idx;
    mlAnimStart  = null;
}

function initMLTree() {
    mlTreeCanvas = document.getElementById('ml-tree-canvas');
    mlPillRowEl  = document.getElementById('ml-pill-row');
    if (!mlTreeCanvas || !mlPillRowEl) return;

    mlTreeCtx = mlTreeCanvas.getContext('2d');

    // Size canvas to logical px (DPR-aware)
    mlTreeCanvas.width  = ML_W * ML_DPR;
    mlTreeCanvas.height = ML_H * ML_DPR;
    mlTreeCanvas.style.width  = ML_W + 'px';
    mlTreeCanvas.style.height = ML_H + 'px';
    mlTreeCtx.scale(ML_DPR, ML_DPR);

    // Build pill DOM buttons
    mlPillRowEl.innerHTML = '';
    for (let i = 0; i < ML_N; i++) {
        const btn = document.createElement('button');
        btn.className = 'ml-pill-hit';
        btn.title     = ML_TREE_CATEGORIES[i].name;
        btn.setAttribute('aria-label', ML_TREE_CATEGORIES[i].name);
        btn.addEventListener('click', () => mlJumpTo(i));
        mlPillRowEl.appendChild(btn);
    }

    // Canvas cursor on pill hover
    mlTreeCanvas.addEventListener('mousemove', e => {
        const rect   = mlTreeCanvas.getBoundingClientRect();
        const scaleX = ML_W / rect.width;
        const scaleY = ML_H / rect.height;
        const mx     = (e.clientX - rect.left) * scaleX;
        const my     = (e.clientY - rect.top)  * scaleY;

        const pillW  = 16, pillGap = 8;
        const totalP = ML_N * pillW + (ML_N - 1) * pillGap;
        const px0    = (ML_W - totalP) / 2;
        const pillY  = ML_H - 22;

        let onPill = false;
        for (let i = 0; i < ML_N; i++) {
            const px = px0 + i * (pillW + pillGap);
            if (mx >= px - 6 && mx <= px + pillW + 6 && my >= pillY - 8 && my <= pillY + 14) {
                onPill = true; break;
            }
        }
        mlTreeCanvas.style.cursor = onPill ? 'pointer' : 'default';
    });

    // Canvas click for pill navigation
    mlTreeCanvas.addEventListener('click', e => {
        const rect   = mlTreeCanvas.getBoundingClientRect();
        const scaleX = ML_W / rect.width;
        const scaleY = ML_H / rect.height;
        const mx     = (e.clientX - rect.left) * scaleX;
        const my     = (e.clientY - rect.top)  * scaleY;

        const pillW  = 16, pillGap = 8;
        const totalP = ML_N * pillW + (ML_N - 1) * pillGap;
        const px0    = (ML_W - totalP) / 2;
        const pillY  = ML_H - 22;

        for (let i = 0; i < ML_N; i++) {
            const px = px0 + i * (pillW + pillGap);
            if (mx >= px - 8 && mx <= px + pillW + 8 && my >= pillY - 10 && my <= pillY + 16) {
                mlJumpTo(i);
                return;
            }
        }
    });
}

function startMLTree() {
    if (mlTreeRAF) return;
    mlTreeActive = true;
    mlAnimStart  = null;
    document.fonts.ready.then(() => {
        mlTreeRAF = requestAnimationFrame(mlTreeFrame);
    });
}

function stopMLTree() {
    mlTreeActive = false;
    if (mlTreeRAF) { cancelAnimationFrame(mlTreeRAF); mlTreeRAF = null; }
    mlAnimStart  = null;
    mlCurrentCat = 0;
    if (mlTreeCtx && mlTreeCanvas) {
        mlTreeCtx.clearRect(0, 0, ML_W, ML_H);
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

// Computed per-row card width (widest tool determines uniform width)
const nlpRowMaxLen = NLP_ROWS.map(row => Math.max(...row.tools.map(t => t.length)));
const nlpRowCardW  = nlpRowMaxLen.map(ml => Math.ceil(ml * NLP_CHAR_W) + NLP_CARD_PX * 2);

// Block Y positions
const nlpBlockYs = [];
(function() {
    let cy = NLP_PAD_T;
    NLP_ROWS.forEach(() => {
        nlpBlockYs.push(cy);
        cy += NLP_CAT_H + NLP_CAT_MARGIN + NLP_CARD_H + NLP_BLOCK_GAP;
    });
})();

const NLP_H = nlpBlockYs[nlpBlockYs.length - 1] + NLP_CAT_H + NLP_CAT_MARGIN + NLP_CARD_H + NLP_PAD_B;

// Animation timing
const NLP_CARD_CYCLE  = 6200;
const NLP_PH_SCRAM    = 950;
const NLP_CHAR_SET_D  = 42;
const NLP_HOLD_DUR    = 2000;
const NLP_CHAR_UNSET  = 32;
const NLP_STAGGER     = 300;

// State
let nlpCanvas   = null;
let nlpCtx      = null;
let nlpCards    = [];
let nlpRAF      = null;
let nlpActive   = false;
let nlpT0       = null;

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

    nlpCtx.clearRect(0, 0, NLP_W, NLP_H);

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
            const sepY = by + NLP_CAT_H + NLP_CAT_MARGIN + NLP_CARD_H + NLP_BLOCK_GAP / 2;
            nlpSeg(NLP_PAD_L - 20, sepY, NLP_W - 36, sepY, NLP_wa(1), 0.025, 0.5);
        }
    });

    nlpRAF = requestAnimationFrame(nlpFrame);
}

function initNLPCanvas() {
    nlpCanvas = document.getElementById('nlp-scramble-canvas');
    if (!nlpCanvas) return;
    nlpCtx = nlpCanvas.getContext('2d');
    nlpCanvas.width  = NLP_W * NLP_DPR;
    nlpCanvas.height = NLP_H * NLP_DPR;
    nlpCanvas.style.width  = NLP_W + 'px';
    nlpCanvas.style.height = NLP_H + 'px';
    nlpCtx.scale(NLP_DPR, NLP_DPR);
    nlpBuildCards();
}

function startNLPCanvas() {
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
        nlpCtx.clearRect(0, 0, NLP_W, NLP_H);
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
    // ML uses the tree canvas — not chips
    if (stageData.useTree) {
        startMLTree();
        if (onDone) setTimeout(onDone, 200);
        return;
    }

    // NLP uses the scramble canvas — not chips
    if (stageData.useCanvas) {
        startNLPCanvas();
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
    // ML uses the tree canvas
    if (stageData.useTree) {
        stopMLTree();
        return;
    }

    // NLP uses the scramble canvas
    if (stageData.useCanvas) {
        stopNLPCanvas();
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
let stageAnimated  = [false, false, false, false];
let lastProgress   = -1;
let lastIsMobileViewport = window.innerWidth < 768;

function getScrollProgress() {
    const section = document.getElementById('arsenal');
    if (!section) return 0;
    const rect = section.getBoundingClientRect();
    const sectionScrollRoom = section.offsetHeight - window.innerHeight;
    if (sectionScrollRoom <= 0) return 0;
    const scrolled = -rect.top;
    return clamp(scrolled / sectionScrollRoom, 0, 1);
}

function getActiveStage(progress) {
    let best = 0, bestScore = -1;
    STAGE_WINDOWS.forEach((w, i) => {
        if (progress >= w.start && progress <= w.end) {
            const score = invLerp(w.start, w.peak, progress) - invLerp(w.peak, w.end, progress);
            if (score > bestScore) { bestScore = score; best = i; }
        }
    });
    if (progress > STAGE_WINDOWS[STAGE_WINDOWS.length - 1].peak) {
        best = STAGE_WINDOWS.length - 1;
    }
    return best;
}

function getStageOpacity(stageIdx, progress) {
    const w = STAGE_WINDOWS[stageIdx];
    if (!w) return 0;
    const fadeIn  = invLerp(w.start, w.peak, progress);
    const fadeOut = 1 - invLerp(w.peak, w.end, progress);
    return clamp(Math.min(fadeIn, fadeOut), 0, 1);
}

const ACCENTS = ARSENAL_DATA.map(d => d.accentColor);
const LABELS  = ARSENAL_DATA.map(d => d.label);

function setAccentColor(color) {
    document.documentElement.style.setProperty('--arsenal-accent', color);
}

function updateProgressIndicator(progress, activeStage) {
    const fill = document.getElementById('arsenal-progress-fill');
    if (fill) fill.style.height = `${(progress * 100).toFixed(1)}%`;

    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (!dot) continue;
        dot.classList.toggle('dot-active', i === activeStage);
    }
}

function updateHeaderLabel(stageIdx) {
    const label = document.getElementById('arsenal-category-label');
    if (label) label.textContent = LABELS[stageIdx];
}

function onScrollTick() {
    const isMobile = window.innerWidth < 768;
    if (isMobile !== lastIsMobileViewport) {
        lastProgress = -1;
        lastIsMobileViewport = isMobile;
    }

    const progress = getScrollProgress();
    if (Math.abs(progress - lastProgress) < 0.001) return;
    lastProgress = progress;

    const active = getActiveStage(progress);

    setAccentColor(ACCENTS[active]);
    updateHeaderLabel(active);
    updateProgressIndicator(progress, active);
    if (isMobile) stopConnectors();

    ARSENAL_DATA.forEach((cat, idx) => {
        const stageEl = document.getElementById(`stage-${cat.id}`);
        if (!stageEl) return;

        const opacity = isMobile
            ? (idx === active ? 1 : 0)
            : getStageOpacity(idx, progress);

        stageEl.classList.toggle('as-visible', opacity > 0.05);
        stageEl.style.opacity = opacity;

        if (idx === active && !stageAnimated[idx] && opacity > 0.3) {
            stageAnimated[idx] = true;
            animateChipsIn(cat, () => {
                if (idx === 0 && !isMobile) startConnectors();
            });
        }

        if (opacity < 0.02 && stageAnimated[idx]) {
            stageAnimated[idx] = false;
            animateChipsOut(cat);
            if (idx === 0) stopConnectors();
        }
    });

    currentStage = active;
}

// ── Init ──────────────────────────────────────
function initArsenal() {
    buildChips();
    initConnectorCanvas();
    initMLTree();
    initNLPCanvas();

    window.addEventListener('scroll', onScrollTick, { passive: true });
    window.addEventListener('resize', () => {
        sizeConnectorCanvas();
        buildConnectorNodes();
        onScrollTick();
    });

    onScrollTick();

    const section = document.getElementById('arsenal');
    if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 0) {
            onScrollTick();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArsenal);
} else {
    initArsenal();
}
