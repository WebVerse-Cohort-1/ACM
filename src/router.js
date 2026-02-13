
import { renderHome } from './pages/home.js';
import { renderAbout } from './pages/about.js';
import { renderEvents } from './pages/events.js';
import { renderTeam } from './pages/team.js';
import { renderContact } from './pages/contact.js';

const routes = {
    '': renderHome,
    'home': renderHome,
    'about': renderAbout,
    'events': renderEvents,
    'team': renderTeam,
    'contact': renderContact
};

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', handleRoute);
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const container = document.getElementById('page-content');

    // Simple transition effect
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(() => {
        // Clear current content
        container.innerHTML = '';

        // Render new page
        const renderer = routes[hash] || renderHome;
        container.appendChild(renderer());

        // Fade in
        container.style.transition = 'all 0.4s ease-out';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';

        // Update Active Nav Link
        updateActiveLink(hash);

        // Scroll to top
        window.scrollTo(0, 0);
    }, 200);
}

function updateActiveLink(hash) {
    document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
        link.classList.remove('text-acm-cyan');
        if (link.getAttribute('href') === `#${hash}`) {
            link.classList.add('text-acm-cyan');
        }
    });
}
