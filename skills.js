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
        gridId: 'ml-chip-grid',
        chipClass: 'chip-ml',
        animIn: 'ml-in',
        skills: [
            'HuggingFace', 'Scikit-Learn', 'TensorFlow 2.X',
            'Keras', 'XGBoost', 'MLFlow', 'Optuna', 'PyCaret'
        ]
    },
    {
        id: 'nlp',
        label: 'Natural Language Processing',
        tagline: 'Semantic · Linguistic · Dense',
        accentColor: '#34D399',
        gridId: 'nlp-chip-grid',
        chipClass: 'chip-nlp',
        animIn: 'nlp-in',
        skills: ['SentenceTransformers', 'SpaCy', 'NLTK', 'Transformers', 'BM25', 'TF-IDF']
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

// ── Build Chips ───────────────────────────────
function buildChips() {
    ARSENAL_DATA.forEach(cat => {
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

// Randomly pick pairs and pulse a connection
let pulsePhase = 0;
function drawConnectors(timestamp) {
    if (!connectorCtx || !connectorCanvas) return;
    const W = connectorCanvas.width, H = connectorCanvas.height;
    connectorCtx.clearRect(0, 0, W, H);

    if (!connectorNodes.length) buildConnectorNodes();
    if (connectorNodes.length < 2) return;

    pulsePhase = (timestamp * 0.0008) % 1;

    // Draw faint base mesh (every pair within threshold)
    const DIST_THRESHOLD = 280;
    for (let i = 0; i < connectorNodes.length; i++) {
        for (let j = i + 1; j < connectorNodes.length; j++) {
            const dx = connectorNodes[i].x - connectorNodes[j].x;
            const dy = connectorNodes[i].y - connectorNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < DIST_THRESHOLD) {
                const alpha = (1 - dist / DIST_THRESHOLD) * 0.07;
                connectorCtx.beginPath();
                connectorCtx.moveTo(connectorNodes[i].x, connectorNodes[i].y);
                connectorCtx.lineTo(connectorNodes[j].x, connectorNodes[j].y);
                connectorCtx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                connectorCtx.lineWidth = 1;
                connectorCtx.stroke();
            }
        }
    }

    // Draw travelling pulse on 2 random pairs (seeded by time)
    const pairSeed = Math.floor(timestamp * 0.0003) % connectorNodes.length;
    const n1 = connectorNodes[pairSeed % connectorNodes.length];
    const n2 = connectorNodes[(pairSeed + 3) % connectorNodes.length];
    if (n1 && n2) {
        const t = pulsePhase;
        const px = lerp(n1.x, n2.x, t);
        const py = lerp(n1.y, n2.y, t);
        // Glow dot travelling along the line
        connectorCtx.beginPath();
        connectorCtx.arc(px, py, 3, 0, Math.PI * 2);
        connectorCtx.fillStyle = 'rgba(0, 240, 255, 0.85)';
        connectorCtx.shadowBlur = 12;
        connectorCtx.shadowColor = '#00F0FF';
        connectorCtx.fill();
        connectorCtx.shadowBlur = 0;

        // Bright line for this pair
        connectorCtx.beginPath();
        connectorCtx.moveTo(n1.x, n1.y);
        connectorCtx.lineTo(n2.x, n2.y);
        connectorCtx.strokeStyle = `rgba(0, 240, 255, 0.25)`;
        connectorCtx.lineWidth = 1.5;
        connectorCtx.stroke();
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

// ── Animation Helpers ─────────────────────────

// Active interval/timeout refs for continuous effects
let nlpWaveInterval = null;
let cloudHeartbeatTimeout = null;
let mlCadenceTimeout = null;
let cloudSyncTimeout = null;

function retriggerAnimationClass(chip, className) {
    chip.classList.remove(className);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => chip.classList.add(className));
    });
}

// ── Animate Chips In ─────────────────────────
function animateChipsIn(stageData, onDone) {
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

    // ── ML: spring-bounce each chip in, glow snaps on landing ──
    else if (stageData.id === 'ml') {
        chips.forEach((chip, i) => {
            const enterDelay = 40 + i * 120; // 120ms gap = each bounce is clearly visible
            setTimeout(() => {
                chip.classList.add('ml-in');
                // Glow fires 680ms after bounce starts (spring settling time)
                setTimeout(() => {
                    chip.classList.add('ml-glow');
                    // Clean up glow class after animation finishes
                    chip.addEventListener('animationend', () => {
                        chip.classList.remove('ml-glow');
                    }, { once: true });
                }, 680);
            }, enterDelay);
        });
        const mlDoneDelay = 40 + chips.length * 120 + 800;
        setTimeout(() => startMLCadence(chips), mlDoneDelay + 120);
        if (onDone) setTimeout(onDone, mlDoneDelay);
    }

    // ── NLP: rapid left-to-right cascade, then looping signal wave ──
    else if (stageData.id === 'nlp') {
        chips.forEach((chip, i) => {
            setTimeout(() => chip.classList.add('nlp-in'), 25 + i * 50);
        });
        const waveStartDelay = 25 + chips.length * 50 + 350;
        setTimeout(() => startNLPWave(chips), waveStartDelay);
        if (onDone) setTimeout(onDone, waveStartDelay);
    }

    // ── Cloud: sequential boot-flicker, opacity locked by animationend ──
    else if (stageData.id === 'cloud') {
        let booted = 0;
        chips.forEach((chip, i) => {
            setTimeout(() => {
                // Trigger the boot animation
                chip.classList.add('cloud-booting');

                chip.addEventListener('animationend', () => {
                    // CRITICAL: lock opacity:1 as inline style so
                    // adding cloud-idle later cannot reset it to 0
                    chip.style.opacity = '1';
                    chip.classList.remove('cloud-booting');
                    booted++;
                    if (booted === chips.length) {
                        // All booted — start slow amber heartbeat
                        cloudHeartbeatTimeout = setTimeout(() => {
                            chips.forEach(c => c.classList.add('cloud-idle'));
                            startCloudSync(chips);
                        }, 600);
                        if (onDone) onDone();
                    }
                }, { once: true });
            }, 80 + i * 180); // long stagger = sequential boot
        });
    }

    else {
        chips.forEach((chip, i) => {
            setTimeout(() => chip.classList.add(stageData.animIn), 60 + i * 80);
        });
        if (onDone) setTimeout(onDone, 60 + chips.length * 80 + 200);
    }
}

// ── NLP Continuous Signal Wave ────────────────
let nlpWaveStopped = false;
function startNLPWave(chips) {
    if (nlpWaveInterval) return;
    nlpWaveStopped = false;
    let idx = 0;
    function triggerNext() {
        if (nlpWaveStopped) return; // respect stop signal
        const chip = chips[idx % chips.length];
        // Restart animation without forcing synchronous layout.
        retriggerAnimationClass(chip, 'nlp-wave');
        idx++;
        if (idx < chips.length) {
            nlpWaveInterval = setTimeout(triggerNext, 200);
        } else {
            // End of sweep — pause then repeat
            nlpWaveInterval = setTimeout(() => {
                idx = 0;
                nlpWaveInterval = null;
                startNLPWave(chips);
            }, 1600);
        }
    }
    nlpWaveInterval = setTimeout(triggerNext, 0);
}

function stopNLPWave() {
    nlpWaveStopped = true;
    if (nlpWaveInterval) { clearTimeout(nlpWaveInterval); nlpWaveInterval = null; }
}

let mlCadenceStopped = false;
function startMLCadence(chips) {
    if (mlCadenceTimeout) return;
    mlCadenceStopped = false;
    let idx = 0;
    function triggerCadence() {
        if (mlCadenceStopped) return;
        const chip = chips[idx % chips.length];
        retriggerAnimationClass(chip, 'ml-cadence');
        idx++;
        mlCadenceTimeout = setTimeout(triggerCadence, 520);
    }
    mlCadenceTimeout = setTimeout(triggerCadence, 260);
}

function stopMLCadence() {
    mlCadenceStopped = true;
    if (mlCadenceTimeout) { clearTimeout(mlCadenceTimeout); mlCadenceTimeout = null; }
}

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
    const chips = Array.from(
        document.querySelectorAll(`#${stageData.id}-chip-grid .${stageData.chipClass}`)
    );
    chips.forEach(chip => {
        // Remove all entry classes
        chip.classList.remove(stageData.animIn, 'genai-glow', 'ml-in', 'ml-glow',
                              'ml-cadence', 'nlp-in', 'nlp-wave', 'cloud-booting', 'cloud-idle', 'cloud-sync');
        // Clear JS-set inline opacity for cloud chips
        if (stageData.id === 'cloud') chip.style.opacity = '';
    });
    if (stageData.id === 'nlp') stopNLPWave();
    if (stageData.id === 'ml') stopMLCadence();
    if (stageData.id === 'cloud') {
        if (cloudHeartbeatTimeout) { clearTimeout(cloudHeartbeatTimeout); cloudHeartbeatTimeout = null; }
        stopCloudSync();
    }
}

// ── Scroll Engine ─────────────────────────────
let currentStage   = -1;
let stageAnimated  = [false, false, false, false];
let lastProgress   = -1;

function getScrollProgress() {
    const section = document.getElementById('arsenal');
    if (!section) return 0;
    const rect = section.getBoundingClientRect();
    const sectionScrollRoom = section.offsetHeight - window.innerHeight;
    if (sectionScrollRoom <= 0) return 0;
    // How far we've scrolled INTO the section past its top
    const scrolled = -rect.top;
    return clamp(scrolled / sectionScrollRoom, 0, 1);
}

function getActiveStage(progress) {
    // Find which stage should be dominant
    let best = 0, bestScore = -1;
    STAGE_WINDOWS.forEach((w, i) => {
        if (progress >= w.start && progress <= w.end) {
            const score = invLerp(w.start, w.peak, progress) - invLerp(w.peak, w.end, progress);
            if (score > bestScore) { bestScore = score; best = i; }
        }
    });
    // Past last window → stay on last stage
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
    if (window.innerWidth < 768) return; // desktop only

    const progress   = getScrollProgress();
    if (Math.abs(progress - lastProgress) < 0.001) return; // skip micro updates
    lastProgress = progress;

    const active = getActiveStage(progress);

    // Update accent color + header
    setAccentColor(ACCENTS[active]);
    updateHeaderLabel(active);
    updateProgressIndicator(progress, active);

    // Per-stage visibility + animation trigger
    ARSENAL_DATA.forEach((cat, idx) => {
        const stageEl = document.getElementById(`stage-${cat.id}`);
        if (!stageEl) return;

        const opacity = getStageOpacity(idx, progress);

        // Toggle visible class: drives css transition
        stageEl.classList.toggle('as-visible', opacity > 0.05);
        stageEl.style.opacity = opacity;

        // Trigger entrance animation once when stage becomes active
        if (idx === active && !stageAnimated[idx] && opacity > 0.3) {
            stageAnimated[idx] = true;
            animateChipsIn(cat, () => {
                if (idx === 0) startConnectors();
            });
        }

        // Reset animation state when stage leaves completely
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

    // On desktop, start with stage 0 chips hidden (animation drives them in)
    // On mobile, they're already visible via CSS override

    window.addEventListener('scroll', onScrollTick, { passive: true });
    window.addEventListener('resize', () => {
        sizeConnectorCanvas();
        buildConnectorNodes();
    });

    // Trigger once on load in case the user is already scrolled
    onScrollTick();

    // If the section is already in view on load (top of page → stage 0 init)
    const section = document.getElementById('arsenal');
    if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 0) {
            // Already scrolled past top — pick it up
            onScrollTick();
        }
    }
}

// Fire after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArsenal);
} else {
    initArsenal();
}
