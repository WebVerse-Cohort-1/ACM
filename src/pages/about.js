
export function renderAbout() {
    const section = document.createElement('div');
    section.className = 'w-full max-w-7xl mx-auto px-6 py-12';

    section.innerHTML = `
        <div class="mb-16 text-center">
            <h1 class="text-4xl md:text-6xl font-heading font-bold mb-6">Our <span class="text-acm-cyan">Legacy</span></h1>
            <p class="text-gray-400 max-w-3xl mx-auto text-lg">
                Since 2010, TSEC ACM has been the beacon of technical excellence, fostering a community of developers, designers, and innovators.
            </p>
        </div>

        <!-- Vision / Mission Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div class="glass-panel p-8 rounded-2xl border-l-4 border-acm-blue">
                <h3 class="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span class="text-3xl">👁️</span> Vision
                </h3>
                <p class="text-gray-400 leading-relaxed">
                    To be a leading student chapter that nurtures technical competence and professional growth, preparing students for the dynamic world of computing.
                </p>
            </div>
            <div class="glass-panel p-8 rounded-2xl border-l-4 border-acm-cyan">
                <h3 class="text-2xl font-bold mb-4 flex items-center gap-3">
                    <span class="text-3xl">🚀</span> Mission
                </h3>
                <p class="text-gray-400 leading-relaxed">
                    Organizing high-quality workshops, hackathons, and seminars that bridging the gap between academic curriculum and industry requirements.
                </p>
            </div>
        </div>

        <!-- Timeline Section -->
        <h2 class="text-3xl font-heading font-bold mb-10 text-center">Chapter History</h2>
        <div class="relative border-l border-white/10 ml-4 md:ml-auto md:mx-auto max-w-3xl space-y-12">
            ${createTimelineItem('2025', 'Best Student Chapter Award', 'Recognized by ACM India for outstanding contribution to the student community.')}
            ${createTimelineItem('2023', 'launched "TSEC CodeFlow"', 'Our flagship open-source initiative that garnered 500+ PRs in its first month.')}
            ${createTimelineItem('2020', 'Virtual Transition', 'Successfully transitioned 50+ events to online platforms during the global pandemic.')}
            ${createTimelineItem('2010', 'Inception', 'TSEC ACM Student Chapter was officially chartered with 30 founding members.')}
        </div>
    `;

    return section;
}

function createTimelineItem(year, title, desc) {
    return `
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[5px] top-2 w-3 h-3 bg-acm-cyan rounded-full shadow-[0_0_10px_#00d2ef] group-hover:scale-150 transition-transform"></div>
            <span class="text-acm-cyan font-heading font-bold text-xl mb-1 block">${year}</span>
            <h3 class="text-xl font-bold text-white mb-2 group-hover:text-acm-blue transition-colors">${title}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">${desc}</p>
        </div>
    `;
}
