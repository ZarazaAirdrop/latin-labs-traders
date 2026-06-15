"""
Configuration for Latin Labs Traders
"""
import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # DNA Funded Referral
    DNA_REFERRAL_URL = "https://partners.dnafunded.com/click?campaign_id=1&ref_id=553"
    
    # Tracking (add your IDs after setup)
    GA_ID = "YOUR_GA_ID"  # Ej: G-ABC123XYZ
    FB_PIXEL_ID = "YOUR_FB_PIXEL_ID"  # Ej: 123456789012345
    
    # RSS & Scraping settings
    RSS_TIMEOUT = 10
    SCRAPING_TIMEOUT = 15
    MAX_NEWS_ITEMS = 20
    
    # Social Agent (Nitter)
    NITTER_BASE_URL = "https://nitter.net"

    # NVIDIA NIM API (MiniMax-M3)
    NVIDIA_API_KEY = os.environ.get('NVIDIA_API_KEY', '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')
    NVIDIA_MODEL = os.environ.get('NVIDIA_MODEL', 'mistralai/mistral-large-3-675b-instruct-2512')
    NVIDIA_BASE_URL = os.environ.get('NVIDIA_BASE_URL', 'https://integrate.api.nvidia.com/v1')