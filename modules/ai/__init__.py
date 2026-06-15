"""
AI Trading Assistant Blueprint with MiniMax-M3
"""
from flask import Blueprint, render_template, jsonify, request, current_app
from services.ai_service import MiniMaxM3
import json

ai_bp = Blueprint('ai', __name__,
    static_folder='static',
    template_folder='../../templates')

def get_ai():
    return MiniMaxM3(
        api_key=current_app.config['NVIDIA_API_KEY'],
        model=current_app.config['NVIDIA_MODEL'],
        base_url=current_app.config['NVIDIA_BASE_URL']
    )

@ai_bp.route('/')
def index():
    return render_template('ai/index.html')

@ai_bp.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    messages = data.get('messages', [])
    lang = data.get('lang', 'es')

    try:
        ai = get_ai()
        response = ai.trading_chat(messages, lang=lang)
        return jsonify({'success': True, 'response': response})
    except PermissionError as e:
        return jsonify({'success': False, 'message': str(e)}), 401
    except TimeoutError as e:
        return jsonify({'success': False, 'message': str(e)}), 504
    except ConnectionError as e:
        return jsonify({'success': False, 'message': str(e)}), 502
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@ai_bp.route('/api/translate', methods=['POST'])
def translate():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    text = data.get('text', '')
    lang = data.get('lang', 'es')
    context = data.get('context', 'general')

    if not text:
        return jsonify({'success': False, 'message': 'No text provided'}), 400

    try:
        ai = get_ai()
        translated = ai.translate(text, target_lang=lang, context=context)
        return jsonify({'success': True, 'translated': translated})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
