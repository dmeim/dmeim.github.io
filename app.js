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
        const navLinks = document.querySelectorAll('.nav-link');
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
                
                // Close mobile menu if open
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });

        // Mobile menu toggle
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    navigateTo(page) {
        if (this.routes[page]) {
            this.currentPage = page;
            history.pushState({ page }, '', `#${page}`);
            this.updateActiveNav(page);
            this.renderPage(page);
        }
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        if (this.routes[hash]) {
            this.currentPage = hash;
            this.updateActiveNav(hash);
            this.renderPage(hash);
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

    renderPage(page) {
        const content = this.routes[page].call(this);
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = content;
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
                    <h3 class="card-title">🛠️ Tools</h3>
                    <p class="card-description">
                        Quick access to useful tools and resources I recommend.
                    </p>
                    <a href="#tools" class="card-link" data-page="tools">Browse Tools</a>
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
                <div class="card">
                    <h3 class="card-title">More Projects Coming Soon</h3>
                    <p class="card-description">
                        I'm always working on new projects and contributions. Check back soon 
                        for updates on my latest work in privacy, security, and developer tools.
                    </p>
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
                <div class="profile-card">
                    <div class="profile-icon">
                        <span>🔗</span>
                    </div>
                    <h3 class="profile-name">More Links</h3>
                    <p class="profile-description">
                        Additional social profiles and professional networks coming soon.
                    </p>
                </div>
            </div>
        `;
    }

    renderTools() {
        return `
            <div class="page-header">
                <h1 class="page-title">Tools & Resources</h1>
                <p class="page-subtitle">
                    Curated tools and resources I recommend for privacy, security, and development.
                </p>
            </div>
            <div class="tools-grid">
                <div class="tool-card">
                    <h3 class="tool-name">Mullvad VPN</h3>
                    <p class="tool-category">Privacy & Security</p>
                    <p class="card-description">
                        Privacy-focused VPN service with strong encryption, no-logs policy, 
                        and anonymous account creation. Perfect for maintaining online privacy 
                        and security.
                    </p>
                    <a href="https://mullvad.net/en/download/vpn/" class="tool-link" target="_blank" rel="noopener">
                        Download
                    </a>
                </div>
                <div class="tool-card">
                    <h3 class="tool-name">More Tools</h3>
                    <p class="tool-category">Coming Soon</p>
                    <p class="card-description">
                        Additional privacy tools, development utilities, and security resources 
                        will be added here soon.
                    </p>
                </div>
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