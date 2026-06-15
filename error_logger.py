"""
Error Logger for Latin Labs Traders
"""
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
LOG_FILE = Path(__file__).parent / 'error_log.txt'

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def log_error(error: Exception, context: str = ""):
    """Log an error with context"""
    logger.error(f"{context} - {type(error).__name__}: {str(error)}")

def log_info(message: str):
    """Log info message"""
    logger.info(message)

def log_warning(message: str):
    """Log warning message"""
    logger.warning(message)