// Authoring note for future updates:
// Highlight only category-defining hooks, not supporting proof/details.
// Keep emphasis sparse: generally one highlight per paragraph, occasionally two.
const aboutMe = {
    title: "Lead Machine Learning Engineer",
    paragraphs: [
        `My work over the last two years has focused on <span class="about-accent">healthcare generative AI</span>. At DataConsol, I lead ML engineering for Optum-facing systems. Before that, at Nitor Infotech, I built clinical decision-support tools for RhythmX.`,

        `I designed a <span class="about-accent">RAG-based formulary intelligence pipeline</span> using GPT-4, Azure OpenAI, and Milvus to generate pharmacotherapy-aligned medication suggestions grounded in coverage data and source citations.`,

        `I also engineered the retrieval architecture for a <span class="about-accent">production clinical assistant AI</span>, personalized to patient context such as labs, vitals, procedures, medications, and clinical history, with recommendations backed by US medical guidelines across 60+ comorbidities. Much of that work focused on post-retrieval filtering, response validation, and keeping latency <span class="about-accent">under five seconds</span> in a regulated environment.`,

        `Earlier, at Faraday Battery, I built and deployed <span class="about-accent">serverless ML services on AWS</span> for predictive maintenance across EV battery packs. Before that, I spent six years at Citibank working on backend systems and release pipelines for trade finance applications, which shaped how I think about reliability, fallback paths, and deployment hygiene.`,

        `Outside of work, I build repositories around practical LLM engineering problems such as token management, streaming inference, prompt optimization, multi-agent workflows, clinical vector search, Milvus operations, and <span class="about-accent">HIPAA-compliant PHI de-identification</span>.`,

        `I hold an MSc in Artificial Intelligence from Birmingham City University and a B.Tech in Electronics and Communication Engineering from NIT Trichy.`
    ]
};

function renderAboutMe() {
    const container = document.getElementById('summary-container');
    if (!container) return;

    let html = `<h3 class="about-subtitle">${aboutMe.title}</h3>`;

    aboutMe.paragraphs.forEach((paragraph) => {
        html += `<p class="about-para">${paragraph}</p>`;
    });

    container.innerHTML = html;
}

renderAboutMe();
