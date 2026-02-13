
import { initThreeJS } from './three-scene.js';
import { initRouter } from './router.js';
import { renderLayout } from './layout.js';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Background
    initThreeJS('canvas-container');

    // 2. Render Global Layout (Navbar/Footer)
    renderLayout();

    // 3. Start Router
    initRouter();
});
