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
        drawerHeading: 'Lead Machine Learning Engineer at DataConsol',
        drawerText: [
            'Detailed professional experience content will be added here.',
            'This section will include project highlights, business impact, and team contributions.',
            'Technologies used and architecture details will also be listed here.'
        ]
    },
    {
        id: 'nitor-generative-ai-developer',
        period: 'August 2024 – January 2026',
        role: 'Generative AI Engineer, Healthcare',
        company: 'Nitor Infotech',
        drawerCompany: 'Nitor Infotech, Pune',
        drawerClient: 'RhythmX (now GW RhythmX)',
        companyUrl: 'https://www.nitorinfotech.com/',
        location: 'Pune, India',
        drawerHeading: 'Generative AI Engineer, Healthcare',
        drawerHtml: `
            <div class="space-y-6">
                <p>I built a clinical AI assistant for RhythmX, a healthcare AI company whose platform helps physicians decide next steps during a patient visit using patient history, guidelines, payer rules and formulary data. I worked on retrieval, tool use, LLM reasoning and production reliability.</p>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Skills</p>
                    <table class="w-full text-left text-sm border-collapse">
                        <tbody class="divide-y divide-white/10">
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold w-2/5">GenAI</th><td class="py-3">${renderCareerSkillChips(['RAG', 'Hybrid search', 'Tool calling', 'Streaming responses', 'Azure OpenAI', 'OpenAI o1'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">Data</th><td class="py-3">${renderCareerSkillChips(['Milvus (vector search)', 'MongoDB', 'Redis', 'FHIR'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">Backend</th><td class="py-3">${renderCareerSkillChips(['Async pipelines', 'Microservices', 'Load balancing and failover'])}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Clinical AI Assistant</p>
                    <ul class="space-y-3">
                        <li><strong class="text-white">Problem:</strong> Physicians need answers that reflect the individual patient and current guidelines, and need them within seconds during a visit.</li>
                        <li><strong class="text-white">What I built:</strong> An assistant that streams cited, personalised answers by combining the patient’s FHIR record, conversation history in Redis, retrieval over 60+ US comorbidity guidelines in Milvus, and tool calls for real-time drug and insurance coverage.</li>
                        <li><strong class="text-white">Result:</strong> I cut p99 response latency from 20s to under 5s under concurrent load by fetching patient data in parallel from MongoDB and running hybrid vector search asynchronously.</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Medication and Formulary Recommendations</p>
                    <ul class="space-y-3">
                        <li><strong class="text-white">Problem:</strong> Prescribers have to weigh a patient’s insurance coverage (drug tiers and restrictions) against thousands of drug options.</li>
                        <li><strong class="text-white">What I built:</strong> A RAG workflow that recommends patient-specific formulary options, and an o1-based reasoning step that filters 2,000+ drugs down to the physician’s own preferred list.</li>
                        <li><strong class="text-white">Result:</strong> 94.7% therapeutic-class accuracy and 86% precision. Clinicians prescribe from a short, relevant list instead of the full formulary.</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">LLM Reliability</p>
                    <ul class="space-y-3">
                        <li><strong class="text-white">Problem:</strong> Azure OpenAI sets a tokens-per-minute quota, and peak usage hit it, failing requests with 429 errors.</li>
                        <li><strong class="text-white">What I built:</strong> A central token-allocation microservice that reserves tokens before each request, routes to the least-loaded deployment, fails over automatically across regions, and queues overflow requests.</li>
                        <li><strong class="text-white">Result:</strong> No request failures from token-limit breaches during peak usage.</li>
                    </ul>
                </div>
            </div>`
    },
    {
        id: 'faraday-ml-engineer',
        period: 'March 2023 – June 2024',
        role: 'Machine Learning Engineer',
        company: 'Faraday Battery',
        drawerCompany: 'Faraday Battery, Birmingham, UK',
        companyUrl: 'https://www.faradaybattery.in/',
        location: 'Birmingham, UK',
        drawerHeading: 'Machine Learning Engineer',
        drawerHtml: `
            <div class="space-y-6">
                <p>Faraday Battery makes rechargeable battery packs for large electric vehicles, and its customers need to know when a battery cell needs maintenance. I built the cloud ML systems for that: models that predict battery charge, health and remaining life, plus the data and deployment pipelines around them.</p>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Skills</p>
                    <table class="w-full text-left text-sm border-collapse">
                        <tbody class="divide-y divide-white/10">
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold w-2/5">ML / AI</th><td class="py-3">${renderCareerSkillChips(['Python', 'CNNs', 'Computer vision', 'Anomaly detection', 'LLMs (Ollama)'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">AWS</th><td class="py-3">${renderCareerSkillChips(['Lambda', 'ECS Anywhere', 'ECR', 'S3', 'DynamoDB', 'API Gateway', 'IoT Core', 'EventBridge', 'CloudWatch'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">DevOps</th><td class="py-3">${renderCareerSkillChips(['Docker', 'Terraform', 'Bash'])}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-2">Generative AI</p>
                    <h5 class="text-white text-base font-semibold leading-snug">LLM Maintenance Reports for EV Batteries</h5>
                    <ul class="mt-4 space-y-3">
                        <li><strong class="text-white">Problem:</strong> Battery maintenance records are technical, and customers need plain-language reports and root-cause analysis.</li>
                        <li><strong class="text-white">What I built:</strong> A summarisation service that runs an Ollama LLM in Docker on a local server, called through API Gateway, and turns maintenance records into customer-friendly reports.</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-2">ML at Scale</p>
                    <h5 class="text-white text-base font-semibold leading-snug">Fast Battery Inference on Serverless AWS</h5>
                    <ul class="mt-4 space-y-3">
                        <li><strong class="text-white">Problem:</strong> Predicting the State of Charge (how much energy is left) for thousands of cells in one battery pack took about 10 minutes.</li>
                        <li><strong class="text-white">What I built:</strong> I deployed a CNN model for State of Charge (pre-trained by the National Physical Laboratory) on AWS Lambda, with a hierarchical design that runs concurrent, asynchronous predictions. I built three inference pipelines in all, covering Remaining Useful Life, State of Health and maintenance alerts, using S3, DynamoDB, ECR and Lambda.</li>
                        <li><strong class="text-white">Result:</strong> The State of Charge inference time dropped from 10 minutes to 40–50 seconds. Latency across the three pipelines fell by 80%.</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-2">Computer Vision</p>
                    <h5 class="text-white text-base font-semibold leading-snug">Automated Weld Inspection</h5>
                    <ul class="mt-4 space-y-3">
                        <li>Built a serverless pipeline with a containerised vision model to check welds on EV battery casings, replacing a manual review step.</li>
                        <li><strong class="text-white">Result:</strong> Each inspection takes under 10 seconds.</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Anomaly Detection and Data Pipelines</p>
                    <ul class="list-disc pl-5 space-y-2 marker:text-cyan-neon">
                        <li>Deployed a Chi² anomaly-detection system for threshold monitoring with the National Physical Laboratory, with Dockerised training on Lambda and EventBridge and real-time inference triggered by DynamoDB.</li>
                        <li>Built the telemetry pipeline that checks the structure of incoming battery data and enforces time-series order before storing it (IoT Core, Lambda, API Gateway, DynamoDB, EventBridge, CloudWatch).</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Training and Platform</p>
                    <ul class="list-disc pl-5 space-y-2 marker:text-cyan-neon">
                        <li>Built three Dockerised model-training pipelines on AWS ECS Anywhere, so training ran on existing on-premise machines and cut compute costs.</li>
                        <li>Designed 30+ API Gateway resources and tuned 60+ DynamoDB tables with Global Secondary Indexes, reducing query times by 30%.</li>
                        <li>Wrote 70+ Terraform scripts (50+ for DynamoDB tables, 20+ for API Gateway and Lambda) to move the platform into production.</li>
                    </ul>
                </div>
            </div>`
    },
    {
        id: 'bcu-msc-ai',
        period: '2022-2023',
        role: 'MSc Artificial Intelligence (Distinction)',
        company: 'Birmingham City University',
        organizationLabel: 'University',
        companyUrl: 'https://www.bcu.ac.uk/',
        location: 'Birmingham, UK',
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
        period: '2016–2022',
        role: 'Software Developer',
        company: 'Citi, Treasury and Trade Solutions (TTS)',
        drawerCompany: 'Citi, Treasury and Trade Solutions (TTS), via CitiCorp Services India Private Limited, Pune',
        companyUrl: 'https://www.citigroup.com/global/about-us/global-presence/india',
        location: 'Pune, India',
        drawerHeading: 'Software Developer',
        drawerHtml: `
            <div class="space-y-6">
                <p>Six years building and securing software for Citi’s trade and treasury services, used by client banks across 21 EMEA countries. I started in backend development and moved into machine learning, deployment automation and application security.</p>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Skills</p>
                    <table class="w-full text-left text-sm border-collapse">
                        <tbody class="divide-y divide-white/10">
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold w-2/5">ML / NLP</th><td class="py-3">${renderCareerSkillChips(['Python', 'Keras', 'Scikit-learn', 'LSTM', 'GloVe embeddings'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">DevOps</th><td class="py-3">${renderCareerSkillChips(['CI/CD', 'IBM UrbanCode Deploy', 'JFrog Artifactory'])}</td></tr>
                            <tr><th scope="row" class="py-3 pr-4 align-top text-white font-semibold">Security</th><td class="py-3">${renderCareerSkillChips(['CyberArk'])}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-2">AI Project</p>
                    <h5 class="text-white text-base font-semibold leading-snug">HS Code Classifier for Trade Finance</h5>
                    <p class="mt-1 text-xs text-gray-400">LSTM · NLP</p>
                    <ul class="mt-4 space-y-3">
                        <li><strong class="text-white">Problem:</strong> Letters of credit (SWIFT MT700 messages) include a free-text description of the goods. Operations staff had to read each one and manually assign the matching Harmonized System (HS/HSN) commodity code, the international standard that customs and trade finance rely on.</li>
                        <li><strong class="text-white">What I built:</strong> A deep-learning text classifier (LSTM with pre-trained GloVe embeddings) that reads the description and suggests the commodity code. Most trade messages cover a few common product types, so I used stratified validation and tracked both overall and per-class results.</li>
                        <li><strong class="text-white">Result:</strong> About 79% accuracy across 29 commodity codes, trained on roughly 9,600 messages.</li>
                    </ul>
                </div>
                <div class="border-t border-white/10 pt-5">
                    <p class="text-xs font-mono-tech tracking-wider uppercase text-cyan-neon mb-3">Recognition</p>
                    <p>Gratitude Silver award for delivering and upgrading application security for client banks across 21 EMEA countries.</p>
                </div>
            </div>`
    }
];

