"""
Economic Calendar Blueprint with ForexFactory scraping
"""
import os
from flask import Blueprint, render_template, jsonify, request
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re

calendar_bp = Blueprint('calendar', __name__,
    static_folder='static')

@calendar_bp.route('/')
def index():
    return render_template('calendar/index.html')

@calendar_bp.route('/api/events')
def get_events():
    """Fetch economic events from ForexFactory"""
    date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    
    try:
        # Parse date
        event_date = datetime.strptime(date_str, '%Y-%m-%d')
        formatted_date = event_date.strftime('%d %b %y').upper()
        
        # ForexFactory URL structure
        url = f"https://www.forexfactory.com/calendar.php?day={event_date.day}&month={event_date.month}&year={event_date.year}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        events = []
        
        # Parse calendar rows
        table = soup.find('table', class_='calendar')
        if table:
            rows = table.find_all('tr', class_='event-row')
            
            for row in rows[:50]:  # Limit to 50 events
                try:
                    # Extract time
                    time_cell = row.find('td', class_='calendar-time')
                    time = time_cell.get_text(strip=True) if time_cell else ''
                    
                    # Extract currency
                    currency_cell = row.find('td', class_='calendar-currency')
                    currency = currency_cell.get_text(strip=True) if currency_cell else ''
                    
                    # Extract event title
                    title_cell = row.find('td', class_='calendar-event')
                    title = title_cell.get_text(strip=True) if title_cell else ''
                    
                    # Extract impact
                    impact_class = row.get('class', [])
                    impact = 'low'
                    if 'red' in impact_class:
                        impact = 'high'
                    elif 'orange' in impact_class:
                        impact = 'medium'
                    
                    # Extract actual and forecast
                    actual = ''
                    forecast = ''
                    
                    actual_cell = row.find('td', class_='calendar-actual')
                    if actual_cell:
                        actual = actual_cell.get_text(strip=True)
                    
                    forecast_cell = row.find('td', class_='calendar-forecast')
                    if forecast_cell:
                        forecast = forecast_cell.get_text(strip=True)
                    
                    if title and currency:
                        events.append({
                            'time': time,
                            'currency': currency,
                            'title': title,
                            'actual': actual,
                            'forecast': forecast,
                            'impact': impact
                        })
                except Exception as e:
                    continue
        
        # Fallback: Generate sample events if scraping fails
        if not events:
            events = generate_sample_events(event_date)
        
        return jsonify({
            'success': True,
            'events': events,
            'date': date_str
        })
        
    except Exception as e:
        # Return sample events on error
        event_date = datetime.strptime(date_str, '%Y-%m-%d')
        events = generate_sample_events(event_date)
        
        return jsonify({
            'success': True,
            'events': events,
            'date': date_str,
            'message': 'Using sample data (scraping unavailable)'
        })

@calendar_bp.route('/api/analyze', methods=['POST'])
def analyze_event():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    lang = data.get('lang', 'es')
    event = {
        'title': data.get('title', ''),
        'currency': data.get('currency', ''),
        'impact': data.get('impact', 'low'),
        'time': data.get('time', ''),
        'actual': data.get('actual', ''),
        'forecast': data.get('forecast', '')
    }

    try:
        from services.ai_service import MiniMaxM3
        from flask import current_app
        ai = MiniMaxM3(
            api_key=current_app.config['NVIDIA_API_KEY'],
            model=current_app.config['NVIDIA_MODEL'],
            base_url=current_app.config['NVIDIA_BASE_URL']
        )
        analysis = ai.analyze_event(event, lang=lang)
        return jsonify({'success': True, 'analysis': analysis})
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'AI analysis unavailable: {str(e)}'
        }), 500

def generate_sample_events(event_date):
    """Generate sample economic events for demonstration"""
    currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD']
    impacts = ['high', 'medium', 'low']
    
    sample_events = [
        {
            'time': '08:30',
            'currency': 'USD',
            'title': 'Core CPI m/m',
            'actual': '0.3%',
            'forecast': '0.2%',
            'impact': 'high'
        },
        {
            'time': '10:00',
            'currency': 'USD',
            'title': 'University of Michigan Consumer Sentiment',
            'actual': '69.8',
            'forecast': '70.0',
            'impact': 'medium'
        },
        {
            'time': '03:00',
            'currency': 'EUR',
            'title': 'ECB Interest Rate Decision',
            'actual': '4.50%',
            'forecast': '4.50%',
            'impact': 'high'
        },
        {
            'time': '09:00',
            'currency': 'GBP',
            'title': 'GDP m/m',
            'actual': '0.2%',
            'forecast': '0.1%',
            'impact': 'high'
        },
        {
            'time': '23:50',
            'currency': 'JPY',
            'title': 'Trade Balance',
            'actual': '-0.35T',
            'forecast': '-0.40T',
            'impact': 'medium'
        },
        {
            'time': '14:00',
            'currency': 'CHF',
            'title': 'SNB Interest Rate Decision',
            'actual': '1.75%',
            'forecast': '1.75%',
            'impact': 'high'
        },
        {
            'time': '00:30',
            'currency': 'AUD',
            'title': 'RBA Interest Rate Decision',
            'actual': '4.35%',
            'forecast': '4.35%',
            'impact': 'high'
        },
        {
            'time': '12:30',
            'currency': 'CAD',
            'title': 'Core Retail Sales m/m',
            'actual': '0.4%',
            'forecast': '0.3%',
            'impact': 'medium'
        }
    ]
    
    return sample_events
