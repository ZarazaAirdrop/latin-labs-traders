"""
Social Media Blueprint with Nitter RSS feeds
"""
import os
from flask import Blueprint, render_template, jsonify, request, current_app
import feedparser
from datetime import datetime, timezone

from services.ai_service import MiniMaxM3

social_bp = Blueprint('social', __name__,
    static_folder='static')

def get_ai():
    return MiniMaxM3(
        api_key=current_app.config['NVIDIA_API_KEY'],
        model=current_app.config['NVIDIA_MODEL'],
        base_url=current_app.config['NVIDIA_BASE_URL']
    )

# Nitter RSS feed configuration (no API key required)
NITTER_FEEDS = {
    # --- World Leaders ---
    'realDonaldTrump': {
        'url': 'https://nitter.net/realDonaldTrump/rss',
        'name': 'Donald Trump'
    },
    'POTUS': {
        'url': 'https://nitter.net/POTUS/rss',
        'name': 'President of the USA'
    },
    'CasaPresidencial': {
        'url': 'https://nitter.net/CasaPresidencial/rss',
        'name': 'Casa Presidencial'
    },
    # --- Finance & Economics ---
    'elonmusk': {
        'url': 'https://nitter.net/elonmusk/rss',
        'name': 'Elon Musk'
    },
    'RayDalio': {
        'url': 'https://nitter.net/RayDalio/rss',
        'name': 'Ray Dalio'
    },
    'APompliano': {
        'url': 'https://nitter.net/APompliano/rss',
        'name': 'Anthony Pompliano'
    },
    'carlquintanilla': {
        'url': 'https://nitter.net/carlquintanilla/rss',
        'name': 'Carl Quintanilla'
    },
    'LizAnnSonders': {
        'url': 'https://nitter.net/LizAnnSonders/rss',
        'name': 'Liz Ann Sonders'
    },
    'KathyLien': {
        'url': 'https://nitter.net/KathyLien/rss',
        'name': 'Kathy Lien'
    },
    'Michele_Calabro1': {
        'url': 'https://nitter.net/Michele_Calabro1/rss',
        'name': 'Michele Calabro'
    },
    # --- Trading & Technical Analysis ---
    'PeterLBrandt': {
        'url': 'https://nitter.net/PeterLBrandt/rss',
        'name': 'Peter Brandt'
    },
    'Trader_XO': {
        'url': 'https://nitter.net/Trader_XO/rss',
        'name': 'Trader_XO'
    },
    'FX_Alchemist': {
        'url': 'https://nitter.net/FX_Alchemist/rss',
        'name': 'FX Alchemist'
    },
    'derek_freedom': {
        'url': 'https://nitter.net/derek_freedom/rss',
        'name': 'Derek Freedom'
    },
    # --- Macro & Research ---
    'MacroCharts': {
        'url': 'https://nitter.net/MacroCharts/rss',
        'name': 'Macro Charts'
    },
    'biancoresearch': {
        'url': 'https://nitter.net/biancoresearch/rss',
        'name': 'Bianco Research'
    },
    'ProfChuang': {
        'url': 'https://nitter.net/ProfChuang/rss',
        'name': 'Prof. Chuang'
    },
    # --- Crypto ---
    'CryptoCred': {
        'url': 'https://nitter.net/CryptoCred/rss',
        'name': 'CryptoCred'
    },
    'DaanCrypto': {
        'url': 'https://nitter.net/DaanCrypto/rss',
        'name': 'Daan Crypto'
    }
}

# --- Helpers ---
def parse_timestamp(published_str):
    """Parse RSS published date to ISO format string."""
    try:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(published_str).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

def extract_handle(profile_url):
    """Extract @handle from Nitter profile URL if available."""
    for handle in NITTER_FEEDS:
        if handle in profile_url:
            return f'@{handle}'
    return '@unknown'

# --- Routes ---
@social_bp.route('/')
def index():
    return render_template('social/index.html')

@social_bp.route('/api/tweets')
def get_tweets():
    """Fetch tweets from Nitter RSS feeds, cap per account, filter by relevance."""
    try:
        all_tweets = []
        max_per_account = int(request.args.get('max_per_account', 2))
        account_filter = request.args.get('account', 'all')

        for handle, config in NITTER_FEEDS.items():
            if account_filter != 'all' and handle != account_filter:
                continue
            try:
                feed = feedparser.parse(config['url'])
                count = 0
                for entry in feed.entries:
                    if count >= max_per_account:
                        break
                    tweet = {
                        'text': entry.get('title', ''),
                        'url': entry.get('link', ''),
                        'handle': f'@{handle}',
                        'name': config['name'],
                        'timestamp': parse_timestamp(entry.get('published', ''))
                    }
                    all_tweets.append(tweet)
                    count += 1
            except Exception as e:
                print(f"Error fetching {handle}: {e}")
                continue

        # Sort by timestamp (newest first)
        all_tweets.sort(key=lambda x: x['timestamp'], reverse=True)

        return jsonify({
            'success': True,
            'tweets': all_tweets[:40]
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching tweets: {str(e)}'
        }), 500

@social_bp.route('/api/analyze', methods=['POST'])
def analyze_tweet():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    text = data.get('text', '')
    handle = data.get('handle', '')
    lang = data.get('lang', 'es')

    try:
        ai = get_ai()
        analysis = ai.analyze_sentiment(text, handle, lang=lang)
        return jsonify({'success': True, 'analysis': analysis})
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'AI sentiment analysis unavailable: {str(e)}'
        }), 500

@social_bp.route('/api/analyze-trends', methods=['POST'])
def analyze_trends():
    """Analyze a batch of tweets for financial relevance and trend alignment."""
    data = request.get_json()
    if not data or 'tweets' not in data:
        return jsonify({'success': False, 'message': 'No tweets provided'}), 400

    tweets = data['tweets'][:10]
    lang = data.get('lang', 'es')

    try:
        ai = get_ai()
        results = ai.analyze_tweet_relevance(tweets, lang=lang)
        return jsonify({'success': True, 'analysis': results})
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Trend analysis unavailable: {str(e)}'
        }), 500
