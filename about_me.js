const aboutMe = [
    `I am a Machine Learning and Generative AI Engineer with over eight years of experience across software engineering and artificial intelligence, working in healthcare, electric vehicles, and financial services.`,

    `In recent years, my work has focused on building Generative AI solutions for healthcare. At DataConsol, working with Optum, I developed a multi-agent AI system that helps automate healthcare data validation. It translates business rules written in everyday language into PySpark scripts, reducing the manual effort involved in checking data accuracy across Databricks pipelines.`,

    `Previously, at Nitor Infotech, working with RhythmX, I built AI-powered clinical assistants that help healthcare professionals find relevant information from patient records, medical guidelines, and drug coverage data to support informed clinical decisions.`,

    `Before moving into healthcare AI, I worked at Faraday Battery, developing and deploying machine learning solutions for EV battery monitoring, anomaly detection, and predictive maintenance.`,

    `I began my engineering career at Citibank, where I spent six years working on backend systems and software deployment processes for financial applications. That experience gave me a strong foundation in building reliable, maintainable systems, which continues to influence how I approach AI engineering today.`,

    `I hold a Master's degree in Artificial Intelligence from Birmingham City University and a Bachelor's degree in Electronics and Communication Engineering from NIT Trichy.`
];

function renderAboutMe() {
    const container = document.getElementById('summary-container');
    if (!container) return;

    container.replaceChildren(...aboutMe.map((text) => {
        const paragraph = document.createElement('p');
        paragraph.className = 'about-para';
        paragraph.textContent = text;
        return paragraph;
    }));
}

renderAboutMe();
