function renderCareerSkillChips(skills) {
    return `<ul class="flex flex-wrap gap-2">${skills.map((skill) => `<li class="rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-3 py-1 text-xs text-gray-200">${skill}</li>`).join('')}</ul>`;
}

const CAREER_JOURNEY = [
    {
        id: 'dataconsol-lead-ml-engineer',
        period: 'January 2026 - Present',
        role: 'Lead Machine Learning Engineer',
        company: 'DataConsol',
        companyUrl: 'https://dataconsol.com/',
        location: 'India',
        blurb: 'Leading end-to-end machine learning initiatives and production-ready AI delivery for enterprise use cases.',
        drawerHeading: 'Lead Machine Learning Engineer at DataConsol',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'This section will include project highlights, business impact, and team contributions.',
            'Technologies used and architecture details will also be listed here.'
        ]
    },
    {
        id: 'nitor-generative-ai-developer',
        period: 'August 2024 - January 2026',
        role: 'Generative AI Developer',
        company: 'Nitor Infotech',
        companyUrl: 'https://www.nitorinfotech.com/',
        location: 'Pune, India',
        blurb: 'Built and delivered applied GenAI solutions, including enterprise-focused LLM workflows and retrieval systems.',
        drawerHeading: 'Generative AI Developer at Nitor Infotech',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'This panel will capture responsibilities, solution scope, and measurable outcomes.',
            'The complete technology stack and toolchain will be documented here.'
        ]
    },
    {
        id: 'faraday-ml-engineer',
        period: 'March 2023 - June 2024',
        role: 'Machine Learning Engineer',
        company: 'Faraday Battery Private Limited',
        companyUrl: 'https://www.faradaybattery.in/',
        location: 'Birmingham, UK',
        blurb: 'Developed predictive modeling and data workflows for research-oriented battery diagnostics use cases.',
        drawerHeading: 'Machine Learning Engineer at Faraday Battery Private Limited',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'Project-level context, model strategy, and operational details will be added later.'
        ]
    },
    {
        id: 'bcu-msc-ai',
        period: '2022-2023',
        role: 'MSc Artificial Intelligence (Distinction)',
        company: 'Birmingham City University',
        organizationLabel: 'University',
        companyUrl: 'https://www.bcu.ac.uk/',
        location: 'Birmingham, UK',
        blurb: 'One-year full-time MSc covering Machine Learning, Deep Learning, NLP and Applied AI.',
        drawerHeading: 'MSc Artificial Intelligence (Distinction)',
        drawerHtml: `
            <div class="space-y-6">
                <p>One-year full-time MSc covering Machine Learning, Deep Learning, NLP and Applied AI.</p>
                <div>
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Modules · 180 credits</p>
                    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2" aria-label="MSc modules">
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3"><span class="text-white">Computing for AI</span><span class="block text-xs text-gray-500">CMP6221 · 20 credits</span></li>
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3"><span class="text-white">Deep Learning</span><span class="block text-xs text-gray-500">CMP7225 · 20 credits</span></li>
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3"><span class="text-white">Impact of AI</span><span class="block text-xs text-gray-500">CMP7226 · 20 credits</span></li>
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3"><span class="text-white">Data Visualisation</span><span class="block text-xs text-gray-500">CMP7227 · 20 credits</span></li>
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3"><span class="text-white">Machine Learning</span><span class="block text-xs text-gray-500">CMP7228 · 20 credits</span></li>
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3"><span class="text-white">Applied AI</span><span class="block text-xs text-gray-500">CMP7229 · 20 credits</span></li>
                        <li class="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:col-span-2"><span class="text-white">Individual Master’s Project (thesis)</span><span class="block text-xs text-gray-500">CMP7200 · 60 credits</span></li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Skills</p>
                    <table class="w-full text-left text-sm border-collapse">
                        <tbody class="divide-y divide-white/10">
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold w-2/5">NLP and embeddings</th><td class="py-3">${renderCareerSkillChips(['SentenceTransformers', 'Hugging Face', 'BERT', 'spaCy', 'NLTK', 'Gensim'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">Machine learning</th><td class="py-3">${renderCareerSkillChips(['Scikit-learn', 'CatBoost', 'Random Forest', 'AdaBoost', 'K-Means', 'HDBSCAN', 'UMAP'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">Deep learning</th><td class="py-3">${renderCareerSkillChips(['TensorFlow', 'LSTM'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">Languages and data</th><td class="py-3">${renderCareerSkillChips(['Python', 'MongoDB'])}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-2">Master’s thesis</p>
                    <h5 class="text-white text-base font-semibold leading-snug">Context-Aware Three-Stage Approach for Matching Resume to Job Descriptions</h5>
                    <ul class="mt-4 space-y-3">
                        <li><strong class="text-white">Problem:</strong> Keyword-based job matching misses meaning, so a good candidate can be overlooked because of different wording.</li>
                        <li><strong class="text-white">What I built:</strong> A three-stage NLP pipeline. Sentence-BERT clusters 3,500+ job descriptions by role, then the resume is scored against jobs in its cluster at document level and at skill level (skills found by an LSTM classifier). The two scores are averaged and the top 10 jobs are returned.</li>
                        <li><strong class="text-white">Result:</strong> Sentence-BERT beat Doc2Vec on job-category classification, 98% vs 69% accuracy.</li>
                    </ul>
                    <p class="mt-4 text-xs text-gray-400">Supervised by <a href="https://www.linkedin.com/in/amna-dridi-467a71113/" target="_blank" rel="noopener noreferrer" class="text-cyan-neon hover:underline">Dr. Amna Dridi ↗</a> and Dr. Edlira Vakaj · Submitted 18 September 2023</p>
                    <div class="flex flex-wrap gap-3 mt-4">
                        <a href="https://drive.google.com/file/d/19r7tuCMTJaKk2jnG16dnkROrRtwkUz3Y/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-neon font-semibold hover:bg-cyan-500/20 transition-colors">Read the Thesis ↗</a>
                        <a href="https://github.com/shubh2016shiv/thesis-resume-to-job-description-matching/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-neon font-semibold hover:bg-cyan-500/20 transition-colors">View Code on GitHub ↗</a>
                    </div>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-2">Machine Learning Project</p>
                    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h5 class="text-white text-base font-semibold leading-snug">Loan Risk Analysis on 1M Lending Club Records</h5>
                        <a href="https://www.kaggle.com/datasets/ethon0426/lending-club-20072020q1/data" target="_blank" rel="noopener noreferrer" class="text-cyan-neon text-xs whitespace-nowrap hover:underline">Dataset ↗</a>
                    </div>
                    <ul class="mt-4 space-y-3">
                        <li><strong class="text-white">Problem:</strong> Lenders need to know who is likely to default, and how much of the loan they would lose if it happens.</li>
                        <li><strong class="text-white">What I built:</strong> Three models: a Random Forest that flags likely defaults, an AdaBoost regressor that predicts how much of a defaulted loan stays unpaid, and K-Means that groups borrowers into four risk segments.</li>
                        <li><strong class="text-white">Result:</strong> The classifier caught about two-thirds of high-risk loans, and the regressor reached R² of 0.82 on unseen data.</li>
                    </ul>
                    <div class="flex flex-wrap gap-3 mt-4">
                        <a href="https://drive.google.com/file/d/1e9T2J1wKpk8e6HJoO2MtCYFH7NQ3bZVu/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-neon font-semibold hover:bg-cyan-500/20 transition-colors">Read the Report ↗</a>
                        <a href="https://github.com/shubh2016shiv/Machine-Learning-Project-in-Finance-Domain" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-neon font-semibold hover:bg-cyan-500/20 transition-colors">View Code on GitHub ↗</a>
                    </div>
                </div>
            </div>`
    },
    {
        id: 'citibank-software-developer',
        period: '2016 - 2022',
        role: 'Software Developer',
        company: 'CitiCorp Services India Private Limited (TTS Department)',
        companyUrl: 'https://www.citigroup.com/global/about-us/global-presence/india',
        location: 'Pune, India',
        blurb: 'Built secure and scalable backend systems with strong engineering standards for financial workloads.',
        drawerHeading: 'Software Developer at CitiCorp Services India Private Limited (TTS Department)',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'This section will include platform responsibilities and engineering achievements.'
        ]
    }
];

