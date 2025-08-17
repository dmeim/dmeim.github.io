class ThemeManager {
    constructor() {
        this.theme = this.getInitialTheme();
        this.init();
    }

    getInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    init() {
        this.applyTheme(this.theme);
        this.setupToggle();
        this.setupMediaQuery();
    }

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateToggleIcon();
    }

    updateToggleIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }

    setupToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    setupMediaQuery() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
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
    new ThemeManager();
    new Router();
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