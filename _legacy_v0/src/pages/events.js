
export function renderEvents() {
    const section = document.createElement('div');
    section.className = 'w-full max-w-7xl mx-auto px-6 py-12';

    // Filter State (Basic implementation)
    let currentFilter = 'all';

    section.innerHTML = `
        <div class="text-center mb-16">
            <h1 class="text-4xl md:text-6xl font-heading font-bold mb-4">Events & <span class="text-acm-cyan">Workshops</span></h1>
            <p class="text-gray-400 max-w-2xl mx-auto">Discover our upcoming hackathons, coding bootcamps, and technical seminars.</p>
        </div>

        <!-- Filter Tabs -->
        <div class="flex justify-center gap-4 mb-12">
            ${createFilterBtn('All', 'all', true)}
            ${createFilterBtn('Upcoming', 'upcoming')}
            ${createFilterBtn('Past', 'past')}
        </div>

        <!-- Events Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${createEventCard('CodeSprint 2026', 'Mar 15, 2026', 'Hackathon', 'Build the future in 24 hours. ₹50k Prize Pool.', 'upcoming')}
            ${createEventCard('Web3 Masterclass', 'Apr 02, 2026', 'Workshop', 'Introduction to Solidity and Smart Contracts.', 'upcoming')}
            ${createEventCard('CyberSec Summit', 'May 10, 2026', 'Seminar', 'Protecting digital boundaries in AI era.', 'upcoming')}
            ${createEventCard('Intro to Python', 'Jan 20, 2026', 'Workshop', 'Beginner friendly coding session.', 'past')}
            ${createEventCard('Game Dev 101', 'Dec 15, 2025', 'Workshop', 'Unity 3D basics for students.', 'past')}
            ${createEventCard('TSEC Coding Cup', 'Nov 10, 2025', 'Competition', 'Intra-college competitive programming.', 'past')}
        </div>
    `;

    return section;
}

function createFilterBtn(label, value, active = false) {
    const activeClass = active ? 'bg-acm-blue text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10';
    return `<button class="${activeClass} px-6 py-2 rounded-full text-sm font-medium transition-colors">${label}</button>`;
}

function createEventCard(title, date, type, desc, status) {
    const statusColor = status === 'upcoming' ? 'text-green-400' : 'text-gray-500';
    return `
        <div class="glass-panel rounded-2xl overflow-hidden group hover:transform hover:-translate-y-2 transition-all duration-300">
            <div class="h-48 bg-gradient-to-br from-gray-800 to-black relative">
                <div class="absolute inset-0 flex items-center justify-center text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                    🚀
                </div>
                <!-- Badge -->
                <div class="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-white/10 ${statusColor}">
                    ${status.toUpperCase()}
                </div>
            </div>
            <div class="p-6">
                <div class="text-acm-cyan text-xs font-bold uppercase tracking-wider mb-2">${type}</div>
                <h3 class="text-2xl font-bold mb-2">${title}</h3>
                <div class="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <span>📅 ${date}</span>
                </div>
                <p class="text-gray-400 text-sm mb-6 line-clamp-2">${desc}</p>
                <button class="w-full py-3 rounded-xl border border-white/10 hover:bg-acm-blue hover:border-transparent hover:text-white transition-all text-sm font-medium text-gray-300">
                    View Details
                </button>
            </div>
        </div>
    `;
}
