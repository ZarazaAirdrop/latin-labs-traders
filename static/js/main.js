/**
 * Latin Labs Traders - Main JavaScript
 */

// Language Management
const LanguageManager = {
    currentLang: 'es',
    
    init() {
        window.translations = window.translations || {};
        this.loadSavedLanguage();
        this.setupLanguageSwitcher();
    },
    
    loadSavedLanguage() {
        const saved = localStorage.getItem('language');
        if (saved) {
            this.currentLang = saved;
            this.updateActiveButton();
            this.applyLanguage();
        }
    },
    
    setupLanguageSwitcher() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                this.setLanguage(lang);
            });
        });
    },
    
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        localStorage.setItem('lang', lang);
        this.updateActiveButton();
        this.applyLanguage();
        window.location.reload();
    },
    
    updateActiveButton() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });
    },
    
    applyLanguage() {
        document.documentElement.lang = this.currentLang;
        this.loadTranslations();
    },
    
    async loadTranslations() {
        try {
            const response = await fetch(`/static/js/lang/${this.currentLang}.json`);
            const translations = await response.json();
            this.applyTranslations(translations);
            window.translations[this.currentLang] = translations;
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    },
    
    applyTranslations(translations) {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
    }
};

// Mobile Menu
const MobileMenu = {
    init() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const menu = document.querySelector('.navbar-menu');
        
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
            });
        }
    }
};

// Tech Progress Bar
const TechProgressBar = {
    init() {
        const fill = document.querySelector('.tech-progress-fill');
        if (fill) {
            this.animate();
        }
    },
    
    animate() {
        const fill = document.querySelector('.tech-progress-fill');
        if (fill) {
            fill.style.animation = 'none';
            fill.offsetHeight; // Trigger reflow
            fill.style.animation = 'progress-fill 2s ease-out';
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    LanguageManager.init();
    MobileMenu.init();
    TechProgressBar.init();
});

// Export for use in other modules
window.LanguageManager = LanguageManager;
window.MobileMenu = MobileMenu;
window.TechProgressBar = TechProgressBar;