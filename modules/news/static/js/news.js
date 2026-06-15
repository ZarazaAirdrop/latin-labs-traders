// News Agent JavaScript

class NewsAgent {
    constructor() {
        this.currentFilter = {
            category: 'all',
            source: 'all'
        };
        this.newsData = [];
        this._lang = localStorage.getItem('lang') || 'es';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTranslations();
    }

    t(key) {
        const tr = window.translations || {};
        return (tr[this._lang] && tr[this._lang][key]) || key;
    }

    bindEvents() {
        document.getElementById('fetchNewsBtn').addEventListener('click', () => this.fetchNews());
        document.getElementById('newsCategory').addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value;
            this.filterNews();
        });
        document.getElementById('newsSource').addEventListener('change', (e) => {
            this.currentFilter.source = e.target.value;
            this.filterNews();
        });

        // Modal events
        const modal = document.getElementById('newsModal');
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    async loadTranslations() {
        const lang = localStorage.getItem('lang') || 'es';
        this._lang = lang;
        let tr = window.translations || {};
        if (!tr[lang]) {
            try {
                const res = await fetch(`/static/js/lang/${lang}.json`);
                tr[lang] = await res.json();
                window.translations = tr;
            } catch(e) {
                return;
            }
        }
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (tr[lang] && tr[lang][key]) {
                el.textContent = tr[lang][key];
            }
        });
    }

    async fetchNews() {
        const loadingEl = document.getElementById('newsLoading');
        const newsFeed = document.getElementById('newsFeed');
        const noNews = document.getElementById('noNews');

        loadingEl.style.display = 'flex';
        newsFeed.innerHTML = '';
        noNews.style.display = 'none';

        try {
            const response = await fetch('/news/api/fetch');
            const data = await response.json();

            if (data.success && data.articles) {
                this.newsData = data.articles;
                this.renderNews(this.newsData);
            } else {
                this.showError(data.message || 'Failed to fetch news');
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            this.showError('Network error. Please try again.');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderNews(articles) {
        const newsFeed = document.getElementById('newsFeed');
        const noNews = document.getElementById('noNews');

        if (articles.length === 0) {
            newsFeed.innerHTML = '';
            noNews.style.display = 'flex';
            return;
        }

        noNews.style.display = 'none';
        newsFeed.innerHTML = articles.map((article, index) => {
            const sourceName = this.t('source_' + article.source) || article.source;
            const catName = this.t('cat_' + article.category) || article.category;
            return `
            <div class="news-card" data-index="${index}" style="animation-delay: ${index * 0.1}s">
                <span class="news-source ${article.source}">${this.escapeHtml(sourceName)}</span>
                <h3 class="news-title">${this.escapeHtml(article.title)}</h3>
                <p class="news-excerpt">${this.escapeHtml(article.excerpt || article.title)}</p>
                <div class="news-meta">
                    <span class="news-time">
                        <i class="fas fa-clock"></i>
                        ${this.formatTime(article.publishedAt)}
                    </span>
                    <span class="news-category">${this.escapeHtml(catName)}</span>
                </div>
                <button class="news-ai-btn" data-index="${index}" title="${this.t('ai_analyze')}">
                    <i class="fas fa-brain"></i> AI
                </button>
            </div>
        `}).join('');

        // Bind click events to cards
        document.querySelectorAll('.news-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.news-ai-btn')) return;
                const index = parseInt(card.getAttribute('data-index'));
                this.showNewsDetail(articles[index]);
            });
        });

        // Bind AI analysis buttons
        document.querySelectorAll('.news-ai-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                this.analyzeNews(articles[index]);
            });
        });
    }

    filterNews() {
        if (this.newsData.length === 0) return;

        let filtered = this.newsData;

        if (this.currentFilter.category !== 'all') {
            filtered = filtered.filter(article => 
                article.category === this.currentFilter.category
            );
        }

        if (this.currentFilter.source !== 'all') {
            filtered = filtered.filter(article => 
                article.source === this.currentFilter.source
            );
        }

        this.renderNews(filtered);
    }

    showNewsDetail(article) {
        const modal = document.getElementById('newsModal');
        const modalBody = document.getElementById('modalBody');

        const sourceName = this.t('source_' + article.source) || article.source;
        const catName = this.t('cat_' + article.category) || article.category;
        const articleId = 'news-' + Date.now();
        modalBody.innerHTML = `
            <span class="modal-source ${article.source}">${this.escapeHtml(sourceName)}</span>
            <h2 class="modal-title">${this.escapeHtml(article.title)}</h2>
            <div class="modal-meta">
                <span>
                    <i class="fas fa-clock"></i>
                    ${this.formatTime(article.publishedAt)}
                </span>
                <span>
                    <i class="fas fa-tag"></i>
                    ${this.escapeHtml(catName)}
                </span>
            </div>
            <div class="modal-content-text" id="${articleId}">
                ${this.escapeHtml(article.content || article.excerpt || article.title)}
            </div>
            <div class="modal-actions">
                <a href="${article.url}" target="_blank" class="modal-full-link">
                    <i class="fas fa-external-link-alt"></i>
                    ${this.t('read_full_article')}
                </a>
                <button class="btn btn-sm modal-translate-btn" data-target="${articleId}" data-text="${this.escapeHtml(article.content || article.excerpt || article.title)}">
                    <i class="fas fa-language"></i> Traducir
                </button>
            </div>
        `;

        modalBody.querySelector('.modal-translate-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
            this.translateText(btn.dataset.text, btn.dataset.target);
        });

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async translateText(text, targetId) {
        const lang = this._lang || localStorage.getItem('lang') || 'es';
        if (lang === 'en') return;
        try {
            const res = await fetch('/ai/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang, context: 'news' })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById(targetId).textContent = data.translated;
            }
        } catch(e) {}
    }

    closeModal() {
        const modal = document.getElementById('newsModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async analyzeNews(article) {
        const modal = document.getElementById('newsModal');
        const modalBody = document.getElementById('modalBody');
        const lang = localStorage.getItem('lang') || 'es';

        modalBody.innerHTML = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>${this.t('ai_analyzing')}</p>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch('/news/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: article.title,
                    content: article.content || article.excerpt,
                    source: article.source,
                    lang: lang
                })
            });

            const data = await response.json();

            if (data.success && data.analysis) {
                const a = data.analysis;
                const sentimentIcon = a.sentiment === 'bullish' ? '📈' : a.sentiment === 'bearish' ? '📉' : '➡️';
                const sentimentClass = a.sentiment === 'bullish' ? 'sentiment-bullish' : a.sentiment === 'bearish' ? 'sentiment-bearish' : 'sentiment-neutral';

                modalBody.innerHTML = `
                    <span class="modal-source ${article.source}">${article.source}</span>
                    <h2 class="modal-title">${this.escapeHtml(article.title)}</h2>
                    <div class="ai-analysis-section">
                        <div class="ai-analysis-header">
                            <i class="fas fa-brain"></i>
                            <span data-i18n="ai_analysis_title">AI Analysis</span>
                        </div>
                        <div class="ai-summary">
                            <p>${this.escapeHtml(a.summary)}</p>
                        </div>
                        <div class="ai-sentiment ${sentimentClass}">
                            <span class="sentiment-icon">${sentimentIcon}</span>
                            <div class="sentiment-info">
                                <strong>${this.escapeHtml(a.sentiment_label)}</strong>
                                <span data-i18n="ai_market_sentiment">Market Sentiment</span>
                            </div>
                        </div>
                        ${a.implications && a.implications.length ? `
                        <div class="ai-implications">
                            <h4 data-i18n="ai_trading_implications">Trading Implications</h4>
                            <ul>
                                ${a.implications.map(imp => `<li>${this.escapeHtml(imp)}</li>`).join('')}
                            </ul>
                        </div>` : ''}
                        ${a.instruments && a.instruments.length ? `
                        <div class="ai-instruments">
                            <h4 data-i18n="ai_affected_instruments">Affected Instruments</h4>
                            <div class="instrument-tags">
                                ${a.instruments.map(inst => `<span class="instrument-tag">${this.escapeHtml(inst)}</span>`).join('')}
                            </div>
                        </div>` : ''}
                    </div>
                `;
            } else {
                modalBody.innerHTML = `
                    <div class="modal-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${this.escapeHtml(data.message || 'AI analysis failed')}</p>
                    </div>
                `;
            }
        } catch (error) {
            modalBody.innerHTML = `
                <div class="modal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p data-i18n="ai_network_error">Network error. Please try again.</p>
                </div>
            `;
        }

        this.applyModalTranslations();
    }

    applyModalTranslations() {
        const lang = localStorage.getItem('lang') || 'es';
        document.querySelectorAll('#modalBody [data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (window.translations && window.translations[lang] && window.translations[lang][key]) {
                el.textContent = window.translations[lang][key];
            }
        });
    }

    showError(message) {
        const newsFeed = document.getElementById('newsFeed');
        newsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.newsAgent = new NewsAgent();
});