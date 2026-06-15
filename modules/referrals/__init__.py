"""
Referrals Blueprint
"""
from flask import Blueprint, render_template
from config import Config

referrals_bp = Blueprint('referrals', __name__,
    static_folder='static')

@referrals_bp.route('/')
def index():
    return render_template('referrals/index.html', DNA_REFERRAL_URL=Config.DNA_REFERRAL_URL)