const CAREER_MOBILE_BREAKPOINT = 768;
let mobileCareerFocusRaf = null;
let mobileCareerObserver = null;
let mobileCareerVisibility = new Map();
let mobileCareerObservedItems = [];
let mobileCareerManualMode = false;
let mobileCareerManualItem = null;
let mobileCareerLongPressTimer = null;
let mobileCareerTouchStart = null;
let suppressCareerClick = false;

const CAREER_LONG_PRESS_MS = 420;
const CAREER_TOUCH_MOVE_CANCEL_PX = 10;

function isCareerMobileMode() {
    return window.innerWidth < CAREER_MOBILE_BREAKPOINT;
}

function clearMobileCareerActiveState() {
    document
        .querySelectorAll('#career-timeline .career-item.is-mobile-active')
        .forEach((item) => item.classList.remove('is-mobile-active'));
}

function clearMobileCareerManualMode() {
    mobileCareerManualMode = false;
    mobileCareerManualItem = null;
}

function setMobileCareerManualItem(target) {
    if (!target) return;
    mobileCareerManualMode = true;
    mobileCareerManualItem = target;
    setMobileCareerActiveItem(target);
}

function cancelMobileCareerLongPressTimer() {
    if (!mobileCareerLongPressTimer) return;
    clearTimeout(mobileCareerLongPressTimer);
    mobileCareerLongPressTimer = null;
}

