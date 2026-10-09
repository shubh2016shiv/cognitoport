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
        useStaticPanel: true,
        gridId: null,
        chipClass: null,
        animIn: null,
        skills: []
    },
    {
        id: 'cloud',
        label: 'Engineering & Deployment',
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
    const panel = target instanceof Element ? target.closest('.genai-explorer') : null;
    if (!panel) return false;
    if (panel.matches('.nlp-skills-panel')) {
        if (currentStage !== 2) return false;
    } else if (panel.matches('.ml-skills-panel')) {
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

    window.addEventListener('scroll', () => onScrollTick(false), { passive: true });
    window.addEventListener('wheel', onArsenalWheel, { passive: false });
    window.addEventListener('touchstart', onArsenalTouchStart, { passive: true });
    window.addEventListener('touchmove', onArsenalTouchMove, { passive: false });
    window.addEventListener('touchend', onArsenalTouchEnd, { passive: true });
    window.addEventListener('resize', () => {
        sizeConnectorCanvas();
        buildConnectorNodes();
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