const CAREER_MOBILE_BREAKPOINT = 768;
const CAREER_SPLIT_BREAKPOINT = 1024;
let mobileCareerFocusRaf = null;
let mobileCareerObserver = null;
let mobileCareerVisibility = new Map();
let mobileCareerObservedItems = [];
let mobileCareerManualMode = false;
let mobileCareerManualItem = null;
let mobileCareerLongPressTimer = null;
let mobileCareerTouchStart = null;
let suppressCareerClick = false;
let careerDrawerCloseTimer = null;

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
                <p class="text-gray-400 text-sm">${career.company} - ${career.location}</p>
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

    const headerHeight = document.getElementById('header')?.getBoundingClientRect().height || 72;
    document.body.style.setProperty('--career-header-height', `${Math.ceil(headerHeight)}px`);

    periodEl.textContent = career.period;
    titleEl.textContent = career.drawerHeading;

    if (career.companyUrl) {
        companyEl.innerHTML = `${career.organizationLabel || 'Company'}: <a href="${career.companyUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-neon hover:underline">${career.drawerCompany || career.company}</a>`;
    } else {
        companyEl.textContent = `${career.organizationLabel || 'Company'}: ${career.drawerCompany || career.company}`;
    }
    if (career.drawerClient) {
        companyEl.insertAdjacentHTML('beforeend', ` <span class="text-gray-500">·</span> Client: ${career.drawerClient}`);
    }

    contentEl.innerHTML = career.drawerHtml || career.drawerText
        .map((line) => `<p>${line}</p>`)
        .join('');

    if (careerDrawerCloseTimer) {
        clearTimeout(careerDrawerCloseTimer);
        careerDrawerCloseTimer = null;
    }
    document.body.classList.remove('career-drawer-closing');
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100');
    document.body.classList.add('overflow-hidden', 'career-drawer-open');

    const selectedItem = document.querySelector(`#career-timeline [data-career-id="${career.id}"]`);
    document.querySelectorAll('#career-timeline .career-item').forEach((item) => {
        item.classList.toggle('is-selected', item === selectedItem);
    });
    if (window.innerWidth >= CAREER_SPLIT_BREAKPOINT && selectedItem) {
        requestAnimationFrame(() => {
            const experience = document.getElementById('experience');
            if (!experience) return;
            const itemRect = selectedItem.getBoundingClientRect();
            const paneRect = experience.getBoundingClientRect();
            experience.scrollBy({ top: itemRect.top + itemRect.height / 2 - paneRect.height / 2, behavior: 'smooth' });
        });
    }
}

