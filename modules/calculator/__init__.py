"""
Calculator Blueprint - Complete v1.0 with All Features
Migrated from EntornoPrincipal with full calculation logic
"""
import os
from flask import Blueprint, render_template, request
from data.instruments import INSTRUMENT_GROUPS
from data.challenges import CHALLENGES

# Create INSTRUMENTS dict keyed by symbol for compatibility
INSTRUMENTS = {}
for group_name, instruments in INSTRUMENT_GROUPS.items():
    for inst in instruments:
        INSTRUMENTS[inst['symbol']] = inst

calculator_bp = Blueprint('calculator', __name__, 
    static_folder='static')

@calculator_bp.route('/', methods=['GET', 'POST'])
def index():
    resultado = None
    challenge_info = None
    
    if request.method == 'POST':
        challenge = request.form['challenge']
        cuenta = request.form['cuenta']
        instrumento = request.form['instrument']
        fase = int(request.form.get('fase', 1))
        balance = float(request.form['accountBalance'])
        riesgo = float(request.form['riskPercent'])
        entrada = float(request.form['entryPrice'])
        stop = float(request.form['stopPrice'])
        take = float(request.form['takePrice'])
        cuenta_inicial = float(cuenta)
        
        # Challenge data
        challenge_info = CHALLENGES[challenge][cuenta]
        
        if challenge == '2 Phase':
            target_porcentaje = challenge_info['phase1_target'] if fase == 1 else challenge_info['phase2_target']
        else:
            target_porcentaje = challenge_info['phase1_target']
        
        # Instrument data
        instrument_data = INSTRUMENTS[instrumento]
        pip_size = instrument_data['pip_size']
        valor_pip = instrument_data['valor_pip']
        tipo = instrument_data.get('group', 'forex').lower()
        
        # Core calculations
        riesgo_dinero = balance * (riesgo / 100)
        distancia_sl = abs(entrada - stop)
        distancia_tp = abs(take - entrada)
        if distancia_sl <= 0:
            distancia_sl = 0.00001
        pips_sl = distancia_sl / pip_size
        pips_tp = distancia_tp / pip_size
        rr = distancia_tp / distancia_sl
        valor_sl_usd = riesgo_dinero
        valor_tp_usd = riesgo_dinero * rr
        
        # Lot calculation
        denominador = pips_sl * valor_pip
        lotes = riesgo_dinero / denominador if denominador > 0 else 0
        
        # Risk profile
        if riesgo <= 0.25:
            perfil = 'Conservador'
        elif riesgo <= 0.75:
            perfil = 'Moderado'
        elif riesgo <= 1.5:
            perfil = 'Agresivo'
        else:
            perfil = 'Muy Agresivo'
        
        # Units
        if tipo in ['major', 'cross']:
            unidad = 'pips'
        elif tipo == 'precious':
            unidad = 'pips oro'
        elif tipo in ['us', 'europe', 'asia']:
            unidad = 'puntos'
        else:
            unidad = 'pips'
        
        # Targets
        target_usd = cuenta_inicial * (target_porcentaje / 100)
        daily_loss_usd = cuenta_inicial * (challenge_info['daily_loss'] / 100)
        
        # Max Loss — trailing for Instant Funding
        if challenge == 'Instant Funding':
            max_loss_usd = balance * (challenge_info['max_loss'] / 100)
            max_loss_label = 'Trailing'
        else:
            max_loss_usd = cuenta_inicial * (challenge_info['max_loss'] / 100)
            max_loss_label = 'Fijo'
        
        # Operations needed
        operaciones_objetivo = target_usd / valor_tp_usd if valor_tp_usd > 0 else 0
        
        # P&L
        profit_actual = balance - cuenta_inicial
        faltante_usd = max(0, target_usd - max(0, profit_actual))
        operaciones_restantes = faltante_usd / valor_tp_usd if valor_tp_usd > 0 else 0
        
        # Progress bar
        if target_usd > 0:
            progreso_porcentaje = min((max(0, profit_actual) / target_usd) * 100, 100)
        else:
            progreso_porcentaje = 100
        
        # Warning
        operaciones_perdedoras = max_loss_usd / riesgo_dinero if riesgo_dinero > 0 else 0
        if operaciones_perdedoras <= 3:
            advertencia = '⚠ Riesgo elevado. Podrías perder el challenge en pocas operaciones.'
        else:
            advertencia = '✅ Riesgo dentro de parámetros razonables.'
        
        # Drawdown health
        if profit_actual < 0:
            drawdown_pct = abs(profit_actual) / cuenta_inicial * 100
            drawdown_remaining_pct = max(0, challenge_info['max_loss'] - drawdown_pct)
            if drawdown_pct >= (challenge_info['max_loss'] - 1):
                balance_status = 'critical'
            elif drawdown_pct >= 2:
                balance_status = 'warning'
            else:
                balance_status = 'caution'
        else:
            drawdown_pct = 0
            drawdown_remaining_pct = challenge_info['max_loss']
            balance_status = 'normal'
        drawdown_bar_pct = min((drawdown_pct / challenge_info['max_loss']) * 100, 100) if challenge_info['max_loss'] > 0 else 0
        
        # Daily loss tracking
        daily_loss_remaining = max(0, daily_loss_usd - riesgo_dinero)
        risk_daily_pct = (riesgo_dinero / daily_loss_usd * 100) if daily_loss_usd > 0 else 0
        
        # Consecutive losses simulation
        sim_1 = balance - riesgo_dinero
        sim_2 = balance - (riesgo_dinero * 2)
        sim_3 = balance - (riesgo_dinero * 3)
        sim_5 = balance - (riesgo_dinero * 5)
        min_allowed = cuenta_inicial - (cuenta_inicial * challenge_info['max_loss'] / 100)
        if sim_5 <= min_allowed:
            blowout_risk = 'Alta'
        elif sim_3 <= min_allowed:
            blowout_risk = 'Moderada'
        else:
            blowout_risk = 'Baja'
        
