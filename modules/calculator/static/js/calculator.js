/**
 * Calculator Module JavaScript - Complete v1.0
 * Full implementation with all calculations from original v1.0
 */

// Global i18n helper (reads window.translations[currentLang])
function i18n(key, fallback) {
    const lang = document.documentElement.lang || 'es';
    const dict = (window.translations && window.translations[lang]) || {};
    return dict[key] || fallback || key;
}

const Calculator = {
    form: null,
    overlay: null,
    currentData: {},
    
    init() {
        this.form = document.getElementById('riskForm');
        this.overlay = document.getElementById('resultsOverlay');
        
        // Check if backend data exists (from server-side calculation)
        if (window.calculatorBackendData && window.challengeInfo) {
            this.loadBackendResults();
        }
        
        if (this.form) {
            this.setupForm();
        }
        
        if (this.overlay) {
            this.setupOverlay();
        }
        
        // Setup floating labels
        this.setupFloatingLabels();
    },
    
    loadBackendResults() {
        // Load data from backend into currentData
        const backend = window.calculatorBackendData;
        const challengeInfo = window.challengeInfo;
        const selectedName = window.selectedChallengeName;
        
        this.currentData = {
            riesgoDinero: backend.riesgo_dinero,
            valorTP: backend.valor_tp_usd,
            rr: backend.rr,
            lots: backend.lotes,
            challengeName: selectedName || backend.challenge_name || challengeInfo.name,
            fase: backend.fase,
            instrument: backend.instrumento,
            riesgoPct: (backend.riesgo_dinero / backend.balance_actual * 100).toFixed(2),
            valorSL: backend.valor_sl_usd,
            opsBeforeBlowout: backend.operaciones_perdedoras,
            drawdownPct: backend.drawdown_pct,
            blowoutRisk: backend.blowout_risk,
            profitActual: backend.profit_actual,
            targetUSD: backend.target_usd,
            missingAmount: backend.faltante_usd,
            progressPct: backend.progreso_porcentaje,
            dailyLossRemaining: backend.daily_loss_remaining,
            maxLossUSD: backend.max_loss_usd,
            maxLossPct: backend.max_loss_label === 'Trailing' ? challengeInfo.max_loss : challengeInfo.max_loss,
            challengeType: selectedName || backend.challenge_name || 'Unknown',
            profile: backend.perfil,
            payoutEstimate: backend.payout_estimate,
            dailyLossUSD: backend.daily_loss_usd,
            balanceStatus: backend.balance_status,
            warningMessage: backend.advertencia,
            warningType: backend.operaciones_perdedoras <= 3 ? 'warning' : 'success',
            distanciaSL: backend.distancia_sl,
            distanciaTP: backend.distancia_tp,
            pipsSL: backend.pips_sl,
            pipsTP: backend.pips_tp,
            valorSL: backend.valor_sl_usd,
            opsForTarget: Math.ceil(backend.target_usd / backend.valor_tp_usd),
            targetPct: backend.fase === 2 && challengeInfo.phase2_target != null ? challengeInfo.phase2_target : challengeInfo.phase1_target || challengeInfo.profit_target_pct || 10
        };
        
        // Auto-show overlay if backend data exists
        setTimeout(() => {
            this.updateOverlay();
            this.overlay.classList.add('active');
        }, 300);
    },
    
    setupForm() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateRisk();
        });
    },
    
    setupOverlay() {
        // Close overlay
        document.getElementById('closeOverlay').addEventListener('click', () => {
            this.closeOverlay();
        });
        
        // New calculation
        document.getElementById('newCalculation').addEventListener('click', () => {
            this.closeOverlay();
            // Reset form but keep some values
            document.getElementById('accountBalance').value = '10000';
            document.getElementById('riskPercent').value = '1';
        });
        
        // Share results
        document.getElementById('shareResults').addEventListener('click', () => {
            this.shareResults();
        });
        
        // Close on backdrop click
        const backdrop = document.querySelector('.overlay-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeOverlay();
            });
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.closeOverlay();
            }
        });
    },
    
    setupFloatingLabels() {
        document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
            const update = () => {
                el.closest('.form-group').classList.toggle('has-value', el.value !== '');
            };
            
            const event = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(event, update);
            el.addEventListener('focus', () => {
                el.closest('.form-group').classList.add('has-value');
            });
            el.addEventListener('blur', () => {
                if (el.value === '') {
                    el.closest('.form-group').classList.remove('has-value');
                }
            });
            update();
        });
    },
    
    calculateRisk() {
        const formData = new FormData(this.form);
        const instrument = document.getElementById('instrument');
        const selectedOption = instrument.options[instrument.selectedIndex];
        
        // Get all input values
        const challengeType = formData.get('challenge');
        const fase = parseInt(formData.get('fase'));
        const cuenta = parseFloat(formData.get('cuenta'));
        const balance = parseFloat(formData.get('accountBalance'));
        const riesgoPct = parseFloat(formData.get('riskPercent'));
        const entryPrice = parseFloat(formData.get('entryPrice'));
        const stopPrice = parseFloat(formData.get('stopPrice'));
        const takePrice = parseFloat(formData.get('takePrice'));
        
        const pipSize = parseFloat(selectedOption.dataset.pipSize);
        const valorPip = parseFloat(selectedOption.dataset.valorPip);
        
        // Validations
        if (isNaN(entryPrice) || isNaN(stopPrice) || isNaN(takePrice)) {
            this.showToast(LanguageManager.t('calc_valid_prices'));
            return;
        }
        
        if (stopPrice === entryPrice || takePrice === entryPrice) {
            this.showToast(LanguageManager.t('calc_sl_tp_diff'));
            return;
        }
        
        // Calculate distances
        const distanciaSL = Math.abs(entryPrice - stopPrice);
        const distanciaTP = Math.abs(takePrice - entryPrice);
        
        // Calculate pips
        const pipsSL = Math.round(distanciaSL / pipSize * 100) / 100;
        const pipsTP = Math.round(distanciaTP / pipSize * 100) / 100;
        
// Calculate values in USD
        const riesgoDinero = balance * (riesgoPct / 100);
        const rr = pipsTP / pipsSL;
        const valorSL = riesgoDinero;
        const valorTP = riesgoDinero * rr;
        
        // Calculate lots based on SL
        const lots = riesgoDinero / (pipsSL * valorPip);
        
        // Get challenge data
        const challengeData = this.getChallengeData(challengeType);
        const maxLossPct = fase === 1 ? 
            (challengeData.phase1?.max_total_loss_pct || challengeData.max_total_loss_pct || 10) :
            (challengeData.phase2?.max_total_loss_pct || challengeData.max_total_loss_pct || 10);
        
        const dailyLossPct = fase === 1 ?
            (challengeData.phase1?.max_daily_loss_pct || challengeData.max_daily_loss_pct || 5) :
            (challengeData.phase2?.max_daily_loss_pct || challengeData.max_daily_loss_pct || 5);
        
        const targetPct = fase === 1 ?
            (challengeData.phase1?.profit_target_pct || challengeData.profit_target_pct || 10) :
            (challengeData.phase2?.profit_target_pct || 5);
        
        // Calculate drawdown
        const drawdownPct = balance < cuenta ? 
            ((cuenta - balance) / cuenta * 100) : 0;
        
        // Calculate max loss amounts (trailing for Instant Funding)
        const isInstantFunding = challengeType === 'Instant Funding';
        const maxLossUSD = isInstantFunding ? balance * (maxLossPct / 100) : cuenta * (maxLossPct / 100);
        const dailyLossUSD = cuenta * (dailyLossPct / 100);
        const dailyLossRemaining = dailyLossUSD; // Assuming no loss yet
        
        // Calculate ops before blowout
        const opsBeforeBlowout = maxLossUSD / riesgoDinero;
        
// Calculate ops for target
        const targetUSD = cuenta * (targetPct / 100);
        const opsForTarget = Math.ceil(targetUSD / valorTP);
        
        // Calculate profit/loss and missing amount
        const profitActual = balance - cuenta;
        const missingAmount = profitActual >= 0 ? 
            Math.max(0, targetUSD - profitActual) : 
            targetUSD + Math.abs(profitActual);
        
        // Calculate payout estimate (90% split - DNA Funded up to 90%)
        const payoutEstimate = cuenta * 0.9;
        
        // Determine trader profile
        let profile = LanguageManager.t('profile_conservative');
        if (rr >= 2 && riesgoPct <= 1) {
            profile = LanguageManager.t('profile_conservative');
        } else if (rr >= 1.5 && riesgoPct <= 2) {
            profile = LanguageManager.t('profile_moderate');
        } else {
            profile = LanguageManager.t('profile_aggressive');
        }
        
        let blowoutRisk = LanguageManager.t('blowout_low');
        if (opsBeforeBlowout <= 3) {
            blowoutRisk = LanguageManager.t('blowout_high');
        } else if (opsBeforeBlowout <= 7) {
            blowoutRisk = LanguageManager.t('blowout_medium');
        }
        
        // Determine balance status
        let balanceStatus = 'normal';
        if (drawdownPct >= maxLossPct * 0.8) {
            balanceStatus = 'critical';
        } else if (drawdownPct >= maxLossPct * 0.5) {
            balanceStatus = 'warning';
        }
        
        // Determine warning message
        let warningMessage = LanguageManager.t('operation_ok');
        let warningType = 'success';
        if (rr < 1) {
            warningMessage = LanguageManager.t('warn_rr_low');
            warningType = 'warning';
        } else if (blowoutRisk === LanguageManager.t('blowout_high')) {
            warningMessage = LanguageManager.t('warn_blowout');
            warningType = 'warning';
        } else if (riesgoPct > 2) {
            warningMessage = LanguageManager.t('warn_reduce_risk');
            warningType = 'warning';
        }
        
        // Store current data
        this.currentData = {
            challengeType,
            fase,
            cuenta,
            balance,
            riesgoPct,
            entryPrice,
            stopPrice,
            takePrice,
            instrument: selectedOption.text,
            pipSize,
            valorPip,
            distanciaSL,
            distanciaTP,
            pipsSL,
            pipsTP,
            riesgoDinero,
            valorSL,
            valorTP,
            rr,
            lots,
            maxLossPct,
            dailyLossPct,
            targetPct,
            drawdownPct,
            maxLossUSD,
            dailyLossUSD,
            dailyLossRemaining,
            opsBeforeBlowout,
            opsForTarget,
            targetUSD,
            missingAmount,
            profitActual,
            payoutEstimate,
            profile,
            blowoutRisk,
            balanceStatus,
            warningMessage,
            warningType,
            challengeName: challengeData.name
        };
        
        // Update overlay with all data
        this.updateOverlay();
        
        // Show overlay
        this.showOverlay();
    },
    
    getChallengeData(challengeType) {
        const keyMap = {
            '1 Phase': '1_phase',
            '1_phase': '1_phase',
            '2 Phase': '2_phase',
            '2_phase': '2_phase',
            'Rapid': 'rapid',
            'rapid': 'rapid',
            'Instant Funding': 'instant',
            'instant': 'instant'
        };
        const challenges = {
            '1_phase': { 
                name: '1 Phase Challenge',
                profit_target_pct: 10,
                max_daily_loss_pct: 4,
                max_total_loss_pct: 6
            },
            '2_phase': { 
                name: '2 Phase Challenge',
                phase1: {
                    profit_target_pct: 8,
                    max_daily_loss_pct: 5,
                    max_total_loss_pct: 8
                },
                phase2: {
                    profit_target_pct: 5,
                    max_daily_loss_pct: 5,
                    max_total_loss_pct: 8
                }
            },
            'rapid': { 
                name: 'Rapid Challenge',
                profit_target_pct: 5,
                max_daily_loss_pct: 3,
                max_total_loss_pct: 5
            },
            'instant': { 
                name: 'Instant Funding',
                profit_target_pct: 0,
                max_daily_loss_pct: 0,
                max_total_loss_pct: 4
            }
        };
        const normalized = keyMap[challengeType];
        return challenges[normalized] || challenges['1_phase'];
    },
    
    updateOverlay() {
        const d = this.currentData;
        
        // KPI Grid
// Already using i18n via data-i18n in HTML template
        
        const rrEl = document.getElementById('overlayRR');
        rrEl.textContent = d.rr.toFixed(2);
        rrEl.className = 'kpi-value ' + this.getRRColorClass(d.rr);
        
        document.getElementById('overlayLots').textContent = d.lots.toFixed(2);
        
// Column 1: Profile
        document.getElementById('profileBadge').textContent = LanguageManager.t('trader_profile') + ': ' + d.profile;
        document.getElementById('profileBadge').className = 'profile-badge ' + 
            d.profile.toLowerCase().replace(' ', '-');
        
        // Drawdown: Show remaining if positive, used if negative
        const drawdownEl = document.getElementById('detailDrawdown');
        if (d.profitActual >= 0) {
            // Positive balance - show remaining drawdown in green
            const remainingDD = d.maxLossPct - d.drawdownPct;
            drawdownEl.textContent = remainingDD.toFixed(2) + '% ' + LanguageManager.t('disponible');
            drawdownEl.className = 'detail-value green';
        } else {
            // Negative balance - show used drawdown in red
            drawdownEl.textContent = d.drawdownPct.toFixed(2) + '% ' + LanguageManager.t('usado');
            drawdownEl.className = 'detail-value red';
        }
        
        document.getElementById('detailBlowoutRisk').textContent = d.blowoutRisk;
        document.getElementById('detailBlowoutRisk').className = 
            'detail-value ' + (d.blowoutRisk === LanguageManager.t('blowout_high') ? 'red' : d.blowoutRisk === LanguageManager.t('blowout_medium') ? 'yellow' : 'green');
        
// Column 2: Challenge Progress
        const progressEl = document.getElementById('progressBar');
        const progressTextEl = document.getElementById('progressPercentage');
        
        if (d.profitActual >= 0) {
            // Positive balance - show progress toward target
            const progressPct = d.targetUSD > 0 ? Math.min((d.profitActual / d.targetUSD) * 100, 100) : 0;
            progressEl.style.width = progressPct + '%';
            progressEl.className = 'tech-progress-fill green';
            progressTextEl.textContent = progressPct.toFixed(1) + '% ' + LanguageManager.t('completado');
        } else {
            // Negative balance - show drawdown used
            const ddUsedPct = d.maxLossPct > 0 ? Math.min((d.drawdownPct / d.maxLossPct) * 100, 100) : 0;
            progressEl.style.width = ddUsedPct + '%';
            progressEl.className = 'tech-progress-fill red';
            progressTextEl.textContent = ddUsedPct.toFixed(1) + '% ' + LanguageManager.t('del drawdown usado');
        }
        
document.getElementById('detailPnL').textContent = LanguageManager.t('current_pnl') + ': ' + this.formatCurrency(d.profitActual);
document.getElementById('detailPnL').className = 'detail-value ' + (d.profitActual < 0 ? 'red' : 'green');
document.getElementById('detailTarget').textContent = LanguageManager.t('target_to_reach') + ': ' + this.formatCurrency(d.targetUSD);

// Calculate missing amount correctly
const missingEl = document.getElementById('detailMissing');
if (d.profitActual >= 0) {
    // Positive: target - current profit
    const missing = Math.max(0, d.targetUSD - d.profitActual);
    missingEl.textContent = LanguageManager.t('missing_amount') + ': ' + this.formatCurrency(missing);
    missingEl.className = 'detail-value green';
} else {
    // Negative: target + absolute loss
    const missing = d.targetUSD + Math.abs(d.profitActual);
    missingEl.textContent = LanguageManager.t('missing_amount') + ': ' + this.formatCurrency(missing);
    missingEl.className = 'detail-value red';
        }
        
        // Column 3: Limits
        document.getElementById('detailDailyLoss').textContent = this.formatCurrency(d.dailyLossRemaining);
        document.getElementById('detailMaxDD').textContent = this.formatCurrency(d.maxLossUSD) + ' (' + d.maxLossPct + '%)';
        document.getElementById('detailChallengeType').textContent = LanguageManager.t('challenge_type') + ' ' + d.challengeName + ' ' + LanguageManager.t('phase') + ' ' + d.fase;
        
        // Warning banner
        const banner = document.getElementById('warningBanner');
        const msg = document.getElementById('warningMessage');
        msg.textContent = d.warningMessage;
        banner.className = 'warning-banner ' + d.warningType;
        
        // Expandable details
        document.getElementById('detailPipsSL').textContent = d.pipsSL.toFixed(2);
        document.getElementById('detailPipsTP').textContent = d.pipsTP.toFixed(2);
        document.getElementById('detailValueSL').textContent = this.formatCurrency(d.valorSL);
        document.getElementById('detailValueTP').textContent = this.formatCurrency(d.valorTP);
        document.getElementById('detailPhase').textContent = d.fase === 1 ? LanguageManager.t('Fase') + ' 1' : LanguageManager.t('Fase') + ' 2';
        document.getElementById('detailTargetPct').textContent = d.targetPct + '%';
        document.getElementById('detailOpsForTarget').textContent = d.opsForTarget;
        
        const opsBlowoutEl = document.getElementById('detailOpsBlowout');
        opsBlowoutEl.textContent = d.opsBeforeBlowout.toFixed(1);
        opsBlowoutEl.className = 'detail-value ' + (d.opsBeforeBlowout <= 3 ? 'red' : 'green');
        
        document.getElementById('detailPayout').textContent = this.formatCurrency(d.payoutEstimate) + ' (' + LanguageManager.t('payout_percentage') + ')';
        document.getElementById('detailMaxDailyLoss').textContent = this.formatCurrency(d.dailyLossUSD);
    },
    
    getRRColorClass(rr) {
        if (rr >= 2) return 'green';
        if (rr >= 1) return 'yellow';
        return 'red';
    },
    
    showOverlay() {
        this.overlay.classList.add('active');
        
        // Animate KPI cards sequentially
        const kpiCards = document.querySelectorAll('.overlay-kpi');
        kpiCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Animate countup numbers
        this.animateCountups();
    },
    
    closeOverlay() {
        this.overlay.classList.remove('active');
    },
    
    animateCountups() {
        document.querySelectorAll('.countup').forEach(el => {
            const target = parseFloat(el.getAttribute('data-target'));
            if (isNaN(target)) return;
            
            const prefix = el.getAttribute('data-prefix') || '';
            const suffix = el.getAttribute('data-suffix') || '';
            const decimals = parseInt(el.getAttribute('data-decimals')) || 2;
            const duration = 900;
            const start = performance.now();
            
            const update = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;
                
                el.textContent = prefix + current.toFixed(decimals) + suffix;
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };
            
            requestAnimationFrame(update);
        });
    },
    
    async shareResults() {
        const d = this.currentData;
    const shareText = `${LanguageManager.t('calculator_title')} - Latin Labs Traders\n\n` +
    `${LanguageManager.t('Challenge')}: ${d.challengeName}\n` +
    `${LanguageManager.t('Fase')}: ${d.fase}\n` +
    `${LanguageManager.t('Instrumento')}: ${d.instrument}\n` +
    `${LanguageManager.t('Riesgo')}: ${this.formatCurrency(d.riesgoDinero)} (${d.riesgoPct}%)\n` +
    `${LanguageManager.t('Lots')}: ${d.lots.toFixed(2)}\n` +
    `R:R = ${d.rr.toFixed(2)}\n` +
    `TP: ${this.formatCurrency(d.valorTP)}\n` +
    `SL: ${this.formatCurrency(d.valorSL)} (${LanguageManager.t('Stop Loss')})\n` +
    `${LanguageManager.t('Ops antes de Blowout')}: ${d.opsBeforeBlowout.toFixed(1)}\n\n` +
    `${LanguageManager.t('Link')} ${window.location.origin}/calculator`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: LanguageManager.t('share_results_title'),
                    text: shareText,
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error al compartir:', err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                this.showToast(LanguageManager.t('toast_copied'));
            } catch (err) {
                alert(LanguageManager.t('toast_copy_fail'));
            }
        }
    },
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-primary);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 3000;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes slideDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Calculator.init();
});

// Export for use in other scripts
window.Calculator = Calculator;

