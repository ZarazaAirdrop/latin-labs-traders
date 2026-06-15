"""
News sources for RSS feeds
"""

NEWS_SOURCES = {
    "bloomberg": {
        "name": "Bloomberg",
        "url": "https://www.bloomberg.com/rss/markets",
        "category": "markets"
    },
    "reuters": {
        "name": "Reuters",
        "url": "https://www.reutersagency.com/feed/?best-topics=forex-and-commodities",
        "category": "forex"
    },
    "investing": {
        "name": "Investing.com",
        "url": "https://es.investing.com/rss/news.rss",
        "category": "general"
    }
}

def get_news_sources():
    """Return all news sources"""
    return NEWS_SOURCES

def get_source_by_name(name):
    """Get news source by name"""
    return NEWS_SOURCES.get(name)