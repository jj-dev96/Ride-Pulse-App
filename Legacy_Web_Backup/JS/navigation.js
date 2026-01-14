// Navigation Component Generator

function createBottomNavigation(currentPage = 'maps') {
    const navItems = [
        { icon: 'map', label: 'MAP', page: 'maps', key: 'maps' },
        { icon: 'bar_chart', label: 'STATS', page: 'stats', key: 'stats' },
        { icon: 'workspace_premium', label: 'PREMIUM', page: 'premium', key: 'premium' },
        { icon: 'settings', label: 'SETTINGS', page: 'settings', key: 'settings' }
    ];

    const navHTML = `
        <nav class="fixed bottom-0 w-full bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 z-50">
            <div class="flex justify-around items-center h-16 pb-4 max-w-md mx-auto">
                ${navItems.map(item => {
                    const isActive = currentPage === item.key;
                    return `
                        <a href="${item.page === 'maps' ? 'maps.html' : 
                                   item.page === 'stats' ? 'stats.html' : 
                                   item.page === 'premium' ? 'dashbroard.html' : 
                                   'settings.html'}" 
                           class="flex flex-col items-center justify-center space-y-1 w-1/4 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'} transition-colors">
                            <span class="material-icons-round text-2xl ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : ''}">${item.icon}</span>
                            <span class="text-[10px] ${isActive ? 'font-bold' : 'font-medium'}">${item.label}</span>
                            ${isActive ? '<div class="absolute -top-10 w-12 h-1 bg-primary rounded-full blur-md opacity-50"></div>' : ''}
                        </a>
                    `;
                }).join('')}
            </div>
        </nav>
    `;
    
    return navHTML;
}

function createHeader(title, subtitle = '', showLogo = true) {
    const logoPath = '../Images/RidePulse-Logo.jpg';
    return `
        <header class="px-6 pt-12 pb-4 flex justify-between items-center bg-card-light dark:bg-card-dark shadow-sm z-20">
            <div class="flex items-center gap-3">
                ${showLogo ? `
                    <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-neon">
                        <img alt="RidePulse Logo" class="w-full h-full object-cover" src="${logoPath}"/>
                    </div>
                ` : ''}
                <div>
                    <h1 class="font-display font-bold text-3xl tracking-wide bg-gradient-to-r from-primary to-secondary gradient-text uppercase">RidePulse</h1>
                    ${subtitle ? `<span class="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">${subtitle}</span>` : ''}
                </div>
            </div>
            <button class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                <span class="material-icons">notifications_none</span>
            </button>
        </header>
    `;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createBottomNavigation, createHeader };
}