function releaseMobileCareerManualModeOnScroll() {
    if (!isCareerMobileMode()) return;
    if (!mobileCareerManualMode) return;
    clearMobileCareerManualMode();
    scheduleMobileCareerActiveStateUpdate();
}

function setMobileCareerActiveItem(target) {
    const timeline = document.getElementById('career-timeline');
    if (!timeline) return;
    const items = Array.from(timeline.querySelectorAll('.career-item'));
    items.forEach((item) => item.classList.toggle('is-mobile-active', item === target));
}

function getMobileFocusTarget(items) {
    const header = document.getElementById('header');
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const anchorY = Math.max(headerBottom + 36, window.innerHeight * 0.42);

    let bestVisible = null;
    let bestVisibleDist = Number.POSITIVE_INFINITY;
    let bestAny = null;
    let bestAnyDist = Number.POSITIVE_INFINITY;

    items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - anchorY);
        const isVisible = rect.bottom > headerBottom + 8 && rect.top < window.innerHeight - 12;

        if (isVisible && dist < bestVisibleDist) {
            bestVisibleDist = dist;
            bestVisible = item;
        }
        if (dist < bestAnyDist) {
            bestAnyDist = dist;
            bestAny = item;
        }
    });

    return bestVisible || bestAny;
}

function updateMobileCareerActiveState() {
    const timeline = document.getElementById('career-timeline');
    if (!timeline) return;

    const items = Array.from(timeline.querySelectorAll('.career-item'));
    if (!items.length) return;

    if (!isCareerMobileMode()) {
        clearMobileCareerManualMode();
        clearMobileCareerActiveState();
        return;
    }

    if (mobileCareerManualMode) {
        if (mobileCareerManualItem && timeline.contains(mobileCareerManualItem)) {
            setMobileCareerActiveItem(mobileCareerManualItem);
            return;
        }
        clearMobileCareerManualMode();
    }

    const target = getMobileFocusTarget(items);
    setMobileCareerActiveItem(target);
}

function scheduleMobileCareerActiveStateUpdate() {
    if (mobileCareerFocusRaf) return;
    mobileCareerFocusRaf = requestAnimationFrame(() => {
        mobileCareerFocusRaf = null;
        updateMobileCareerActiveState();
    });
}

function teardownMobileCareerObserver() {
    if (mobileCareerObserver) {
        mobileCareerObserver.disconnect();
        mobileCareerObserver = null;
    }
    mobileCareerVisibility = new Map();
    mobileCareerObservedItems = [];
}

