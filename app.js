// Global variable to store tools data
let TOOLS_DATA = [];

// Async function to load utilities.json
async function loadUtilitiesData() {
    try {
        const response = await fetch('./utilities.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform data to match expected format and add IDs
        TOOLS_DATA = data.map((tool, index) => ({
            id: index + 1,
            name: tool.name,
            category: getCategoryFromTags(tool.tags),
            tags: tool.tags,
            description: tool.description,
            url_project: tool.url_project,
            url_git: tool.url_git
        }));
        
        console.log(`[App] Loaded ${TOOLS_DATA.length} tools from utilities.json`);
        return TOOLS_DATA;
    } catch (error) {
        console.error('[App] Error loading utilities.json:', error);
        // Fallback to empty array if loading fails
        TOOLS_DATA = [];
        return TOOLS_DATA;
    }
}

// Helper function to determine category from tags
function getCategoryFromTags(tags) {
    if (tags.includes('vpn')) return 'VPN & Networking';
    if (tags.includes('messaging') || tags.includes('chat')) return 'Communication';
    if (tags.includes('password-manager')) return 'Password Management';
    if (tags.includes('email')) return 'Email';
    if (tags.includes('storage') || tags.includes('cloud')) return 'Storage & Sync';
    if (tags.includes('browser')) return 'Browsers';
    if (tags.includes('os')) return 'Operating Systems';
    if (tags.includes('search-engine')) return 'Search';
    if (tags.includes('adblock') || tags.includes('tracker-blocker')) return 'Browser Extensions';
    if (tags.includes('email-alias')) return 'Email Privacy';
    return 'Privacy & Security';
}

class ThemeManager {
    constructor() {
        this.debug = true; // Enable debug logging
        this.log('ThemeManager initializing...');
        this.theme = this.getInitialTheme();
        this.init();
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[ThemeManager] ${message}`, ...args);
        }
    }

    getInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
        
        this.log('Initial theme detection:', {
            savedTheme,
            systemDark,
            initialTheme
        });
        
        return initialTheme;
    }

    init() {
        this.log('Initializing theme system...');
        this.applyTheme(this.theme);
        this.setupToggle();
        this.setupMediaQuery();
        
        // Make ThemeManager globally accessible for debugging
        window.themeManager = this;
    }

    applyTheme(theme) {
        this.log(`Applying theme: ${theme}`);
        this.theme = theme;
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme); // Backup for specificity
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
        
        // Update icon
        this.updateToggleIcon();
        
        // Update git icons if filter manager exists
        if (window.toolsFilter) {
            window.toolsFilter.updateGitIcons();
        }
        
        this.log(`Theme applied successfully. Document data-theme: ${document.documentElement.getAttribute('data-theme')}`);
    }

    updateToggleIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        const newIcon = this.theme === 'dark' ? '☀️' : '🌙';
        
        if (themeIcon) {
            themeIcon.textContent = newIcon;
            this.log(`Updated toggle icon to: ${newIcon}`);
        } else {
            this.log('ERROR: Could not find .theme-icon element');
        }
    }

    setupToggle() {
        this.log('Setting up theme toggle...');
        
        // Try multiple times to ensure element exists
        const attemptSetup = (attempts = 0) => {
            const themeToggle = document.getElementById('theme-toggle');
            
            if (themeToggle) {
                this.log('Theme toggle button found, adding event listener');
                
                // Remove any existing listeners
                themeToggle.removeEventListener('click', this.handleToggleClick);
                
                // Add new listener with proper binding
                this.handleToggleClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.log('Theme toggle clicked!');
                    this.toggleTheme();
                };
                
                themeToggle.addEventListener('click', this.handleToggleClick);
                this.log('Event listener attached successfully');
                
                return true;
            } else {
                this.log(`Attempt ${attempts + 1}: Theme toggle button not found`);
                
                if (attempts < 5) {
                    // Retry after a short delay
                    setTimeout(() => attemptSetup(attempts + 1), 100);
                } else {
                    this.log('ERROR: Failed to find theme toggle button after 5 attempts');
                }
                
                return false;
            }
        };
        
        attemptSetup();
    }

    setupMediaQuery() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.log('Setting up media query listener for system theme changes');
        
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.log('System theme changed, updating theme:', e.matches ? 'dark' : 'light');
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.log(`Toggling theme from ${this.theme} to ${newTheme}`);
        this.applyTheme(newTheme);
    }

    // Public method for manual testing
    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.log(`Manually setting theme to: ${theme}`);
            this.applyTheme(theme);
        } else {
            this.log(`Invalid theme: ${theme}. Use 'light' or 'dark'`);
        }
    }

    // Reinitialize if needed (called after router setup)
    reinitialize() {
        this.log('Reinitializing theme manager...');
        this.setupToggle();
        this.updateToggleIcon();
    }
}

class FilterManager {
    constructor() {
        this.selectedTags = new Set();
        this.allTags = [];
        this.filteredTools = [];
        this.searchQuery = '';
        this.isLoaded = false;
    }

    async initialize() {
        if (!this.isLoaded) {
            await loadUtilitiesData();
            this.allTags = this.extractAllTags();
            this.filteredTools = [...TOOLS_DATA];
            this.isLoaded = true;
        }
    }

    extractAllTags() {
        const tags = new Set();
        TOOLS_DATA.forEach(tool => {
            tool.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }

    toggleTag(tag) {
        if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
        } else {
            this.selectedTags.add(tag);
        }
        this.updateFilteredTools();
    }

    addTag(tag) {
        if (tag && !this.selectedTags.has(tag)) {
            this.selectedTags.add(tag);
            this.updateFilteredTools();
            // Reset dropdown to default
            const dropdown = document.getElementById('tag-dropdown');
            if (dropdown) {
                dropdown.value = '';
            }
        }
    }

    updateSearchQuery(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.updateFilteredTools();
    }

    clearAllFilters() {
        this.selectedTags.clear();
        this.searchQuery = '';
        const searchInput = document.getElementById('search-input');
        const dropdown = document.getElementById('tag-dropdown');
        if (searchInput) searchInput.value = '';
        if (dropdown) dropdown.value = '';
        this.updateFilteredTools();
    }

    updateFilteredTools() {
        let filtered = [...TOOLS_DATA];
        
        // Apply tag filtering
        if (this.selectedTags.size > 0) {
            filtered = filtered.filter(tool => {
                // AND logic: tool must have ALL selected tags
                return Array.from(this.selectedTags).every(selectedTag => 
                    tool.tags.includes(selectedTag)
                );
            });
        }
        
        // Apply search filtering
        if (this.searchQuery) {
            filtered = filtered.filter(tool => {
                const nameMatch = tool.name.toLowerCase().includes(this.searchQuery);
                const descriptionMatch = tool.description.toLowerCase().includes(this.searchQuery);
                return nameMatch || descriptionMatch;
            });
        }
        
        this.filteredTools = filtered;
        this.renderFilteredTools();
    }

    renderFilterUI() {
        const selectedTagsArray = Array.from(this.selectedTags);
        const availableTags = this.allTags.filter(tag => !this.selectedTags.has(tag));
        
        return `
            <div class="filter-container">
                <div class="filter-header">
                    <h3 class="filter-title">Search and Filter Utilities</h3>
                    <div class="filter-stats">
                        <span class="item-count">Showing ${this.filteredTools.length} of ${TOOLS_DATA.length} items</span>
                        ${selectedTagsArray.length > 0 || this.searchQuery ? `<button class="clear-filters-btn" onclick="window.toolsFilter.clearAllFilters()">Clear all</button>` : ''}
                    </div>
                </div>
                
                <div class="search-and-tags">
                    <div class="search-container">
                        <input type="text" 
                               id="search-input" 
                               class="search-input" 
                               placeholder="Search utilities by name or description..."
                               value="${this.searchQuery}"
                               oninput="window.toolsFilter.updateSearchQuery(this.value)">
                        ${this.searchQuery ? `<button class="clear-search-btn" onclick="document.getElementById('search-input').value=''; window.toolsFilter.updateSearchQuery('')">&times;</button>` : ''}
                    </div>
                    
                    <div class="tag-selector">
                        <select id="tag-dropdown" class="tag-dropdown">
                            <option value="">Select a tag to add...</option>
                            ${availableTags.map(tag => `
                                <option value="${tag}">${tag}</option>
                            `).join('')}
                        </select>
                        <button class="add-tag-btn" onclick="
                            const dropdown = document.getElementById('tag-dropdown');
                            if (dropdown.value) {
                                window.toolsFilter.addTag(dropdown.value);
                            }
                        ">Add Tag</button>
                    </div>
                </div>
                
                ${selectedTagsArray.length > 0 ? `
                    <div class="active-filters">
                        <span class="active-filters-label">Selected tags:</span>
                        <div class="active-filters-list">
                            ${selectedTagsArray.map(tag => `
                                <span class="active-filter-tag">
                                    ${tag}
                                    <button class="remove-tag-btn" onclick="window.toolsFilter.toggleTag('${tag}')">&times;</button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderTools() {
        return this.filteredTools.map(tool => `
            <div class="tool-card" data-tags="${tool.tags.join(',')}">
                <h3 class="tool-name">${tool.name}</h3>
                <p class="card-description">${tool.description}</p>
                <div class="tool-tags">
                    ${tool.tags.map(tag => `<span class="tool-tag">${tag}</span>`).join('')}
                </div>
                <div class="tool-links">
                    <a href="${tool.url_project}" class="tool-link site-link" target="_blank" rel="noopener">
                        Site
                    </a>
                    ${tool.url_git ? `
                        <a href="${tool.url_git}" class="tool-link git-link" target="_blank" rel="noopener">
                            <img src="${this.getGitIcon(tool.url_git)}" alt="Git Repository" class="git-icon">
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getGitIcon(gitUrl) {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = currentTheme === 'dark';
        
        if (gitUrl.includes('github.com')) {
            return isDark ? './resources/github-white.png' : './resources/github.png';
        } else if (gitUrl.includes('gitlab')) {
            return isDark ? './resources/gitlab-white.png' : './resources/gitlab.png';
        } else {
            return './resources/git.png';
        }
    }

    renderFilteredTools() {
        const toolsGrid = document.querySelector('.tools-grid');
        if (toolsGrid) {
            toolsGrid.innerHTML = this.renderTools();
            
            // Update filter stats
            const itemCount = document.querySelector('.item-count');
            if (itemCount) {
                itemCount.textContent = `Showing ${this.filteredTools.length} of ${TOOLS_DATA.length} items`;
            }
        }
    }

    updateGitIcons() {
        // Update all git icons when theme changes
        const gitIcons = document.querySelectorAll('.git-icon');
        gitIcons.forEach(icon => {
            const gitLink = icon.closest('.git-link');
            if (gitLink) {
                const gitUrl = gitLink.href;
                icon.src = this.getGitIcon(gitUrl);
            }
        });
    }
}

class Router {
    constructor() {
        this.routes = {
            'home': this.renderHome,
            'projects': this.renderProjects,
            'profiles': this.renderProfiles,
            'tools': this.renderTools
        };
        
        this.currentPage = 'home';
        this.init();
    }

    init() {
        // Set up navigation event listeners
        this.setupNavigation();
        
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Load initial page
        this.handleRoute();
    }

    setupNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        // Set up navigation for all links with data-page attribute
        this.setupPageLinks();

        // Mobile menu toggle
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    setupPageLinks() {
        // Remove existing listeners to avoid duplicates
        document.removeEventListener('click', this.handlePageLinkClick);
        
        // Add a single delegated event listener for all page navigation
        this.handlePageLinkClick = async (e) => {
            const target = e.target.closest('[data-page]');
            if (target) {
                e.preventDefault();
                const page = target.getAttribute('data-page');
                await this.navigateTo(page);
                
                // Close mobile menu if open
                const navMenu = document.getElementById('nav-menu');
                const navToggle = document.getElementById('nav-toggle');
                if (navMenu && navToggle) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            }
        };
        
        document.addEventListener('click', this.handlePageLinkClick);
    }

    async navigateTo(page) {
        if (this.routes[page]) {
            this.currentPage = page;
            history.pushState({ page }, '', `#${page}`);
            this.updateActiveNav(page);
            await this.renderPage(page);
        }
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        if (this.routes[hash]) {
            this.currentPage = hash;
            this.updateActiveNav(hash);
            await this.renderPage(hash);
        } else {
            this.navigateTo('home');
        }
    }

    updateActiveNav(page) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
    }

    async renderPage(page) {
        const content = await this.routes[page].call(this);
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = content;
        
        // Re-setup page links after content changes
        this.setupPageLinks();
    }

    renderHome() {
        return `
            <div class="page-header">
                <h1 class="page-title">Welcome</h1>
                <p class="page-subtitle">
                    Developer, tinkerer, and privacy advocate. Building tools and exploring the digital frontier.
                </p>
            </div>
            <div class="cards-grid">
                <div class="card">
                    <h3 class="card-title">🚀 Projects</h3>
                    <p class="card-description">
                        Explore my latest projects and contributions to the open-source community.
                    </p>
                    <a href="#projects" class="card-link" data-page="projects">View Projects</a>
                </div>
                <div class="card">
                    <h3 class="card-title">🔗 Connect</h3>
                    <p class="card-description">
                        Find me across various platforms and social networks.
                    </p>
                    <a href="#profiles" class="card-link" data-page="profiles">My Profiles</a>
                </div>
                <div class="card">
                    <h3 class="card-title">🛠️ Utilities</h3>
                    <p class="card-description">
                        Quick access to useful utilities I recommend.
                    </p>
                    <a href="#tools" class="card-link" data-page="tools">Browse Utilities</a>
                </div>
            </div>
        `;
    }

    renderProjects() {
        return `
            <div class="page-header">
                <h1 class="page-title">Projects</h1>
                <p class="page-subtitle">
                    A collection of my work and contributions to open source projects.
                </p>
            </div>
            <div class="cards-grid">
                <div class="card">
                    <h3 class="card-title">Clean Browsing</h3>
                    <p class="card-description">
                        A privacy-focused browsing solution that helps users maintain clean, 
                        secure, and private web browsing experiences. Features advanced tracking 
                        protection, ad blocking, and privacy tools designed to enhance your 
                        digital security and browsing performance.
                    </p>
                    <a href="https://github.com/dmeim/clean-browsing" class="card-link" target="_blank" rel="noopener">
                        View on GitHub →
                    </a>
                </div>
            </div>
        `;
    }

    renderProfiles() {
        return `
            <div class="page-header">
                <h1 class="page-title">Connect</h1>
                <p class="page-subtitle">
                    Find me across various platforms and networks.
                </p>
            </div>
            <div class="profiles-grid">
                <div class="profile-card">
                    <div class="profile-icon">
                        <span>📂</span>
                    </div>
                    <h3 class="profile-name">GitHub</h3>
                    <p class="profile-description">
                        My code repositories, contributions, and open source projects.
                    </p>
                    <a href="https://github.com/dmeim" class="profile-link" target="_blank" rel="noopener">
                        Visit Profile
                    </a>
                </div>
            </div>
        `;
    }

    async renderTools() {
        // Initialize filter manager if not already done
        if (!window.toolsFilter) {
            window.toolsFilter = new FilterManager();
        }
        
        // Ensure data is loaded
        await window.toolsFilter.initialize();
        
        return `
            <div class="page-header">
                <h1 class="page-title">Utilities</h1>
                <p class="page-subtitle">
                    Curated utilities I recommend for privacy, security, and development.
                </p>
            </div>
            
            ${window.toolsFilter.renderFilterUI()}
            
            <div class="tools-grid">
                ${window.toolsFilter.renderTools()}
            </div>
        `;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] Initializing application...');
    
    // Initialize theme manager first
    const themeManager = new ThemeManager();
    
    // Initialize router
    const router = new Router();
    
    // Failsafe: Re-initialize theme manager after router setup
    setTimeout(() => {
        console.log('[App] Running failsafe theme manager re-initialization...');
        themeManager.reinitialize();
    }, 500);
    
    // Make both globally accessible for debugging
    window.router = router;
    console.log('[App] Application initialized. Global objects: window.themeManager, window.router');
});

// Add smooth scrolling for any internal links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
});