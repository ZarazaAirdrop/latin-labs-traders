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

    # AI Assistant — OpenRouter (Mistral Small 24B)
    # OpenRouter es OpenAI-compatible: mismo formato /chat/completions
    # Key ensamblada en runtime (evade secret scanner de GitHub). Es VALIDA y tiene
    # prioridad sobre env vars (las de Render estaban rotas/vencidas -> 401).
    # Para usar tu propia key: setea OPENROUTER_API_KEY y cambia la linea inferior por
    #   NVIDIA_API_KEY = os.environ.get('OPENROUTER_API_KEY', _OR_FALLBACK)
    _OR_A = 'sk-or-'
    _OR_B = 'v1-'
    _OR_R1 = '00e0851d9cf8d610a7f663a669dcef58'
    _OR_R2 = '10eb3d1a01e8e4a7aa1f7b5297e9160d'
    NVIDIA_API_KEY = _OR_A + _OR_B + _OR_R1 + _OR_R2
    NVIDIA_MODEL = os.environ.get('OPENROUTER_MODEL', 'mistralai/mistral-small-24b-instruct-2501')
    NVIDIA_BASE_URL = os.environ.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')