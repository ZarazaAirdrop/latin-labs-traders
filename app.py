"""
Latin Labs Traders - Flask Application
"""
import os
from flask import Flask, render_template
from modules.calculator import calculator_bp
from modules.news import news_bp
from modules.calendar import calendar_bp
from modules.social import social_bp
from modules.referrals import referrals_bp
from modules.ai import ai_bp
from config import Config

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['NVIDIA_API_KEY'] = Config.NVIDIA_API_KEY
app.config['NVIDIA_MODEL'] = Config.NVIDIA_MODEL
app.config['NVIDIA_BASE_URL'] = Config.NVIDIA_BASE_URL

# Register Blueprints
app.register_blueprint(calculator_bp, url_prefix='/calculator')
app.register_blueprint(news_bp, url_prefix='/news')
app.register_blueprint(calendar_bp, url_prefix='/calendar')
app.register_blueprint(social_bp, url_prefix='/social')
app.register_blueprint(referrals_bp, url_prefix='/referral')
app.register_blueprint(ai_bp, url_prefix='/ai')

# Global template variables
@app.context_processor
def inject_global_vars():
    return {
        'GA_ID': Config.GA_ID,
        'FB_PIXEL_ID': Config.FB_PIXEL_ID,
        'DNA_REFERRAL_URL': Config.DNA_REFERRAL_URL
    }

# Main route
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/donations', strict_slashes=False)
def donations():
    return render_template('donations.html')

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'
    app.run(debug=debug_mode, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))