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
        companyUrl: '',
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
        period: 'September 2022 - August 2023',
        role: 'M.Sc in Artificial Intelligence',
        company: 'Birmingham City University',
        companyUrl: '',
        location: 'Birmingham, UK',
        blurb: 'Completed postgraduate specialization in AI with focus on machine learning and applied intelligent systems.',
        drawerHeading: 'M.Sc in Artificial Intelligence',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'Academic focus areas, projects, and research contributions will be included.'
        ]
    },
    {
        id: 'citibank-software-developer',
        period: '2016 - 2022',
        role: 'Software Developer',
        company: 'Citibank',
        companyUrl: '',
        location: 'Pune, India',
        blurb: 'Built secure and scalable backend systems with strong engineering standards for financial workloads.',
        drawerHeading: 'Software Developer at Citibank',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'This section will include platform responsibilities and engineering achievements.'
        ]
    }
];

function getCareerById(careerId) {
    return CAREER_JOURNEY.find((career) => career.id === careerId);
}

function renderCareerTimeline() {
    const timeline = document.getElementById('career-timeline');
    if (!timeline) return;

    timeline.innerHTML = CAREER_JOURNEY.map((career, index) => {
        const checkpointClass = index === 0 ? 'career-checkpoint-latest' : 'career-checkpoint-past';
        const isLatest = index === 0;
        const latestTag = isLatest
            ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-[10px] tracking-wider uppercase font-mono-tech bg-green-500/15 text-green-300 border border-green-500/25 ml-2">Latest</span>'
            : '';

        return `
            <button type="button" data-career-id="${career.id}" class="career-item w-full text-left pl-8 pr-4 py-2 rounded-xl relative">
                <span class="career-checkpoint ${checkpointClass}"></span>
                <p class="text-xs text-gray-500 font-mono-tech tracking-wider uppercase mb-1">${career.period}</p>
                <h4 class="font-bold text-xl text-white mb-1">${career.role}${latestTag}</h4>
                <p class="text-gray-400 text-sm mb-2">${career.company} - ${career.location}</p>
                <p class="text-[#AAAAAA] text-sm leading-relaxed">${career.blurb}</p>
                <span class="inline-block mt-3 text-[11px] uppercase tracking-wider font-mono-tech text-cyan-neon">Open details panel</span>
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
        companyEl.innerHTML = `Company: <a href="${career.companyUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-neon hover:underline">${career.company}</a>`;
    } else {
        companyEl.textContent = `Company: ${career.company}`;
    }

    contentEl.innerHTML = career.drawerText
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
        const trigger = event.target.closest('[data-career-id]');
        if (!trigger) return;

        const selectedCareer = getCareerById(trigger.getAttribute('data-career-id'));
        if (!selectedCareer) return;
        openCareerDrawer(selectedCareer);
    });

    closeBtn?.addEventListener('click', closeCareerDrawer);
    backdrop?.addEventListener('click', closeCareerDrawer);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCareerDrawer();
        }
    });
}

function initCareerJourney() {
    renderCareerTimeline();
    bindCareerEvents();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCareerJourney);
} else {
    initCareerJourney();
}

