
export function renderHome() {
    const section = document.createElement('div');
    section.className = 'w-full';

    section.innerHTML = `
        <!-- Hero Overlay -->
        <div class="relative min-h-[80vh] flex items-center justify-center text-center px-4">
            <div class="max-w-4xl z-10">
                <span class="inline-block py-1 px-3 rounded-full bg-acm-cyan/10 border border-acm-cyan/30 text-acm-cyan text-sm font-medium mb-6 animate-pulse">
                    ✨ TSEC ACM Student Chapter
                </span>
                <h1 class="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-acm-cyan drop-shadow-lg">
                    Innovate. <br/> Collaborate. <br/> Excel.
                    ID_07
                    PROJECT
                    ID_08
                    PROJECT
                    ID_09
                    PROJECT
                    ID_10
                    PROJECT
                    ID_11
                    PROJECT
                    
                </h1>
                <p class="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                    Join the premier computing community at Thakur Shyamnarayan Engineering College. 
                    We turn ideas into reality through code.
                </p>
                <div class="flex flex-col md:flex-row gap-4 justify-center">
                    <a href="#events" class="px-8 py-3 bg-acm-blue hover:bg-blue-600 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(66,132,210,0.5)]">
                        Explore Events
                    </a>
                    <a href="#contact" class="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-full font-medium transition-all backdrop-blur-md">
                        Join Community
                    </a>
                </div>
            </div>
        </div>

        <!-- Latest News Ticker / Cards -->
        <div class="max-w-7xl mx-auto px-6 py-20">
            <h2 class="text-3xl font-heading font-bold mb-10 border-l-4 border-acm-cyan pl-4">Latest Highlights</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${createNewsCard('🏆 Hackathon Winner', 'Our team secured 1st place at National CodeHack 2025!', 'Feb 10, 2026')}
                ${createNewsCard('🚀 Workshop Alert', 'AI/ML Bootcamp registration is now open.', 'Feb 12, 2026')}
                ${createNewsCard('🎙️ Tech Talk', 'Industry experts from Google visiting campus next week.', 'Feb 14, 2026')}
            </div>
        </div>
    `;
    return section;
}

function createNewsCard(title, desc, date) {
    return `
        <div class="glass-panel p-6 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div class="text-acm-cyan text-xs font-bold uppercase tracking-wider mb-2">${date}</div>
            <h3 class="text-xl font-bold mb-2 group-hover:text-acm-blue transition-colors">${title}</h3>
            <p class="text-gray-400 text-sm">${desc}</p>
        </div>
    `;
}
