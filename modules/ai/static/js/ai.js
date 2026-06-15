class AIAssistant {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        this.loadTranslations();
        this.bindEvents();
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

    bindEvents() {
        const form = document.getElementById('chatForm');
        const input = document.getElementById('chatInput');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                this.sendMessage(text);
                input.value = '';
            }
        });

        document.querySelectorAll('.chat-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendMessage(btn.dataset.prompt);
            });
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        });
    }

    getLang() {
        return localStorage.getItem('lang') || 'es';
    }

    async sendMessage(text) {
        this.addMessage('user', text);
        this.showTyping();
        this.hideGreeting();

        try {
            this.messages.push({ role: 'user', content: text });

            const response = await fetch('/ai/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: this.messages,
                    lang: this.getLang()
                })
            });

            this.hideTyping();

            const data = await response.json();

            if (data.success) {
                this.messages.push({ role: 'assistant', content: data.response });
                this.addMessage('assistant', data.response);
            } else {
                this.addMessage('assistant', 'Error: ' + data.message);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('assistant', 'Error de conexión. Verifica tu internet e intenta de nuevo.');
        }
    }

    addMessage(role, content) {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = 'chat-message ' + role;
        div.textContent = content;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = 'chat-typing';
        div.id = 'chatTyping';
        div.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        const el = document.getElementById('chatTyping');
        if (el) el.remove();
    }

    hideGreeting() {
        const el = document.getElementById('chatGreeting');
        if (el) el.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
});
