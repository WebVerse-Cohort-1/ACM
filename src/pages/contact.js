
export function renderContact() {
    const section = document.createElement('div');
    section.className = 'w-full max-w-7xl mx-auto px-6 py-12';

    section.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <!-- Contact Info & Map -->
            <div>
                <h1 class="text-5xl font-heading font-bold mb-8">Get in <span class="text-acm-cyan">Touch</span></h1>
                <p class="text-gray-400 text-lg mb-12">
                    Have questions about membership, events, or sponsorships? We're here to help.
                </p>

                <div class="space-y-6 mb-12">
                    ${createContactItem('📍', 'Address', 'Thakur Shyamnarayan Engineering College, Mumbai')}
                    ${createContactItem('📧', 'Email', 'acm@tsec.edu')}
                    ${createContactItem('📞', 'Phone', '+91 98765 43210')}
                </div>

                <!-- Fake Map Visualization -->
                <div class="h-64 rounded-2xl overflow-hidden glass-panel relative group">
                    <div class="absolute inset-0 bg-acm-blue/20 animate-pulse"></div>
                    <div class="absolute inset-0 flex items-center justify-center font-bold tracking-widest text-acm-cyan">
                        MAP VISUALIZATION LOADING...
                    </div>
                </div>
            </div>

            <!-- Contact Form -->
            <div class="glass-panel p-8 rounded-3xl">
                <h3 class="text-2xl font-bold mb-6">Send a Message</h3>
                <form id="contact-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-sm text-gray-400">First Name</label>
                            <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-acm-cyan focus:outline-none transition-colors" placeholder="John">
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm text-gray-400">Last Name</label>
                            <input type="text" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-acm-cyan focus:outline-none transition-colors" placeholder="Doe">
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm text-gray-400">Email Address</label>
                        <input type="email" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-acm-cyan focus:outline-none transition-colors" placeholder="john@example.com">
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm text-gray-400">Message</label>
                        <textarea rows="4" class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-acm-cyan focus:outline-none transition-colors" placeholder="How can we help you?"></textarea>
                    </div>

                    <button type="submit" class="w-full py-4 bg-gradient-to-r from-acm-blue to-acm-cyan rounded-xl font-bold text-white hover:opacity-90 transition-opacity transform hover:translate-y-px">
                        Send Message 🚀
                    </button>
                </form>
            </div>
        </div>
    `;

    return section;
}

function createContactItem(icon, label, value) {
    return `
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">${icon}</div>
            <div>
                <div class="text-xs text-acm-cyan font-bold uppercase tracking-wider">${label}</div>
                <div class="text-lg font-medium">${value}</div>
            </div>
        </div>
    `;
}
