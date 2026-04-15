const professionalSummary = {
    title: "Lead Machine Learning Engineer",
    paragraphs: [
        "Six years building production backend systems at Citibank taught me what it means for code to fail at scale — and why it can't.",
        "I pivoted into AI through a Master's at Birmingham City (84.67%, Distinction), then spent a year deploying ML pipelines on AWS for EV battery diagnostics at Faraday.",
        "Today I architect GenAI systems at Nitor Infotech — currently building a Formulary Intelligence RAG pipeline using Azure OpenAI GPT-4o and Milvus that helps physicians make formulary-compliant drug decisions."
    ]
};

function renderSummary() {
    const container = document.getElementById('summary-container');
    if (!container) return;

    let html = `<h3 class="text-xl text-cyan-neon font-medium mb-6 font-mono-tech">${professionalSummary.title}</h3>`;
    
    professionalSummary.paragraphs.forEach((paragraph, index) => {
        const marginClass = index === professionalSummary.paragraphs.length - 1 ? "" : "mb-4";
        html += `<p class="text-[#AAAAAA] ${marginClass} leading-relaxed">${paragraph}</p>`;
    });

    container.innerHTML = html;
}

renderSummary();
