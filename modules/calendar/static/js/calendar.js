class EconomicCalendar {
    constructor() {
        this.currentFilters = {
            impact: 'all',
            currency: 'all',
            date: this.getTodayDate()
        };
        this.eventsData = [];
        this._lang = localStorage.getItem('lang') || 'es';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTranslations();
        this.loadCalendar();
    }

    t(key) {
        const tr = window.translations || {};
        return (tr[this._lang] && tr[this._lang][key]) || key;
    }

    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    bindEvents() {
        document.getElementById('refreshCalendar').addEventListener('click', () => this.loadCalendar());
        document.getElementById('impactFilter').addEventListener('change', (e) => {
            this.currentFilters.impact = e.target.value;
            this.filterEvents();
        });
        document.getElementById('currencyFilter').addEventListener('change', (e) => {
            this.currentFilters.currency = e.target.value;
            this.filterEvents();
        });
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.loadCalendar();
        });
        document.getElementById('closeEventModal').addEventListener('click', () => this.closeModal());
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
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

    async loadCalendar() {
        const loadingEl = document.getElementById('calendarLoading');
        const eventsContainer = document.getElementById('calendarEvents');
        const noEvents = document.getElementById('noEvents');

        loadingEl.style.display = 'flex';
        eventsContainer.innerHTML = '';
        noEvents.style.display = 'none';

        try {
            const response = await fetch(`/calendar/api/events?date=${this.currentFilters.date}`);
            const data = await response.json();

            if (data.success && data.events) {
                this.eventsData = data.events;
                this.renderEvents(this.eventsData);
            } else {
                this.showError(data.message || 'Failed to load calendar');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    renderEvents(events) {
        const container = document.getElementById('calendarEvents');
        const noEvents = document.getElementById('noEvents');

        if (events.length === 0) {
            container.innerHTML = '';
            noEvents.style.display = 'flex';
            return;
        }

        noEvents.style.display = 'none';

        container.innerHTML = events.map((event, index) => {
            const impactLabel = this.t('impact_' + event.impact) || event.impact;
            return `
            <div class="event-card" data-index="${index}" style="animation-delay: ${index * 0.05}s">
                <div class="event-time">
                    <span class="time">${event.time}</span>
                    <span class="timezone">UTC</span>
                </div>
                <div class="event-info">
                    <span class="event-currency">
                        <i class="fas fa-flag"></i>
                        ${event.currency}
                    </span>
                    <div class="event-title">${this.escapeHtml(event.title)}</div>
                </div>
                <div class="event-actual">
                    <span class="value">${event.actual || '-'}</span>
                </div>
                <div class="event-forecast">
                    <span class="label">${this.t('forecast_label')}</span>
                    <span class="value">${event.forecast || '-'}</span>
                </div>
                <div class="event-impact">
                    <div class="impact-indicator ${event.impact}"></div>
                    <span class="impact-text">${this.escapeHtml(impactLabel)}</span>
                </div>
            </div>
        `}).join('');

        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const index = parseInt(card.getAttribute('data-index'));
                this.showEventDetail(this.eventsData[index]);
            });
        });
    }

    showEventDetail(event) {
        const modal = document.getElementById('eventModal');
        const modalBody = document.getElementById('eventModalBody');

        const impactLabel = this.t('impact_' + event.impact) || event.impact;
        modalBody.innerHTML = `
            <div class="event-detail-header">
                <div class="event-detail-meta">
                    <span class="event-detail-currency"><i class="fas fa-flag"></i> ${event.currency}</span>
                    <span class="event-detail-time"><i class="fas fa-clock"></i> ${event.time} UTC</span>
                    <span class="event-detail-impact ${event.impact}"><i class="fas fa-bolt"></i> ${this.escapeHtml(impactLabel)}</span>
                </div>
                <h2 class="event-detail-title">${this.escapeHtml(event.title)}</h2>
                <div class="event-detail-values">
                    <div class="detail-value-box">
                        <span class="detail-value-label">${this.t('forecast_label')}</span>
                        <span class="detail-value">${event.forecast || '-'}</span>
                    </div>
                    <div class="detail-value-box">
                        <span class="detail-value-label">${this.t('actual_label')}</span>
                        <span class="detail-value actual">${event.actual || '-'}</span>
                    </div>
                </div>
            </div>
            <div id="analysisContainer">
                <button class="btn btn-primary event-analyze-btn" onclick="window.economicCalendar.analyzeEvent()">
                    <i class="fas fa-brain"></i> ${this.t('ai_analyze')}
                </button>
            </div>
        `;

        this._currentEvent = event;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async analyzeEvent() {
        const container = document.getElementById('analysisContainer');
        const event = this._currentEvent;
        if (!event) return;

        container.innerHTML = `
            <div class="event-analysis-loading">
                <div class="spinner"></div>
                <p class="loading-text">${this.t('ai_analyzing')}</p>
            </div>
        `;

        try {
            const response = await fetch('/calendar/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: event.title,
                    currency: event.currency,
                    impact: event.impact,
                    time: event.time,
                    actual: event.actual,
                    forecast: event.forecast,
                    lang: this._lang
                })
            });

            const data = await response.json();

            if (data.success && data.analysis) {
                const a = data.analysis;
                container.innerHTML = `
                    <div class="event-analysis-result">
                        <div class="analysis-header">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${this.t('ai_analysis_title')}</span>
                        </div>
                        <div class="analysis-summary">
                            <p>${this.escapeHtml(a.summary)}</p>
                        </div>
                        <div class="analysis-risk">
                            <div class="risk-title"><i class="fas fa-shield-alt"></i> ${this.t('calendar_risk_guidance')}</div>
                            <p>${this.escapeHtml(a.risk_guidance)}</p>
                        </div>
                        <div class="analysis-context">
                            <div class="context-title"><i class="fas fa-chart-line"></i> ${this.t('calendar_market_context')}</div>
                            <p>${this.escapeHtml(a.market_context)}</p>
                        </div>
                        <div class="analysis-footer">
                            <i class="fas fa-info-circle"></i>
                            ${this.t('ai_disclaimer_text')}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="event-analysis-error">
                        <p>${this.escapeHtml(data.message || 'Analysis unavailable')}</p>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = `
                <div class="event-analysis-error">
                    <p>${this.t('ai_network_error')}</p>
                </div>
            `;
        }
    }

    closeModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this._currentEvent = null;
    }

    filterEvents() {
        if (this.eventsData.length === 0) return;

        let filtered = this.eventsData;

        if (this.currentFilters.impact !== 'all') {
            filtered = filtered.filter(event =>
                event.impact === this.currentFilters.impact
            );
        }

        if (this.currentFilters.currency !== 'all') {
            filtered = filtered.filter(event =>
                event.currency === this.currentFilters.currency
            );
        }

        this.renderEvents(filtered);
    }

    showError(message) {
        const container = document.getElementById('calendarEvents');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.economicCalendar = new EconomicCalendar();
});
