"""
News Blueprint with AI-powered news agent
"""
import os
from flask import Blueprint, render_template, jsonify, request, current_app
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import feedparser
import re

from services.ai_service import MiniMaxM3

news_bp = Blueprint('news', __name__,
    static_folder='static')

def get_ai():
    return MiniMaxM3(
        api_key=current_app.config['NVIDIA_API_KEY'],
        model=current_app.config['NVIDIA_MODEL'],
        base_url=current_app.config['NVIDIA_BASE_URL']
    )

# RSS Feeds configuration
RSS_FEEDS = {
    'bloomberg': {
        'url': 'https://www.bloomberg.com/feed/podcast/markets.xml',
        'category_map': {
            'markets': 'forex',
            'technology': 'stocks',
            'commodities': 'commodities',
            'crypto': 'crypto'
        }
    },
    'reuters': {
        'url': 'https://www.reutersagency.com/feed/?best-topics=forex&post_type=best',
        'category_map': {
            'markets': 'forex',
            'business': 'stocks',
            'commodities': 'commodities'
        }
    },
    'investing': {
        'url': 'https://www.investing.com/rss/news.rss',
        'category_map': {
            'forex': 'forex',
            'crypto': 'crypto',
            'commodities': 'commodities',
            'stocks': 'stocks'
        }
    }
}

@news_bp.route('/')
def index():
    return render_template('news/index.html')

@news_bp.route('/api/fetch')
def fetch_news():
    """Fetch news from multiple RSS sources"""
    try:
        all_articles = []
        
        for source, config in RSS_FEEDS.items():
            try:
                feed = feedparser.parse(config['url'])
                
                for entry in feed.entries[:10]:  # Limit to 10 per source
                    # Determine category
                    category = 'general'
                    for tag in entry.get('tags', []):
                        term = tag.get('term', '').lower()
                        if term in config['category_map']:
                            category = config['category_map'][term]
                            break
                    
                    # Extract clean text
                    title = entry.get('title', '')
                    description = entry.get('description', '')
                    
                    # Clean HTML from description
                    if description:
                        clean_text = re.sub(r'<[^>]+>', '', description)
                        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                        excerpt = clean_text[:200] + '...' if len(clean_text) > 200 else clean_text
                    else:
                        excerpt = title
                    
                    article = {
                        'title': title,
                        'excerpt': excerpt,
                        'content': clean_text if description else title,
                        'url': entry.get('link', ''),
                        'source': source,
                        'category': category,
                        'publishedAt': entry.get('published', datetime.now().isoformat())
                    }
                    
                    all_articles.append(article)
                    
            except Exception as e:
                print(f"Error fetching {source}: {e}")
                continue
        
        # Sort by published date
        all_articles.sort(key=lambda x: x['publishedAt'], reverse=True)
        
        return jsonify({
            'success': True,
            'articles': all_articles[:30]  # Return max 30 articles
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching news: {str(e)}'
        }), 500

@news_bp.route('/api/analyze', methods=['POST'])
def analyze_news():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    title = data.get('title', '')
    content = data.get('content', '')
    source = data.get('source', '')
    lang = data.get('lang', 'es')

    try:
        ai = get_ai()
        analysis = ai.analyze_news(title, content, source, lang=lang)
        return jsonify({'success': True, 'analysis': analysis})
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'AI analysis unavailable: {str(e)}'
        }), 500