function applyMobileCareerObserverFocus() {
    if (mobileCareerManualMode) return;
    if (!mobileCareerObservedItems.length) return;

    let bestItem = null;
    let bestRatio = -1;
    mobileCareerObservedItems.forEach((item) => {
        const ratio = mobileCareerVisibility.get(item) || 0;
        if (ratio > bestRatio) {
            bestRatio = ratio;
            bestItem = item;
        }
    });

    if (bestItem && bestRatio > 0) {
        setMobileCareerActiveItem(bestItem);
    } else {
        scheduleMobileCareerActiveStateUpdate();
    }
}

function setupMobileCareerObserver() {
    teardownMobileCareerObserver();

    if (!isCareerMobileMode()) return;

    const timeline = document.getElementById('career-timeline');
    if (!timeline) return;

    mobileCareerObservedItems = Array.from(timeline.querySelectorAll('.career-item'));
    if (!mobileCareerObservedItems.length) return;

    if (!('IntersectionObserver' in window)) {
        scheduleMobileCareerActiveStateUpdate();
        return;
    }

    mobileCareerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                mobileCareerVisibility.set(entry.target, entry.intersectionRatio);
            } else {
                mobileCareerVisibility.delete(entry.target);
            }
        });
        applyMobileCareerObserverFocus();
    }, {
        root: null,
        threshold: [0.12, 0.25, 0.4, 0.6, 0.8],
        rootMargin: '-16% 0px -38% 0px'
    });

    mobileCareerObservedItems.forEach((item) => mobileCareerObserver.observe(item));
    scheduleMobileCareerActiveStateUpdate();
}

function getCareerById(careerId) {
    return CAREER_JOURNEY.find((career) => career.id === careerId);
}

function renderCareerTimeline() {
    const timeline = document.getElementById('career-timeline');
    if (!timeline) return;

    timeline.innerHTML = CAREER_JOURNEY.map((career, index) => {
        const checkpointClass = index === 0 ? 'career-checkpoint-latest' : 'career-checkpoint-past';
        const isLatest = index === 0;
        const cueColorClass = isLatest ? 'latest' : 'past';
        const latestTag = isLatest
            ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] tracking-wider uppercase font-mono-tech bg-green-500/15 text-green-300 border border-green-500/25 ml-2">Latest</span>'
            : '';

        return `
            <button type="button" data-career-id="${career.id}" class="career-item w-full text-left pl-8 pr-14 py-2 rounded-xl relative">
                <span class="career-checkpoint ${checkpointClass}"></span>
                <p class="text-xs text-gray-500 font-mono-tech tracking-wider uppercase mb-1">${career.period}</p>
                <h4 class="font-bold text-xl text-white mb-1">${career.role}${latestTag}</h4>
                <p class="text-gray-400 text-sm mb-2">${career.company} - ${career.location}</p>
                <p class="text-[#AAAAAA] text-sm leading-relaxed">${career.blurb}</p>
                <span class="career-hover-cue" aria-hidden="true">
                    <span class="career-hover-arrow ${cueColorClass} delay-1">&gt;</span>
                    <span class="career-hover-arrow ${cueColorClass} delay-2">&gt;</span>
                    <span class="career-hover-arrow ${cueColorClass} delay-3">&gt;</span>
                </span>
            </button>
        `;
    }).join('');
}

function openCareerDrawer(career) {
    const drawer = document.getElementById('career-drawer');
    const backdrop = document.getElementById('career-drawer-backdrop');
    const periodEl = document.getElementById('career-drawer-period');
    const titleEl = document.getElementById('career-drawer-title');
    const companyEl = document.getElementById('career-drawer-company');
    const contentEl = document.getElementById('career-drawer-content');

    if (!drawer || !backdrop || !periodEl || !titleEl || !companyEl || !contentEl) return;

    periodEl.textContent = career.period;
    titleEl.textContent = career.drawerHeading;

    if (career.companyUrl) {
        companyEl.innerHTML = `${career.organizationLabel || 'Company'}: <a href="${career.companyUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-neon hover:underline">${career.company}</a>`;
    } else {
        companyEl.textContent = `${career.organizationLabel || 'Company'}: ${career.company}`;
    }

    contentEl.innerHTML = career.drawerHtml || career.drawerText
        .map((line) => `<p>${line}</p>`)
        .join('');

    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    document.body.classList.add('overflow-hidden');
}

