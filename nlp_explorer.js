const NLP_EXPLORER_ICON_PATHS = {
    transformer: '<path d="M12 2 4 6v12l8 4 8-4V6l-8-4Z"/><path d="m4 6 8 4 8-4m-8 4v12M8 4v4m8-4v4"/>',
    extraction: '<path d="M4 5h16v14H4zM8 9h8m-8 4h5m-5 3h3"/><path d="m17 13 2 2-2 2"/>',
    classification: '<path d="M3 6h8l2 2h8v11H3V6Z"/><path d="M7 12h10m-10 4h6"/>',
    similarity: '<circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9.2 9.2 14.8 14.8M14 5h6m-3-3v6M4 17h6"/>',
    preparation: '<path d="M4 4h16v16H4zM8 8h8m-8 4h8m-8 4h5"/><path d="m17 15 2 2-2 2"/>',
    evaluation: '<path d="M4 20V4m0 16h16M8 15l4-4 3 2 5-7"/><circle cx="20" cy="6" r="1" fill="currentColor" stroke="none"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m4 12 5 5L20 6"/>'
};

function nlpExplorerIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NLP_EXPLORER_ICON_PATHS[name]}</svg>`;
}

// Framework badges are separate from techniques: model names and methods remain visible below.
const NLP_EXPLORER_CATEGORIES = [
    {
        title: 'Transformer NLP', layer: 'Core · Model foundations', icon: 'transformer',
        description: 'Transformer encoders and sentence models support classification, extraction, and language understanding.',
        tools: [{ name: 'Hugging Face Transformers', logo: 'hugging-face' }, { name: 'Sentence Transformers', mark: 'ST' }],
        skills: ['BERT and RoBERTa', 'Sentence-BERT', 'Token and sequence classification', 'Domain model selection']
    },
    {
        title: 'Information Extraction', layer: 'Core · Structured signals', icon: 'extraction',
        description: 'Extract entities and relationships from unstructured text using statistical models and precise rules.',
        tools: [{ name: 'spaCy', logo: 'spacy' }, { name: 'Hugging Face Transformers', logo: 'hugging-face' }, { name: 'Microsoft Presidio', mark: 'P' }],
        skills: ['Named entity recognition', 'Entity and relation extraction', 'Part-of-speech tagging', 'Rule-based matching']
    },
    {
        title: 'Text Classification', layer: 'Core · Document understanding', icon: 'classification',
        description: 'Assign useful labels to text with transformer models and strong classical baselines.',
        tools: [{ name: 'Hugging Face Transformers', logo: 'hugging-face' }, { name: 'scikit-learn', logo: 'scikit-learn' }],
        skills: ['Document classification', 'Intent detection', 'Sentiment analysis', 'Class imbalance handling']
    },
    {
        title: 'Semantic Retrieval', layer: 'Core · Meaning and relevance', icon: 'similarity',
        description: 'Combine embedding-based matching with lexical baselines for search and relevance ranking.',
        tools: [{ name: 'Sentence Transformers', mark: 'ST' }, { name: 'Milvus', logo: 'milvus' }, { name: 'scikit-learn', logo: 'scikit-learn' }],
        skills: ['Sentence embeddings and cosine similarity', 'Semantic retrieval and reranking', 'BM25 and TF-IDF baselines', 'Retrieval evaluation']
    },
    {
        title: 'Text Processing & Privacy', layer: 'Core · Clean and protected text', icon: 'preparation',
        description: 'Prepare text for models while detecting and removing sensitive information when required.',
        tools: [{ name: 'spaCy', logo: 'spacy' }, { name: 'Microsoft Presidio', mark: 'P' }],
        skills: ['Tokenization and normalization', 'Regex and linguistic rules', 'Part-of-speech features', 'PII detection and redaction']
    },
    {
        title: 'Training & Evaluation', layer: 'Core · Model quality', icon: 'evaluation',
        description: 'Adapt NLP models to a task and evaluate where their predictions succeed or fail.',
        tools: [{ name: 'Hugging Face Transformers', logo: 'hugging-face' }, { name: 'scikit-learn', logo: 'scikit-learn' }, { name: 'Sentence Transformers', mark: 'ST' }],
        skills: ['Task-specific fine-tuning', 'Precision, recall, and F1', 'Error analysis', 'Retrieval evaluation']
    }
];

function nlpExplorerToolMarkup(tool) {
    const artwork = tool.logo
        ? `<img src="assets/skill-logos/${tool.logo}.svg" alt="">`
        : `<span class="nlp-explorer__monogram" aria-hidden="true">${tool.mark}</span>`;
    return `<span class="genai-explorer__skill"><span class="genai-explorer__logo nlp-explorer__logo--${tool.logo || 'mark'}">${artwork}</span><span>${tool.name}</span></span>`;
}

function initNLPExplorer() {
    const tabs = document.getElementById('nlp-explorer-tabs');
    const panel = document.getElementById('nlp-explorer-panel');
    const counter = document.getElementById('nlp-explorer-count');
    if (!tabs || !panel || !counter) return;

    tabs.innerHTML = NLP_EXPLORER_CATEGORIES.map((category, index) => `
        <button class="genai-explorer__tab" id="nlp-tab-${index}" type="button" role="tab" aria-controls="nlp-explorer-panel" aria-selected="false" tabindex="-1" data-index="${index}">
            <span class="genai-explorer__tab-icon">${nlpExplorerIcon(category.icon)}</span>
            <span>${category.title}</span>
            <span class="genai-explorer__tab-arrow">${nlpExplorerIcon('arrow')}</span>
        </button>
    `).join('');

    let toolCarouselTimer = null;
    function selectCategory(index, focusTab = false) {
        const category = NLP_EXPLORER_CATEGORIES[index];
        if (!category) return;
        if (toolCarouselTimer) clearInterval(toolCarouselTimer);

        tabs.querySelectorAll('[role="tab"]').forEach((tab, tabIndex) => {
            const selected = tabIndex === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        panel.setAttribute('aria-labelledby', `nlp-tab-${index}`);
        counter.textContent = `${index + 1} / ${NLP_EXPLORER_CATEGORIES.length}`;
        const rotates = category.tools.length > 2;
        panel.innerHTML = `
            <p class="genai-explorer__kicker">${category.layer}</p>
            <h4 class="genai-explorer__title">${category.title}</h4>
            <p class="genai-explorer__description">${category.description}</p>
            <div class="genai-explorer__divider"></div>
            <span class="genai-explorer__section-label">Tools and Frameworks</span>
            <div class="genai-explorer__skills${rotates ? ' is-rotating' : ''}" aria-live="off">${category.tools.slice(0, 2).map(nlpExplorerToolMarkup).join('')}</div>
            <div class="genai-explorer__divider genai-explorer__capabilities-divider"></div>
            <span class="genai-explorer__section-label genai-explorer__capabilities-label">Skills and Methods</span>
            <ul class="genai-explorer__capabilities">${category.skills.map(skill => `<li>${nlpExplorerIcon('check')}<span>${skill}</span></li>`).join('')}</ul>
        `;

        if (rotates) {
            const toolRow = panel.querySelector('.genai-explorer__skills');
            let nextIndex = 0;
            toolCarouselTimer = setInterval(() => {
                nextIndex = (nextIndex + 2) % category.tools.length;
                toolRow.innerHTML = [category.tools[nextIndex], category.tools[(nextIndex + 1) % category.tools.length]].map(nlpExplorerToolMarkup).join('');
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
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % NLP_EXPLORER_CATEGORIES.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + NLP_EXPLORER_CATEGORIES.length) % NLP_EXPLORER_CATEGORIES.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = NLP_EXPLORER_CATEGORIES.length - 1;
        else return;
        event.preventDefault();
        selectCategory(next, true);
    });
    selectCategory(0);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNLPExplorer);
else initNLPExplorer();
