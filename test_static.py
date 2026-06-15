"""
Test Static Files - Minimal Flask App
"""
from flask import Flask
from modules.calculator import calculator_bp
from modules.news import news_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'test-key'

# Register blueprints
app.register_blueprint(calculator_bp, url_prefix='/calculator')
app.register_blueprint(news_bp, url_prefix='/news')

@app.route('/test')
def test():
    return "Flask is running!"

if __name__ == '__main__':
    print("Starting test server...")
    print("Test routes:")
    print("  - http://localhost:5001/test")
    print("  - http://localhost:5001/calculator/static/css/calculator.css")
    print("  - http://localhost:5001/news/static/css/news.css")
    app.run(debug=False, host='0.0.0.0', port=5001)