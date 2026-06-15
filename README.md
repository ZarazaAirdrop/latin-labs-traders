# Latin Labs Traders - Portal de Trading Profesional

Portal integral de trading con calculadora de riesgo, noticias financieras en tiempo real, calendario económico y análisis de mercados.

## 🚀 Características

- **Calculadora de Riesgo v1.0** - 44 instrumentos (Forex, Indices, Commodities, Crypto)
- **News Agent** - RSS aggregator de Bloomberg, Reuters, Investing.com
- **Calendar Agent** - Eventos económicos de ForexFactory (sesión NY prioritaria)
- **Social Agent** - Tweets de traders influyentes vía Nitter RSS
- **Multi-idioma** - Español, English, Português
- **Referral System** - Integración con DNA Funded

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: None (stateless)
- **Deployment**: Vercel
- **External APIs**: Nitter RSS, ForexFactory scraping

## 📁 Estructura del Proyecto

```
app/
├── app.py                      # Flask application factory
├── config.py                   # Configuration settings
├── requirements.txt            # Python dependencies
├── vercel.json                 # Vercel deployment config
│
├── data/
│   ├── instruments.py          # 44 financial instruments
│   ├── challenges.py           # Challenge definitions
│   └── news_sources.py         # RSS feed URLs
│
├── modules/
│   ├── calculator/             # Risk Calculator module
│   ├── news/                   # News Agent module
│   ├── calendar/               # Calendar Agent module
│   ├── social/                 # Social Agent module
│   └── referrals/              # DNA Funded referral module
│
├── templates/
│   ├── base.html               # Base template
│   ├── index.html              # Landing page
│   └── partials/               # Reusable components
│
└── static/
    ├── css/                    # Stylesheets
    ├── js/                     # JavaScript files
    └── images/                 # Images and assets
```

## 🚦 Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "latin labs traders web/app"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Access the application**
   - Open browser: `http://localhost:5000`

### Production Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Import repository in Vercel dashboard
   - Deploy automatically on push

## 🔧 Configuration

### Environment Variables

Create a `.env` file (optional) or set environment variables:

```bash
SECRET_KEY=your-secret-key-here
DNA_REFERRAL_URL=https://partners.dnafunded.com/click?campaign_id=1&ref_id=553
GA_ID=G-XXXXXXXXXX
FB_PIXEL_ID=123456789012345
```

### DNA Funded Referral

El link de referido está configurado en `config.py`:

```python
DNA_REFERRAL_URL = "https://partners.dnafunded.com/click?campaign_id=1&ref_id=553"
```

### Tracking

Google Analytics y Facebook Pixel están listos para ser configurados:

1. **Google Analytics**: Obtén tu ID en [analytics.google.com](https://analytics.google.com)
2. **Facebook Pixel**: Obtén tu Pixel ID en [facebook.com/events_manager](https://www.facebook.com/events_manager)

Luego actualiza `config.py`:

```python
GA_ID = "G-XXXXXXXXXX"
FB_PIXEL_ID = "123456789012345"
```

## 📊 Modules

### 1. Risk Calculator

- 44 instrumentos financieros
- Cálculo de tamaño de posición
- Gestión de riesgo por operación
- Overlay de resultados con animaciones
- Multi-idioma (ES/EN/PT)

### 2. News Agent

- RSS feeds de Bloomberg, Reuters, Investing.com
- Filtrado por categoría
- Auto-refresh
- Responsive grid layout

### 3. Calendar Agent

- Scraping de ForexFactory
- Priorización de sesión NY
- Filtrado por impacto (alto/medio/bajo)
- Tabla responsive

### 4. Social Agent

- RSS feeds de Nitter (sin API key requerida)
- Lista de usuarios editable en `modules/social/config.py`
- Filtrado por usuario
- Timeline de tweets

### 5. Referrals

- Landing page DNA Funded
- Beneficios y FAQ
- CTA buttons con tracking
- Responsive design

## 🎨 Customization

### Adding New Traders to Social Agent

Edit `modules/social/config.py`:

```python
TWITTER_USERNAMES = [
    "PapaCandle",
    "AxiaForex",
    "FTMO_Forex",
    "TraderTommo",
    "DayTrading",
    "YourUsername"  # Add new username here
]
```

### Adding New News Sources

Edit `data/news_sources.py`:

```python
NEWS_SOURCES = {
    "bloomberg": { ... },
    "reuters": { ... },
    "investing": { ... },
    "yoursource": {  # Add new source
        "name": "Your Source",
        "url": "https://example.com/rss",
        "category": "general"
    }
}
```

### Adding New Instruments

Edit `data/instruments.py` y agrega el instrumento al grupo correspondiente:

```python
INSTRUMENT_GROUPS = {
    "Forex": [
        # ... existing instruments
        {"symbol": "NEWUSD", "name": "New Instrument", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"}
    ]
}
```

## 📱 Responsive Design

El portal es completamente responsive:
- Desktop: Layout completo con grid
- Tablet: Ajuste automático de columnas
- Mobile: Single column, menú hamburguesa

## 🔐 Security

- No almacenamiento de datos sensibles
- API keys configuradas en entorno
- CORS configurado para Vercel
- HTTPS obligatorio en producción

## 🤝 Contributing

1. Fork el repository
2. Crea una branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a the branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 License

MIT License - libre uso, modificación y distribución

## 🙏 Acknowledgments

- **OpenCode** - AI coding agent used to build this project
- **Flask** - Web framework
- **Nitter** - RSS feeds for X/Twitter
- **ForexFactory** - Economic calendar data
- **DNA Funded** - Partner referral program

## 📞 Support

Para soporte o preguntas:
- GitHub Issues: [repository-url]/issues
- Email: support@latinalabstraders.com

---

**Latin Labs Traders** © 2026 - Powered by OpenCode