function closeCareerDrawer() {
    const drawer = document.getElementById('career-drawer');
    const backdrop = document.getElementById('career-drawer-backdrop');
    if (!drawer || !backdrop || !document.body.classList.contains('career-drawer-open') || careerDrawerCloseTimer) return;

    drawer.classList.add('translate-x-full');
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    const wasSplitView = window.innerWidth >= CAREER_SPLIT_BREAKPOINT;
    const finishClose = () => {
        document.body.classList.remove('overflow-hidden', 'career-drawer-open', 'career-drawer-closing');
        document.body.style.removeProperty('--career-header-height');
        if (wasSplitView) {
            const title = document.querySelector('#experience .section-title');
            const headerHeight = document.getElementById('header')?.getBoundingClientRect().height || 0;
            if (title) {
                const titleTop = title.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({ top: Math.max(0, titleTop - headerHeight - 24), behavior: 'instant' });
            }
        }
        document.querySelectorAll('#career-timeline .career-item.is-selected').forEach((item) => {
            item.classList.remove('is-selected');
        });
        careerDrawerCloseTimer = null;
    };
    if (wasSplitView) {
        document.body.classList.add('career-drawer-closing');
        careerDrawerCloseTimer = setTimeout(finishClose, 350);
    } else {
        finishClose();
    }
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
        if (document.body.classList.contains('career-drawer-open')) {
            const headerHeight = document.getElementById('header')?.getBoundingClientRect().height || 72;
            document.body.style.setProperty('--career-header-height', `${Math.ceil(headerHeight)}px`);
        }
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

