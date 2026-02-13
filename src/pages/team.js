
export function renderTeam() {
    const section = document.createElement('div');
    section.className = 'w-full max-w-7xl mx-auto px-6 py-12';

    // Core Committee Data
    const council = [
        { name: 'Chairperson', role: 'Chairperson', img: 'C' },
        { name: 'Vice Chair', role: 'Vice Chairperson', img: 'V' },
        { name: 'Secretary', role: 'Gen. Secretary', img: 'S' },
        { name: 'Treasurer', role: 'Treasurer', img: 'T' }
    ];

    const heads = [
        { name: 'Tech Lead', role: 'Technical Head', img: 'TL' },
        { name: 'Design Lead', role: 'Creative Head', img: 'DL' },
        { name: 'Marketing', role: 'PR Head', img: 'Mk' },
        { name: 'Events', role: 'Events Head', img: 'Ev' }
    ];

    section.innerHTML = `
        <div class="text-center mb-16">
            <h1 class="text-4xl md:text-6xl font-heading font-bold mb-4">Meet the <span class="text-acm-cyan">Team</span></h1>
            <p class="text-gray-400">The minds behind the magic.</p>
        </div>

        <h2 class="text-2xl font-bold mb-8 pl-4 border-l-4 border-acm-blue">Core Council</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            ${council.map(member => createMemberCard(member)).join('')}
        </div>

        <h2 class="text-2xl font-bold mb-8 pl-4 border-l-4 border-acm-cyan">Committee Heads</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${heads.map(member => createMemberCard(member)).join('')}
        </div>
    `;

    return section;
}

function createMemberCard(member) {
    return `
        <div class="glass-panel p-6 rounded-2xl text-center group hover:-translate-y-2 transition-transform duration-300">
            <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-acm-blue to-acm-cyan p-[2px]">
                <div class="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl font-bold">
                    ${member.img}
                </div>
            </div>
            <h3 class="text-xl font-bold mb-1 group-hover:text-acm-cyan transition-colors">${member.name}</h3>
            <p class="text-acm-blue text-sm font-medium mb-4">${member.role}</p>
            <div class="flex justify-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <a href="#" class="hover:text-white transition-colors">in</a>
                <a href="#" class="hover:text-white transition-colors">𝕏</a>
                <a href="#" class="hover:text-white transition-colors">git</a>
            </div>
        </div>
    `;
}
