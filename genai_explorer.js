// The portfolio's Generative AI skills, grouped by their role in a production system.
const GENAI_ICON_PATHS = {
    agents: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="9" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v3h6v3m6-6v3h-6"/>',
    search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5M8.5 10.5h4m-2-2v4"/>',
    model: '<path d="M12 2 4 6v12l8 4 8-4V6l-8-4Z"/><path d="m4 6 8 4 8-4m-8 4v12"/>',
    structured: '<path d="M8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3m8-16h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M9 8l-3 4 3 4m6-8 3 4-3 4"/>',
    prompt: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    external: '<path d="M7 17 17 7M9 7h8v8"/>',
    rag: '<circle cx="9.5" cy="9.5" r="4.5"/><path d="m13 13 5.5 5.5M7.5 9.5h4m-2-2v4"/>',
    multi: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6.5 7.5 10.5 16m7-8.5L13.5 16M7 6h10"/>'
};

function genaiIcon(name, className = '') {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GENAI_ICON_PATHS[name]}</svg>`;
}

const GENAI_CATEGORIES = [
    {
        title: 'AI Agents',
        layer: 'Orchestration & State Machines',
        icon: 'agents',
        description: 'I build workflows that coordinate specialized agents, maintain state, and execute multi-step tasks.',
        skills: [
            { name: 'LangGraph', logo: 'langgraph' },
            { name: 'LangChain', logo: 'langchain' },
            { name: 'AutoGen', logo: 'autogen' },
            { name: 'Microsoft Agent Framework', logo: 'microsoft-agent-framework', extension: 'png' },
            { name: 'Multi-Agent Systems', icon: 'multi' }
        ],
        capabilities: ['Stateful agent workflows', 'Specialist agent handoffs', 'Multi-step task execution', 'Review and correction loops'],
        project: { name: 'Healthcare ETL validation multi-agent system', href: 'projects/etl_validation_mas/' }
    },
    {
        title: 'RAG & Search',
        layer: 'Retrieval & State Management',
        icon: 'search',
        description: 'I connect AI systems to relevant knowledge so answers and decisions can use retrieved evidence.',
        skills: [
            { name: 'Agentic RAG', icon: 'rag' },
            { name: 'Milvus', logo: 'milvus' },
            { name: 'ChromaDB', logo: 'chroma' }
        ],
        capabilities: ['Vector-based retrieval', 'Knowledge-grounded answers', 'Semantic search', 'Retrieval within agent workflows'],
        project: { name: 'Clinical Assistant AI', href: 'projects/clinical_assistant_ai/' }
    },
    {
        title: 'Models & Inference',
        layer: 'Cognitive Core & Infrastructure',
        icon: 'model',
        description: 'I integrate managed language models into healthcare AI applications and agent workflows.',
        skills: [
            { name: 'Azure OpenAI', logo: 'azure-openai' }
        ],
        capabilities: ['Managed model integration', 'Application-level inference', 'Model responses in workflows'],
        project: { name: 'Preferred Drug Assignment', href: 'projects/preferred_drug_assignment/' }
    },
    {
        title: 'Structured Outputs',
        layer: 'Tooling & Determinism',
        icon: 'structured',
        description: 'I use typed schemas to turn model responses into data that downstream steps can validate and use.',
        skills: [
            { name: 'Pydantic Structured Output', logo: 'pydantic' }
        ],
        capabilities: ['Typed response schemas', 'Output validation', 'Predictable agent handoffs'],
        project: { name: 'Preferred Drug Assignment', href: 'projects/preferred_drug_assignment/' }
    },
    {
        title: 'Prompt & Context',
        layer: 'Context Engineering',
        icon: 'prompt',
        description: 'I shape instructions and task context so models respond to the right evidence and business goal.',
        skills: [
            { name: 'Prompt Engineering', icon: 'prompt' }
        ],
        capabilities: ['Task-specific instructions', 'Relevant context assembly', 'Clear output requirements'],
        project: { name: 'Clinical Assistant AI', href: 'projects/clinical_assistant_ai/' }
    }
];

function genaiSkillMarkup(skill) {
    let artwork;
    if (skill.logo === 'azure-openai') {
        artwork = '<span class="genai-explorer__logo-pair"><img src="assets/skill-logos/azure.svg" alt=""><img src="assets/skill-logos/openai.svg" alt=""></span>';
    } else if (skill.logo) {
        artwork = `<img src="assets/skill-logos/${skill.logo}.${skill.extension || 'svg'}" alt="">`;
    } else {
        artwork = genaiIcon(skill.icon);
    }
    return `<span class="genai-explorer__skill"><span class="genai-explorer__logo genai-explorer__logo--${skill.logo || 'concept'}">${artwork}</span><span>${skill.name}</span></span>`;
}

function initGenAIExplorer() {
    const tabs = document.getElementById('genai-explorer-tabs');
    const panel = document.getElementById('genai-explorer-panel');
    const counter = document.getElementById('genai-explorer-count');
    if (!tabs || !panel || !counter) return;

    tabs.innerHTML = GENAI_CATEGORIES.map((category, index) => `
        <button class="genai-explorer__tab" id="genai-tab-${index}" type="button" role="tab" aria-controls="genai-explorer-panel" aria-selected="false" tabindex="-1" data-index="${index}">
            <span class="genai-explorer__tab-icon">${genaiIcon(category.icon)}</span>
            <span>${category.title}</span>
            <span class="genai-explorer__tab-arrow">${genaiIcon('arrow')}</span>
        </button>
    `).join('');

    let skillCarouselTimer = null;

    function selectCategory(index, focusTab = false) {
        const category = GENAI_CATEGORIES[index];
        if (!category) return;
        if (skillCarouselTimer) clearInterval(skillCarouselTimer);

        tabs.querySelectorAll('[role="tab"]').forEach((tab, tabIndex) => {
            const selected = tabIndex === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        panel.setAttribute('aria-labelledby', `genai-tab-${index}`);
        counter.textContent = `${index + 1} / ${GENAI_CATEGORIES.length}`;
        panel.innerHTML = `
            <p class="genai-explorer__kicker">${category.layer}</p>
            <h4 class="genai-explorer__title">${category.title}</h4>
            <p class="genai-explorer__description">${category.description}</p>
            <div class="genai-explorer__divider"></div>
            <span class="genai-explorer__section-label">Tools and Frameworks</span>
            <div class="genai-explorer__skills${category.skills.length > 2 ? ' is-rotating' : ''}" aria-live="off">${(category.skills.length > 2 ? category.skills.slice(0, 2) : category.skills).map(genaiSkillMarkup).join('')}</div>
            <div class="genai-explorer__divider genai-explorer__capabilities-divider"></div>
            <span class="genai-explorer__section-label genai-explorer__capabilities-label">What I build</span>
            <ul class="genai-explorer__capabilities">${category.capabilities.map(capability => `<li>${genaiIcon('check')}<span>${capability}</span></li>`).join('')}</ul>
            <div class="genai-explorer__divider"></div>
            <span class="genai-explorer__project-label">Project example</span>
            <a class="genai-explorer__project" href="${category.project.href}">${category.project.name}${genaiIcon('external')}</a>
        `;
        if (category.skills.length > 2) {
            const skillsRow = panel.querySelector('.genai-explorer__skills');
            let nextIndex = 0;
            skillCarouselTimer = setInterval(() => {
                nextIndex = (nextIndex + 2) % category.skills.length;
                skillsRow.innerHTML = [
                    category.skills[nextIndex],
                    category.skills[(nextIndex + 1) % category.skills.length]
                ].map(genaiSkillMarkup).join('');
            }, 2000);
        }
        if (focusTab) tabs.querySelectorAll('[role="tab"]')[index].focus();
    }

    tabs.addEventListener('click', event => {
        const tab = event.target.closest('[role="tab"]');
        if (tab && tabs.contains(tab)) selectCategory(Number(tab.dataset.index));
    });

    tabs.addEventListener('keydown', event => {
        const current = event.target.closest('[role="tab"]');
        if (!current) return;
        const index = Number(current.dataset.index);
        let next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % GENAI_CATEGORIES.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + GENAI_CATEGORIES.length) % GENAI_CATEGORIES.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = GENAI_CATEGORIES.length - 1;
        else return;
        event.preventDefault();
        selectCategory(next, true);
    });

    selectCategory(0);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGenAIExplorer);
} else {
    initGenAIExplorer();
}
