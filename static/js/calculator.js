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
        
        if (this.form) {
            this.setupForm();
        }
        
        if (this.overlay) {
            this.setupOverlay();
        }
        
        // Setup floating labels
        this.setupFloatingLabels();
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
            this.showToast(i18n('calc_valid_prices', 'Por favor, ingresa precios válidos'));
            return;
        }
        
        if (stopPrice === entryPrice || takePrice === entryPrice) {
            this.showToast(i18n('calc_sl_tp_diff', 'Stop Loss y Take Profit deben ser diferentes al precio de entrada'));
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
        const valorSL = distanciaSL * valorPip;
        const valorTP = distanciaTP * valorPip;
        
        // Calculate Risk/Reward Ratio
        const rr = pipsTP / pipsSL;
        
        // Calculate lots
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
        
        // Calculate max loss amounts
        const maxLossUSD = cuenta * (maxLossPct / 100);
        const dailyLossUSD = cuenta * (dailyLossPct / 100);
        const dailyLossRemaining = dailyLossUSD; // Assuming no loss yet
        
        // Calculate ops before blowout
        const opsBeforeBlowout = maxLossUSD / riesgoDinero;
        
        // Calculate ops for target
        const targetUSD = cuenta * (targetPct / 100);
        const opsForTarget = Math.ceil(targetUSD / valorTP);
        
        // Calculate missing amount (target - current profit)
        const profitActual = 0; // Assuming starting fresh
        const missingAmount = targetUSD - profitActual;
        
        // Calculate payout estimate (90% split - DNA Funded up to 90%)
        const payoutEstimate = cuenta * 0.9;
        
        // Determine trader profile
        let profile = i18n('profile_conservative', 'Conservador');
        if (rr >= 2 && riesgoPct <= 1) {
            profile = i18n('profile_conservative', 'Conservador');
        } else if (rr >= 1.5 && riesgoPct <= 2) {
            profile = i18n('profile_moderate', 'Moderado');
        } else {
            profile = i18n('profile_aggressive', 'Agresivo');
        }
        
        // Determine blowout risk
        let blowoutRisk = i18n('blowout_low', 'Baja');
        if (opsBeforeBlowout <= 3) {
            blowoutRisk = i18n('blowout_high', 'Alta');
        } else if (opsBeforeBlowout <= 7) {
            blowoutRisk = i18n('blowout_medium', 'Moderada');
        }
        
        // Determine balance status
        let balanceStatus = 'normal';
        if (drawdownPct >= maxLossPct * 0.8) {
            balanceStatus = 'critical';
        } else if (drawdownPct >= maxLossPct * 0.5) {
            balanceStatus = 'warning';
        }
        
        // Determine warning message
        let warningMessage = i18n('op_ok', 'Operación configurada correctamente');
        let warningType = 'success';
        if (rr < 1) {
            warningMessage = i18n('warn_rr_low', 'Riesgo elevado: El Risk/Reward es menor a 1');
            warningType = 'warning';
        } else if (blowoutRisk === i18n('blowout_high', 'Alta')) {
            warningMessage = i18n('warn_blowout', 'Riesgo elevado: Pocas operaciones antes de blowout');
            warningType = 'warning';
        } else if (riesgoPct > 2) {
            warningMessage = i18n('warn_reduce_risk', 'Considera reducir el riesgo por operación');
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
        return challenges[challengeType] || challenges['1_phase'];
    },
    
    updateOverlay() {
        const d = this.currentData;
        
        // KPI Grid
        document.getElementById('overlayRiskAmount').textContent = this.formatCurrency(d.riesgoDinero);
        document.getElementById('overlayTPGain').textContent = this.formatCurrency(d.valorTP);
        
        const rrEl = document.getElementById('overlayRR');
        rrEl.textContent = d.rr.toFixed(2);
        rrEl.className = 'kpi-value ' + this.getRRColorClass(d.rr);
        
        document.getElementById('overlayLots').textContent = d.lots.toFixed(2);
        
        // Column 1: Profile
        document.getElementById('profileBadge').textContent = d.profile;
        document.getElementById('profileBadge').className = 'profile-badge ' + 
            d.profile.toLowerCase().replace(' ', '-');
        document.getElementById('detailDrawdown').textContent = d.drawdownPct.toFixed(2) + '%';
        document.getElementById('detailDrawdown').className = 'detail-value ' + d.balanceStatus;
        document.getElementById('detailBlowoutRisk').textContent = d.blowoutRisk;
        document.getElementById('detailBlowoutRisk').className = 
            'detail-value ' + (d.blowoutRisk === i18n('blowout_high', 'Alta') ? 'red' : d.blowoutRisk === i18n('blowout_medium', 'Moderada') ? 'yellow' : 'green');
        
        // Column 2: Challenge Progress
        const progressPct = d.targetUSD > 0 ? Math.min((d.profitActual / d.targetUSD) * 100, 100) : 0;
        document.getElementById('progressBar').style.width = progressPct + '%';
        document.getElementById('progressPercentage').textContent = progressPct.toFixed(1) + '%';
        document.getElementById('detailPnL').textContent = this.formatCurrency(d.profitActual);
        document.getElementById('detailPnL').className = 'detail-value ' + (d.profitActual < 0 ? 'red' : 'green');
        document.getElementById('detailTarget').textContent = this.formatCurrency(d.targetUSD);
        document.getElementById('detailMissing').textContent = this.formatCurrency(d.missingAmount);
        
        // Color missing amount
        const missingEl = document.getElementById('detailMissing');
        if (d.balanceStatus === 'critical' || d.balanceStatus === 'warning') {
            missingEl.className = 'detail-value red';
        } else if (d.profitActual >= 0) {
            missingEl.className = 'detail-value green';
        } else {
            missingEl.className = 'detail-value yellow';
        }
        
        // Column 3: Limits
        document.getElementById('detailDailyLoss').textContent = this.formatCurrency(d.dailyLossRemaining);
        document.getElementById('detailMaxDD').textContent = this.formatCurrency(d.maxLossUSD) + ' (' + d.maxLossPct + '%)';
        document.getElementById('detailChallengeType').textContent = d.challengeName;
        
        // Warning banner
        const banner = document.getElementById('warningBanner');
        const msg = document.getElementById('warningMessage');
        msg.textContent = d.warningMessage;
        banner.className = 'warning-banner ' + d.warningType;
        
        // Expandable details
        document.getElementById('detailDistSL').textContent = d.distanciaSL.toFixed(4);
        document.getElementById('detailDistTP').textContent = d.distanciaTP.toFixed(4);
        document.getElementById('detailPipsSL').textContent = d.pipsSL.toFixed(2);
        document.getElementById('detailPipsTP').textContent = d.pipsTP.toFixed(2);
        document.getElementById('detailValueSL').textContent = this.formatCurrency(d.valorSL);
        document.getElementById('detailValueTP').textContent = this.formatCurrency(d.valorTP);
        document.getElementById('detailPhase').textContent = 'Fase ' + d.fase;
        document.getElementById('detailTargetPct').textContent = d.targetPct + '%';
        document.getElementById('detailOpsForTarget').textContent = d.opsForTarget;
        
        const opsBlowoutEl = document.getElementById('detailOpsBlowout');
        opsBlowoutEl.textContent = d.opsBeforeBlowout.toFixed(1);
        opsBlowoutEl.className = 'detail-value ' + (d.opsBeforeBlowout <= 3 ? 'red' : 'green');
        
        document.getElementById('detailPayout').textContent = this.formatCurrency(d.payoutEstimate);
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
        const shareText = `${i18n('share_heading', 'Risk Calculator')} - Latin Labs Traders\n\n` +
                         `${i18n('challenge_label', 'Challenge')}: ${d.challengeName}\n` +
                         `${i18n('phase', 'Fase')}: ${d.fase}\n` +
                         `${i18n('Instrumento', 'Instrumento')}: ${d.instrument}\n` +
                         `${i18n('Riesgo', 'Riesgo')}: ${this.formatCurrency(d.riesgoDinero)} (${d.riesgoPct}%)\n` +
                         `${i18n('Lots', 'Lotes')}: ${d.lots.toFixed(2)}\n` +
                         `${i18n('risk_reward', 'R:R')} = ${d.rr.toFixed(2)}\n` +
                         `${i18n('profit_tp', 'TP')}: ${this.formatCurrency(d.valorTP)}\n` +
                         `${i18n('sl_value', 'SL')}: ${this.formatCurrency(d.valorSL)}\n` +
                         `${i18n('ops_before_blowout', 'Ops antes de Blowout')}: ${d.opsBeforeBlowout.toFixed(1)}\n\n` +
                         `${i18n('Link', 'Link')} ${window.location.origin}/calculator`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: i18n('share_results_title', 'Resultados de Operación'),
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
                this.showToast(i18n('toast_copied', 'Resultados copiados al portapapeles'));
            } catch (err) {
                alert(i18n('toast_copy_fail', 'No se pudo copiar al portapapeles'));
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

