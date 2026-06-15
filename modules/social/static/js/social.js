class SocialAgent {
    constructor() {
        this.currentTrader = 'all';
        this.tweetsData = [];
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
        document.getElementById('fetchTweetsBtn').addEventListener('click', () => this.fetchTweets());
        document.getElementById('traderFilter').addEventListener('change', (e) => {
            this.currentTrader = e.target.value;
            this.filterTweets();
        });
        document.getElementById('analyzeTrendsBtn').addEventListener('click', () => this.analyzeTrends());
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

    async fetchTweets() {
        const loadingEl = document.getElementById('socialLoading');
        const tweetsFeed = document.getElementById('tweetsFeed');
        const noTweets = document.getElementById('noTweets');
        const trendsPanel = document.getElementById('trendsPanel');

        loadingEl.style.display = 'flex';
        tweetsFeed.innerHTML = '';
        noTweets.style.display = 'none';
        if (trendsPanel) trendsPanel.style.display = 'none';

        try {
            const maxPer = this.currentTrader === 'all' ? 2 : 5;
            const accountParam = this.currentTrader === 'all' ? 'all' : this.currentTrader;
            const response = await fetch(`/social/api/tweets?max_per_account=${maxPer}&account=${accountParam}`);
            const data = await response.json();

            if (data.success && data.tweets) {
                this.tweetsData = data.tweets;
                this.renderTweets(this.tweetsData);
                document.getElementById('analyzeTrendsBtn').style.display = 'flex';
            } else {
                this.showError(data.message || 'Failed to fetch tweets');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderTweets(tweets) {
        const tweetsFeed = document.getElementById('tweetsFeed');
        const noTweets = document.getElementById('noTweets');

        if (tweets.length === 0) {
            tweetsFeed.innerHTML = '';
            noTweets.style.display = 'flex';
            return;
        }

        noTweets.style.display = 'none';

        tweetsFeed.innerHTML = tweets.map((tweet, index) => `
            <div class="tweet-card" data-index="${index}" style="animation-delay: ${index * 0.08}s">
                <div class="tweet-header">
                    <div class="tweet-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="tweet-user-info">
                        <div class="tweet-name">${this.escapeHtml(tweet.name)}</div>
                        <div class="tweet-handle">${this.escapeHtml(tweet.handle)}</div>
                    </div>
                    <button class="tweet-ai-btn" data-tweet-index="${index}" title="${this.t('ai_analyze')}">
                        <i class="fas fa-brain"></i>
                    </button>
                </div>
                <div class="tweet-content" id="tweet-text-${index}">
                    ${this.formatTweetContent(this.escapeHtml(tweet.text))}
                </div>
                <div class="tweet-translate">
                    <button class="tweet-translate-btn" data-index="${index}" data-text="${this.escapeHtml(tweet.text)}">
                        <i class="fas fa-language"></i> <span>${this.t('translate')}</span>
                    </button>
                </div>
                <div class="tweet-footer">
                    <span class="tweet-time">
                        <i class="fas fa-clock"></i>
                        ${this.formatTime(tweet.timestamp)}
                    </span>
                    <div class="tweet-footer-right">
                        <span class="tweet-relevance-badge" id="relevance-${index}" style="display:none"></span>
                        <a href="${tweet.url}" target="_blank" class="tweet-link">
                            <i class="fas fa-external-link-alt"></i>
                            ${this.t('view_on_x')}
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.tweet-ai-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-tweet-index'));
                this.analyzeTweet(tweets[index], btn);
            });
        });

        document.querySelectorAll('.tweet-translate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                this.translateTweet(btn, index);
            });
        });
    }

    async analyzeTrends() {
        const trendsPanel = document.getElementById('trendsPanel');
        const trendsContent = document.getElementById('trendsContent');
        const btn = document.getElementById('analyzeTrendsBtn');

        if (!this.tweetsData || this.tweetsData.length === 0) {
            this.showToast('No hay tweets para analizar. Carga tweets primero.');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + this.t('analyzing_trends');
        trendsPanel.style.display = 'block';
        trendsContent.innerHTML = `
            <div class="trends-loading">
                <div class="spinner"></div>
                <p>${this.t('ai_analyzing')}</p>
            </div>
        `;

        try {
            const response = await fetch('/social/api/analyze-trends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tweets: this.tweetsData.slice(0, 10),
                    lang: this._lang
                })
            });

            const data = await response.json();

            if (data.success && data.analysis) {
                this.renderTrends(data.analysis);
            } else {
                trendsContent.innerHTML = `
                    <div class="trends-error">
                        <p>${this.escapeHtml(data.message || 'Analysis unavailable')}</p>
                    </div>
                `;
            }
        } catch (error) {
            trendsContent.innerHTML = `
                <div class="trends-error">
                    <p>${this.t('ai_network_error')}</p>
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-chart-line"></i> ' + this.t('analyze_trends');
        }
    }

    renderTrends(analysis) {
        const trendsContent = document.getElementById('trendsContent');

        if (!analysis || analysis.length === 0) {
            trendsContent.innerHTML = '<p class="trends-empty">No se pudo analizar la relevancia.</p>';
            return;
        }

        const highRelevance = analysis.filter(a => a.financial_relevance === 'high');
        const mediumRelevance = analysis.filter(a => a.financial_relevance === 'medium');

        // Show badges on tweets
        analysis.forEach(a => {
            const badge = document.getElementById(`relevance-${a.index}`);
            if (badge) {
                const label = a.financial_relevance === 'high'
                    ? '🔥 ' + this.t('relevance_high')
                    : a.financial_relevance === 'medium'
                        ? '📊 ' + this.t('relevance_medium')
                        : '⏭️ ' + this.t('relevance_low');
                badge.textContent = label;
                badge.className = 'tweet-relevance-badge relevance-' + a.financial_relevance;
                badge.style.display = 'inline-flex';
                badge.title = a.relevance_reason || '';
            }
        });

        // Sort: high relevance first, then medium, then low
        analysis.sort((a, b) => {
            const rank = { high: 0, medium: 1, low: 2 };
            return (rank[a.financial_relevance] || 2) - (rank[b.financial_relevance] || 2);
        });

        trendsContent.innerHTML = `
            <div class="trends-summary">
                <div class="trends-stat">
                    <span class="trends-stat-value">${highRelevance.length}</span>
                    <span class="trends-stat-label">${this.t('relevance_high_count')}</span>
                </div>
                <div class="trends-stat">
                    <span class="trends-stat-value">${mediumRelevance.length}</span>
                    <span class="trends-stat-label">${this.t('relevance_medium_count')}</span>
                </div>
                <div class="trends-stat">
                    <span class="trends-stat-value">${analysis.length - highRelevance.length - mediumRelevance.length}</span>
                    <span class="trends-stat-label">${this.t('relevance_low_count')}</span>
                </div>
            </div>
            <div class="trends-list">
                ${analysis.map(a => {
                    const tweet = this.tweetsData[a.index];
                    if (!tweet) return '';
                    const relClass = 'relevance-' + a.financial_relevance;
                    const relLabel = a.financial_relevance === 'high'
                        ? '🔥 ' + this.t('relevance_high')
                        : a.financial_relevance === 'medium'
                            ? '📊 ' + this.t('relevance_medium')
                            : '⏭️ ' + this.t('relevance_low');
                    return `
                        <div class="trends-item ${relClass}">
                            <div class="trends-item-header">
                                <span class="trends-item-author">${this.escapeHtml(tweet.handle)}</span>
                                <span class="trends-item-badge ${relClass}">${relLabel}</span>
                            </div>
                            <p class="trends-item-text">${this.escapeHtml(tweet.text.substring(0, 200))}${tweet.text.length > 200 ? '...' : ''}</p>
                            <p class="trends-item-reason">${this.escapeHtml(a.relevance_reason || '')}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async translateTweet(btn, index) {
        const lang = this._lang || localStorage.getItem('lang') || 'es';
        if (lang === 'en') return;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            const text = btn.getAttribute('data-text');
            const res = await fetch('/ai/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang, context: 'tweet' })
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('tweet-text-' + index).innerHTML = data.translated;
                btn.innerHTML = '<i class="fas fa-check"></i> <span>' + this.t('translated') + '</span>';
            }
        } catch(e) {
            btn.innerHTML = '<i class="fas fa-language"></i>';
        }
    }

    filterTweets() {
        if (this.tweetsData.length === 0) return;

        if (this.currentTrader === 'all') {
            this.renderTweets(this.tweetsData);
        } else {
            const filtered = this.tweetsData.filter(tweet =>
                tweet.handle.toLowerCase().replace('@', '') === this.currentTrader.toLowerCase()
            );
            this.renderTweets(filtered);
        }
    }

    formatTweetContent(text) {
        text = text.replace(/https:\/\/[^\s]+/g, '<a href="$&" target="_blank" rel="noopener">$&</a>');
        text = text.replace(/@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank" rel="noopener">@$1</a>');
        text = text.replace(/#(\w+)/g, '<a href="https://twitter.com/hashtag/$1" target="_blank" rel="noopener">#$1</a>');
        return text;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now - date) / 1000;
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return Math.floor(diff / 60) + ' min';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h';
        const days = Math.floor(diff / 86400);
        if (days < 7) return days + 'd';
        return date.toLocaleDateString();
    }

    async analyzeTweet(tweet, btn) {
        const lang = localStorage.getItem('lang') || 'es';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch('/social/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: tweet.text,
                    handle: tweet.handle,
                    lang: lang
                })
            });

            const data = await response.json();

            if (data.success && data.analysis) {
                const a = data.analysis;
                const sentimentIcon = a.sentiment === 'bullish' ? '📈' : a.sentiment === 'bearish' ? '📉' : '➡️';
                const sentimentClass = a.sentiment === 'bullish' ? 'sentiment-bullish' :
                                      a.sentiment === 'bearish' ? 'sentiment-bearish' : 'sentiment-neutral';
                const confidenceClass = 'confidence-' + (a.confidence || 'low');
                const explain = this.escapeHtml(a.explanation || '');

                const badge = document.createElement('div');
                badge.className = 'tweet-sentiment-badge ' + sentimentClass + ' ' + confidenceClass;
                badge.innerHTML = sentimentIcon + ' ' + this.escapeHtml(a.sentiment_label);
                badge.title = explain;
                btn.parentNode.replaceChild(badge, btn);
            } else {
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-brain"></i>';
                    btn.disabled = false;
                }, 3000);
            }
        } catch (error) {
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-brain"></i>';
                btn.disabled = false;
            }, 3000);
        }
    }

    showError(message) {
        const tweetsFeed = document.getElementById('tweetsFeed');
        tweetsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    showToast(message) {
        const toast = document.getElementById('socialToast');
        if (!toast) {
            const t = document.createElement('div');
            t.id = 'socialToast';
            t.className = 'social-toast';
            t.textContent = message;
            document.querySelector('.social-module').appendChild(t);
            setTimeout(() => t.classList.add('active'), 10);
            setTimeout(() => { t.classList.remove('active'); setTimeout(() => t.remove(), 300); }, 3000);
        } else {
            toast.textContent = message;
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 3000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.socialAgent = new SocialAgent();
});
