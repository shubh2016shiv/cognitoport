const ML_ICON_PATHS = {
    data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    features: '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="9" cy="5" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="11" cy="19" r="2" fill="currentColor" stroke="none"/>',
    machine: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 14 12 9l3 5M9 17h6M2 9h2m-2 6h2m16-6h2m-2 6h2"/>',
    deep: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="12" r="2"/><path d="m6.5 10.5 4-4m3 0 4 4m0 3-4 4m-3 0-4-4"/>',
    evaluation: '<path d="M4 20V4m0 16h16M8 15l4-4 3 2 5-7"/><circle cx="20" cy="6" r="1" fill="currentColor" stroke="none"/>',
    sql: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m4 12 5 5L20 6"/>'
};

function mlIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ML_ICON_PATHS[name]}</svg>`;
}

const ML_CATEGORIES = [
    {
        title: 'Data Preparation', layer: 'Data foundations', icon: 'data',
        description: 'I prepare and organize data so it is ready for analysis, feature engineering, and model training.',
        skills: [{ name: 'NumPy', logo: 'numpy' }, { name: 'Pandas', logo: 'pandas' }, { name: 'SQL', icon: 'sql' }, { name: 'PySpark', logo: 'apache-spark' }],
        capabilities: ['Tabular data preparation', 'Numerical processing', 'SQL-based data access', 'Distributed data processing']
    },
    {
        title: 'Feature Engineering', layer: 'Preparing model inputs', icon: 'features',
        description: 'I turn raw data into useful model inputs and apply the right transformations before training.',
        skills: [{ name: 'NumPy', logo: 'numpy' }, { name: 'Pandas', logo: 'pandas' }, { name: 'scikit-learn', logo: 'scikit-learn' }],
        capabilities: ['Feature extraction', 'Categorical encoding', 'Numerical scaling']
    },
    {
        title: 'Machine Learning', layer: 'Predictive modeling', icon: 'machine',
        description: 'I build models for prediction, classification, and patterns in structured data.',
        skills: [{ name: 'scikit-learn', logo: 'scikit-learn' }, { name: 'XGBoost', logo: 'xgboost' }],
        capabilities: ['Classification', 'Regression', 'Clustering']
    },
    {
        title: 'Deep Learning', layer: 'Neural network development', icon: 'deep',
        description: 'I build and train neural networks for problems that benefit from learned representations.',
        skills: [{ name: 'PyTorch', logo: 'pytorch' }, { name: 'TensorFlow', logo: 'tensorflow' }],
        capabilities: ['Neural networks', 'LSTM models', 'Model training']
    },
    {
        title: 'Model Evaluation', layer: 'Measurement & tuning', icon: 'evaluation',
        description: 'I assess model quality with suitable validation strategies and tune models against clear metrics.',
        skills: [{ name: 'scikit-learn', logo: 'scikit-learn' }],
        capabilities: ['Cross-validation', 'Precision and recall', 'F1-score', 'Hyperparameter tuning']
    }
];

function mlSkillMarkup(skill) {
    const artwork = skill.logo
        ? `<img src="assets/skill-logos/${skill.logo}.svg" alt="">`
        : mlIcon(skill.icon);
    return `<span class="genai-explorer__skill"><span class="genai-explorer__logo ml-explorer__logo--${skill.logo || skill.icon}">${artwork}</span><span>${skill.name}</span></span>`;
}

function initMLExplorer() {
    const tabs = document.getElementById('ml-explorer-tabs');
    const panel = document.getElementById('ml-explorer-panel');
    const counter = document.getElementById('ml-explorer-count');
    if (!tabs || !panel || !counter) return;

    tabs.innerHTML = ML_CATEGORIES.map((category, index) => `
        <button class="genai-explorer__tab" id="ml-tab-${index}" type="button" role="tab" aria-controls="ml-explorer-panel" aria-selected="false" tabindex="-1" data-index="${index}">
            <span class="genai-explorer__tab-icon">${mlIcon(category.icon)}</span>
            <span>${category.title}</span>
            <span class="genai-explorer__tab-arrow">${mlIcon('arrow')}</span>
        </button>
    `).join('');

    let skillCarouselTimer = null;
    function selectCategory(index, focusTab = false) {
        const category = ML_CATEGORIES[index];
        if (!category) return;
        if (skillCarouselTimer) clearInterval(skillCarouselTimer);

        tabs.querySelectorAll('[role="tab"]').forEach((tab, tabIndex) => {
            const selected = tabIndex === index;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
        });
        panel.setAttribute('aria-labelledby', `ml-tab-${index}`);
        counter.textContent = `${index + 1} / ${ML_CATEGORIES.length}`;
        const hasCarousel = category.skills.length > 2;
        panel.innerHTML = `
            <p class="genai-explorer__kicker">${category.layer}</p>
            <h4 class="genai-explorer__title">${category.title}</h4>
            <p class="genai-explorer__description">${category.description}</p>
            <div class="genai-explorer__divider"></div>
            <span class="genai-explorer__section-label">Tools and Frameworks</span>
            <div class="genai-explorer__skills${hasCarousel ? ' is-rotating' : ''}" aria-live="off">${category.skills.slice(0, 2).map(mlSkillMarkup).join('')}</div>
            <div class="genai-explorer__divider genai-explorer__capabilities-divider"></div>
            <span class="genai-explorer__section-label genai-explorer__capabilities-label">Skills and Methods</span>
            <ul class="genai-explorer__capabilities">${category.capabilities.map(capability => `<li>${mlIcon('check')}<span>${capability}</span></li>`).join('')}</ul>
        `;

        if (hasCarousel) {
            const skillsRow = panel.querySelector('.genai-explorer__skills');
            let nextIndex = 0;
            skillCarouselTimer = setInterval(() => {
                nextIndex = (nextIndex + 2) % category.skills.length;
                skillsRow.innerHTML = [category.skills[nextIndex], category.skills[(nextIndex + 1) % category.skills.length]].map(mlSkillMarkup).join('');
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
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % ML_CATEGORIES.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + ML_CATEGORIES.length) % ML_CATEGORIES.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = ML_CATEGORIES.length - 1;
        else return;
        event.preventDefault();
        selectCategory(next, true);
    });
    selectCategory(0);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMLExplorer);
else initMLExplorer();
