
export function renderLayout() {
    const app = document.getElementById('app');

    // Navbar
    const navbar = document.createElement('nav');
    navbar.className = 'fixed top-0 w-full z-50 transition-all duration-300 px-6 py-4 glass-panel';
    navbar.innerHTML = `
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <a href="#home" class="text-2xl font-heading font-bold tracking-wider hover:text-acm-cyan transition-colors">
                TSEC <span class="text-acm-blue">ACM</span>
            </a>
            
            <div class="hidden md:flex gap-8 items-center">
                <a href="#home" class="nav-link text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest">Home</a>
                <a href="#about" class="nav-link text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest">About</a>
                <a href="#events" class="nav-link text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest">Events</a>
                <a href="#team" class="nav-link text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest">Team</a>
                <a href="#contact" class="nav-link text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest">Contact</a>
            </div>

            <!-- Mobile Menu Button -->
            <button id="menu-btn" class="md:hidden text-white focus:outline-none">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
        </div>

        <!-- Mobile Menu (Hidden by default) -->
        <div id="mobile-menu" class="hidden md:hidden absolute top-full left-0 w-full bg-acm-dark/95 border-b border-white/10 p-4 flex flex-col gap-4">
            <a href="#home" class="mobile-link block text-gray-300 hover:text-acm-cyan">Home</a>
            <a href="#about" class="mobile-link block text-gray-300 hover:text-acm-cyan">About</a>
            <a href="#events" class="mobile-link block text-gray-300 hover:text-acm-cyan">Events</a>
            <a href="#team" class="mobile-link block text-gray-300 hover:text-acm-cyan">Team</a>
            <a href="#contact" class="mobile-link block text-gray-300 hover:text-acm-cyan">Contact</a>
        </div>
    `;

    app.appendChild(navbar);

    // Mobile Menu Logic
    const menuBtn = navbar.querySelector('#menu-btn');
    const mobileMenu = navbar.querySelector('#mobile-menu');
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Content Container (Pages inject here)
    const main = document.createElement('main');
    main.id = 'page-content';
    main.className = 'flex-grow pt-24'; // pt-24 to offset fixed navbar
    app.appendChild(main);

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'border-t border-white/10 bg-black/40 py-12 mt-auto';
    footer.innerHTML = `
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
                <h3 class="font-heading font-bold text-xl mb-4">TSEC ACM</h3>
                <p class="text-gray-400 text-sm leading-relaxed">
                    Fostering innovation and technical excellence at Thakur Shyamnarayan Engineering College.
                </p>
            </div>
            <div>
                <h3 class="font-heading font-bold text-xl mb-4">Quick Links</h3>
                <div class="flex flex-col gap-2 text-sm text-gray-400">
                    <a href="#events" class="hover:text-acm-cyan">Upcoming Events</a>
                    <a href="#team" class="hover:text-acm-cyan">Our Team</a>
                    <a href="https://www.acm.org" target="_blank" class="hover:text-acm-cyan">ACM Global</a>
                </div>
            </div>
            <div>
                <h3 class="font-heading font-bold text-xl mb-4">Connect</h3>
                <div class="flex justify-center md:justify-start gap-4">
                    <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-acm-blue transition-colors">📸</a>
                    <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-acm-blue transition-colors">💼</a>
                    <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-acm-blue transition-colors">🐦</a>
                </div>
            </div>
        </div>
        <div class="text-center text-gray-500 text-xs mt-12">
            © 2026 TSEC ACM Student Chapter. All rights reserved.
        </div>
    `;
    app.appendChild(footer);
}