# Payout estimate (90% profit split)
        payout_estimate = target_usd * 0.9
        
        resultado = {
            "balance_actual": round(balance, 2),
            "fase": fase,
            "instrumento": instrumento,
            "tipo": tipo,
            "unidad": unidad,
            "riesgo_dinero": round(riesgo_dinero, 2),
            "distancia_sl": round(distancia_sl, 4 if pip_size < 0.01 else 2),
            "distancia_tp": round(distancia_tp, 4 if pip_size < 0.01 else 2),
            "pips_sl": round(pips_sl, 1),
            "pips_tp": round(pips_tp, 1),
            "valor_sl_usd": round(valor_sl_usd, 2),
            "valor_tp_usd": round(valor_tp_usd, 2),
            "rr": round(rr, 2),
            "lotes": round(lotes, 2),
            "perfil": perfil,
            "target_porcentaje": target_porcentaje,
            "target_usd": round(target_usd, 2),
            "profit_actual": round(profit_actual, 2),
            "faltante_usd": round(faltante_usd, 2),
            "daily_loss_usd": round(daily_loss_usd, 2),
            "max_loss_usd": round(max_loss_usd, 2),
            "max_loss_label": max_loss_label,
            "operaciones_objetivo": round(operaciones_objetivo, 1),
            "operaciones_restantes": round(operaciones_restantes, 1),
            "operaciones_perdedoras": round(operaciones_perdedoras, 1),
            "progreso_porcentaje": round(progreso_porcentaje, 1),
            "advertencia": advertencia,
            "drawdown_pct": round(drawdown_pct, 2),
            "drawdown_bar_pct": round(drawdown_bar_pct, 1),
            "drawdown_remaining_pct": round(drawdown_remaining_pct, 2),
            "balance_status": balance_status,
            "daily_loss_remaining": round(daily_loss_remaining, 2),
            "risk_daily_pct": round(risk_daily_pct, 1),
            "sim_1_loss": round(max(sim_1, 0), 2),
            "sim_2_losses": round(max(sim_2, 0), 2),
            "sim_3_losses": round(max(sim_3, 0), 2),
            "sim_5_losses": round(max(sim_5, 0), 2),
            "blowout_risk": blowout_risk,
            "payout_estimate": round(payout_estimate, 2),
"challenge_name": challenge,  # Add challenge name
        }
    
    instrument_groups = INSTRUMENT_GROUPS
    challenges = list(CHALLENGES.keys())
    challenge_details = CHALLENGES
    
    # Pass the selected challenge name for display
    selected_challenge_name = challenge if resultado else None
    
    return render_template('calculator/index.html',
                         resultado=resultado,
                         challenge_info=challenge_info,
                         selected_challenge_name=selected_challenge_name,
                         instrument_groups=instrument_groups,
                         challenges=challenges,
                         challenge_details=challenge_details)
