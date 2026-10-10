const OPS_ICON_PATHS = {
    serving: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-13 5 2 2-2 2m5 0h4"/>',
    containers: '<path d="M12 2 4 6v12l8 4 8-4V6l-8-4Z"/><path d="m4 6 8 4 8-4m-8 4v12"/>',
    cicd: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7v10m2-5h8M13 5l5 7"/>',
    observability: '<path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M3 4h18v16H3z"/>',
    reliability: '<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"/><path d="m8 12 3 3 5-6"/>',
    security: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m4 12 5 5L20 6"/>'
};

function opsIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OPS_ICON_PATHS[name]}</svg>`;
}

const OPS_CATEGORIES = [
    {
        title: 'AI Application Serving', layer: 'APIs & Inference', icon: 'serving',
        description: 'Expose AI capabilities through responsive APIs and managed application endpoints.',
        tools: [{ name: 'FastAPI', logo: 'fastapi' }, { name: 'Uvicorn', mark: 'UV' }, { name: 'Azure App Service', azure: 'APP' }, { name: 'Azure Functions', azure: 'FX' }],
        skills: ['REST API design', 'Asynchronous inference', 'Streaming responses']
    },
    {
        title: 'Containers & Deployment', layer: 'Packaging & Scale', icon: 'containers',
        description: 'Package applications as containers and run them on managed or orchestrated platforms.',
        tools: [{ name: 'Docker', logo: 'docker' }, { name: 'Kubernetes', logo: 'kubernetes' }, { name: 'Azure Container Apps', azure: 'CA' }, { name: 'Azure Kubernetes Service', azure: 'AKS' }],
        skills: ['Containerization', 'Service deployment', 'Scaling and rollout']
    },
    {
        title: 'CI/CD & Infrastructure', layer: 'Repeatable Delivery', icon: 'cicd',
        description: 'Automate build and release steps and define infrastructure consistently.',
        tools: [{ name: 'GitHub Actions', logo: 'github-actions' }, { name: 'Azure DevOps', logo: 'azure-devops' }, { name: 'Terraform', logo: 'terraform' }],
        skills: ['CI/CD pipelines', 'Infrastructure as code', 'Automated releases']
    },
    {
        title: 'AI Observability', layer: 'Signals & Diagnostics', icon: 'observability',
        description: 'Trace requests and monitor AI services for latency, failures, and usage.',
        tools: [{ name: 'Azure Monitor', azure: 'MON' }, { name: 'Application Insights', azure: 'AI' }, { name: 'OpenTelemetry', logo: 'opentelemetry' }],
        skills: ['Distributed tracing', 'Latency monitoring', 'Token usage tracking']
    },
    {
        title: 'AI Reliability & Performance', layer: 'Resilience & Throughput', icon: 'reliability',
        description: 'Control load and recover gracefully when model endpoints are slow or unavailable.',
        tools: [{ name: 'Redis', logo: 'redis' }, { name: 'Azure API Management', azure: 'API' }, { name: 'Azure OpenAI', azure: 'AOAI' }],
        skills: ['Caching', 'Rate limiting', 'Retry with backoff', 'Model fallback']
    },
    {
        title: 'Security & Operations', layer: 'Identity & Configuration', icon: 'security',
        description: 'Keep credentials protected and grant services only the access they need.',
        tools: [{ name: 'Azure Key Vault', azure: 'KV' }, { name: 'Managed Identity', azure: 'ID' }, { name: 'Azure RBAC', azure: 'RBAC' }],
        skills: ['Secrets management', 'Access control', 'Secure configuration']
    }
];

function opsToolMarkup(tool) {
    const artwork = tool.logo
        ? `<img src="assets/skill-logos/${tool.logo}.svg" alt="">`
        : tool.azure
            ? `<span class="ops-explorer__azure-mark" aria-hidden="true"><img src="assets/skill-logos/azure.svg" alt=""><b>${tool.azure}</b></span>`
            : `<span class="ops-explorer__monogram" aria-hidden="true">${tool.mark}</span>`;
    return `<span class="genai-explorer__skill"><span class="genai-explorer__logo ops-explorer__logo--${tool.logo || 'concept'}">${artwork}</span><span>${tool.name}</span></span>`;
}

function initOpsExplorer() {
    const tabs = document.getElementById('ops-explorer-tabs');
    const panel = document.getElementById('ops-explorer-panel');
    const counter = document.getElementById('ops-explorer-count');
    if (!tabs || !panel || !counter) return;

    tabs.innerHTML = OPS_CATEGORIES.map((category, index) => `
        <button class="genai-explorer__tab" id="ops-tab-${index}" type="button" role="tab" aria-controls="ops-explorer-panel" aria-selected="false" tabindex="-1" data-index="${index}">
            <span class="genai-explorer__tab-icon">${opsIcon(category.icon)}</span>
            <span>${category.title}</span>
            <span class="genai-explorer__tab-arrow">${opsIcon('arrow')}</span>
        </button>
    `).join('');

    let toolCarouselTimer = null;
    function selectCategory(index, focusTab = false) {
        const category = OPS_CATEGORIES[index];
        if (!category) return;
        if (toolCarouselTimer) clearInterval(toolCarouselTimer);

        tabs.querySelectorAll('[role="tab"]').forEach((tab, tabIndex) => {
            const selected = tabIndex === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        panel.setAttribute('aria-labelledby', `ops-tab-${index}`);
        counter.textContent = `${index + 1} / ${OPS_CATEGORIES.length}`;
        const rotates = category.tools.length > 2;
        panel.innerHTML = `
            <p class="genai-explorer__kicker">${category.layer}</p>
            <h4 class="genai-explorer__title">${category.title}</h4>
            <p class="genai-explorer__description">${category.description}</p>
            <div class="genai-explorer__divider"></div>
            <span class="genai-explorer__section-label">Tools and Frameworks</span>
            <div class="genai-explorer__skills${rotates ? ' is-rotating' : ''}" aria-live="off">${category.tools.slice(0, 2).map(opsToolMarkup).join('')}</div>
            <div class="genai-explorer__divider genai-explorer__capabilities-divider"></div>
            <span class="genai-explorer__section-label genai-explorer__capabilities-label">Engineering Skills</span>
            <ul class="genai-explorer__capabilities">${category.skills.map(skill => `<li>${opsIcon('check')}<span>${skill}</span></li>`).join('')}</ul>
        `;

        if (rotates) {
            const toolRow = panel.querySelector('.genai-explorer__skills');
            let nextIndex = 0;
            toolCarouselTimer = setInterval(() => {
                nextIndex = (nextIndex + 2) % category.tools.length;
                toolRow.innerHTML = [category.tools[nextIndex], category.tools[(nextIndex + 1) % category.tools.length]].map(opsToolMarkup).join('');
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
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % OPS_CATEGORIES.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + OPS_CATEGORIES.length) % OPS_CATEGORIES.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = OPS_CATEGORIES.length - 1;
        else return;
        event.preventDefault();
        selectCategory(next, true);
    });
    selectCategory(0);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initOpsExplorer);
else initOpsExplorer();