function closeCareerDrawer() {
    const drawer = document.getElementById('career-drawer');
    const backdrop = document.getElementById('career-drawer-backdrop');
    if (!drawer || !backdrop) return;

    drawer.classList.add('translate-x-full');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
}

function bindCareerEvents() {
    const timeline = document.getElementById('career-timeline');
    const closeBtn = document.getElementById('career-drawer-close');
    const backdrop = document.getElementById('career-drawer-backdrop');

    timeline?.addEventListener('click', (event) => {
        if (suppressCareerClick) {
            suppressCareerClick = false;
            event.preventDefault();
            return;
        }

        const trigger = event.target.closest('[data-career-id]');
        if (!trigger) return;

        const selectedCareer = getCareerById(trigger.getAttribute('data-career-id'));
        if (!selectedCareer) return;
        openCareerDrawer(selectedCareer);
    });

    timeline?.addEventListener('touchstart', (event) => {
        if (!isCareerMobileMode()) return;
        const trigger = event.target.closest('[data-career-id]');
        if (!trigger || !event.touches || !event.touches.length) return;

        const touch = event.touches[0];
        mobileCareerTouchStart = { x: touch.clientX, y: touch.clientY };
        cancelMobileCareerLongPressTimer();
        mobileCareerLongPressTimer = setTimeout(() => {
            setMobileCareerManualItem(trigger);
            suppressCareerClick = true;
            cancelMobileCareerLongPressTimer();
        }, CAREER_LONG_PRESS_MS);
    }, { passive: true });

    timeline?.addEventListener('touchmove', (event) => {
        if (!mobileCareerLongPressTimer || !mobileCareerTouchStart) return;
        if (!event.touches || !event.touches.length) return;

        const touch = event.touches[0];
        const dx = Math.abs(touch.clientX - mobileCareerTouchStart.x);
        const dy = Math.abs(touch.clientY - mobileCareerTouchStart.y);
        if (dx > CAREER_TOUCH_MOVE_CANCEL_PX || dy > CAREER_TOUCH_MOVE_CANCEL_PX) {
            cancelMobileCareerLongPressTimer();
        }
    }, { passive: true });

    timeline?.addEventListener('touchend', () => {
        mobileCareerTouchStart = null;
        cancelMobileCareerLongPressTimer();
    }, { passive: true });

    timeline?.addEventListener('touchcancel', () => {
        mobileCareerTouchStart = null;
        cancelMobileCareerLongPressTimer();
    }, { passive: true });

    closeBtn?.addEventListener('click', closeCareerDrawer);
    backdrop?.addEventListener('click', closeCareerDrawer);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCareerDrawer();
        }
    });

    window.addEventListener('scroll', () => {
        releaseMobileCareerManualModeOnScroll();
        scheduleMobileCareerActiveStateUpdate();
    }, { passive: true });
    document.addEventListener('scroll', () => {
        releaseMobileCareerManualModeOnScroll();
        scheduleMobileCareerActiveStateUpdate();
    }, { passive: true, capture: true });
    window.addEventListener('touchmove', () => {
        releaseMobileCareerManualModeOnScroll();
        scheduleMobileCareerActiveStateUpdate();
    }, { passive: true });
    window.addEventListener('resize', () => {
        if (!isCareerMobileMode()) {
            clearMobileCareerManualMode();
        }
        setupMobileCareerObserver();
        scheduleMobileCareerActiveStateUpdate();
    });
    window.addEventListener('orientationchange', () => {
        if (!isCareerMobileMode()) {
            clearMobileCareerManualMode();
        }
        setupMobileCareerObserver();
        scheduleMobileCareerActiveStateUpdate();
    });
}

function initCareerJourney() {
    renderCareerTimeline();
    bindCareerEvents();
    setupMobileCareerObserver();
    scheduleMobileCareerActiveStateUpdate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCareerJourney);
} else {
    initCareerJourney();
}

