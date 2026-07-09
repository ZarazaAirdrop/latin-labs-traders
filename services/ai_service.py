"""
AI Service via OpenRouter API (OpenAI-compatible)
Modelo por defecto: tencent/hy3:free (fallback gratuito)
Sustituye a NVIDIA NIM cuya key venció (HTTP 403).
"""
import requests
import json
import time
from threading import Lock

class MiniMaxM3:
    def __init__(self, api_key, model="tencent/hy3:free", base_url="https://openrouter.ai/api/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self._lock = Lock()
        self._last_request = 0
        self._min_interval = 0.5

    def _rate_limit(self):
        with self._lock:
            elapsed = time.time() - self._last_request
            if elapsed < self._min_interval:
                time.sleep(self._min_interval - elapsed)
            self._last_request = time.time()

    def chat(self, messages, max_tokens=1024, temperature=0.7, top_p=0.95):
        self._rate_limit()
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stream": False
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except requests.exceptions.Timeout:
            raise TimeoutError("La API de IA no respondió a tiempo. Verifica tu conexión a internet.")
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else 0
            if status == 401:
                raise PermissionError("API key inválida. Verifica tu OPENROUTER_API_KEY.")
            elif status == 429:
                raise Exception("Límite de requests excedido en OpenRouter. Espera 1 minuto e intenta de nuevo.")
            else:
                raise Exception(f"Error HTTP {status} en API de IA.")
        except requests.exceptions.ConnectionError:
            raise ConnectionError("No se pudo conectar a la API de IA. Verifica tu conexión a internet.")
        except Exception as e:
            raise Exception(f"Error inesperado en IA: {str(e)}")

    def _lang_instruction(self, lang, topic="finanzas"):
        domain_map = {
            "es": "finanzas",
            "pt": "finanças",
            "en": "finance"
        }
        domain = domain_map.get(lang, "finance")
        instructions = {
            "es": f"Eres un experto en {domain}. Responde SIEMPRE en español, con vocabulario claro y profesional.",
            "pt": f"Você é um especialista em {domain}. Responda SEMPRE em português, com vocabulário claro e profissional.",
            "en": f"You are a {domain} expert. Always respond in English with clear, professional vocabulary."
        }
        return instructions.get(lang, "Always respond in English with clear, professional vocabulary.")

    def analyze_news(self, title, content, source, lang="es"):
        lang_instr = self._lang_instruction(lang, "mercados financieros y trading")
        prompt = f"""{lang_instr}

Eres un analista senior de mercados financieros. Analiza este artículo y extrae información accionable para traders:

Título: {title}
Fuente: {source}
Contenido: {content[:2500]}

Devuelve EXACTAMENTE este JSON (sin markdown, sin etiquetas de código, sin campos adicionales):
{{
    "summary": "resumen ejecutivo en 2-3 oraciones destacando el impacto para traders",
    "sentiment": "bullish",
    "sentiment_label": "Alcista",
    "implications": ["implicación concreta para trading 1", "implicación concreta para trading 2"],
    "instruments": ["EURUSD", "XAUUSD"]
}}

Reglas:
- sentiment: EXACTAMENTE "bullish", "bearish" o "neutral"
- sentiment_label: traducción al idioma del análisis ("Alcista"/"Bajista"/"Neutral")
- Máximo 3 implications, cada una debe ser accionable para un trader
- Máximo 3 instruments, solo símbolos que existen en Forex, Indices, Commodities o Crypto
- Si el artículo no menciona instrumentos específicos, devuelve lista vacía []
"""
        try:
            result = self.chat([
                {"role": "system", "content": "Eres un analista financiero senior. Siempre devuelves JSON válido y preciso."},
                {"role": "user", "content": prompt}
            ], max_tokens=800, temperature=0.2)
            cleaned = result.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            parsed = json.loads(cleaned)
            return parsed
        except (json.JSONDecodeError, Exception) as e:
            return self._fallback_analysis(title, lang)

    def _fallback_analysis(self, title, lang):
        return {
            "summary": title,
            "sentiment": "neutral",
            "sentiment_label": "Neutral" if lang != "es" else "Neutral",
            "implications": ["Análisis no disponible temporalmente"],
            "instruments": []
        }

    def analyze_sentiment(self, text, handle, lang="es"):
        lang_instr = self._lang_instruction(lang, "sentimiento de mercado y trading social")
        prompt = f"""{lang_instr}

Eres un analista de sentimiento de redes sociales especializado en mercados financieros. Analiza este tweet de un trader/inversor conocido:

Autor: @{handle}
Tweet: {text[:600]}

Devuelve EXACTAMENTE este JSON (sin markdown):
{{
    "sentiment": "bullish",
    "sentiment_label": "Alcista",
    "confidence": "high",
    "explanation": "explicación breve en 1 oración sobre por qué este sentimiento"
}}

Reglas:
- sentiment: EXACTAMENTE "bullish" (alcista/optimista), "bearish" (bajista/pessimista) o "neutral"
- confidence: "high", "medium" o "low" basado en claridad del mensaje
- sentiment_label y explanation: en el idioma del análisis
- explanation: concreta, basada en el contenido real del tweet
"""
        try:
            result = self.chat([
                {"role": "system", "content": "Eres un analista de sentimiento experto. Siempre devuelves JSON válido."},
                {"role": "user", "content": prompt}
            ], max_tokens=400, temperature=0.2)
            cleaned = result.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, Exception):
            return {
                "sentiment": "neutral",
                "sentiment_label": "Neutral" if lang == "es" else "Neutral",
                "confidence": "low",
                "explanation": "No se pudo analizar el sentimiento."
            }

    def analyze_event(self, event, lang="es"):
        lang_instr = self._lang_instruction(lang, "calendario económico y trading")
        prompt = f"""{lang_instr}

Eres un educador de trading especializado en calendario económico. Tu misión es enseñar al trader a INTERPRETAR eventos económicos con enfoque en GESTIÓN DE RIESGO, no predecir direcciones.

Evento: {event['title']}
Moneda: {event['currency']}
Impacto: {event['impact']}
Hora: {event['time']}
Actual: {event.get('actual', '-')}
Forecast: {event.get('forecast', '-')}

Devuelve EXACTAMENTE este JSON (sin markdown, sin etiquetas de código):
{{{{
    "summary": "explicación educativa de QUÉ mide este indicador y por qué importa para traders (2-3 oraciones)",
    "risk_guidance": "recomendación concreta de gestión de riesgo: si el impacto es alto, sugiere esperar la publicación, reducir tamaño de posición o evitar operar durante la volatilidad. Siempre priorizar preservación de capital.",
    "market_context": "breve explicación de cómo este evento se relaciona con el contexto macroactual. Sin predicciones direccionales, solo análisis de escenarios posibles.",
    "tone": "educational"
}}}}

Reglas:
- NUNCA des predicciones direccionales ("va a subir", "va a bajar")
- Siempre prioriza gestión de riesgo y preservación de capital
- Si el impacto es HIGH, advierte sobre spreads amplios, slippage y falsos rompimientos
- Usa lenguaje educativo, no de señales
- summary y risk_guidance en el idioma del análisis
- tone siempre "educational" """
        try:
            result = self.chat([
                {"role": "system", "content": "Eres un educador financiero especializado en calendario económico. Siempre priorizas gestión de riesgo sobre predicciones. Devuelves JSON válido."},
                {"role": "user", "content": prompt}
            ], max_tokens=800, temperature=0.2)
            cleaned = result.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        except (json.JSONDecodeError, Exception):
            return {
                "summary": event['title'],
                "risk_guidance": "Mantén tu plan de trading. Espera la publicación del dato antes de tomar decisiones. Gestiona tu riesgo.",
                "market_context": "Analiza el contexto macroeconómico actual para interpretar este evento.",
                "tone": "educational"
            }

    def analyze_tweet_relevance(self, tweets, lang="es"):
        """Analyze a batch of tweets for financial relevance and market alignment."""
        tweets_text = "\n---\n".join([
            f"@{t['handle']}: {t['text'][:300]}"
            for t in tweets
        ])

        prompt = f"""Eres un analista financiero que evalúa tweets por su RELEVANCIA para traders y su COHERENCIA con tendencias actuales de mercado.

Para cada tweet, determina:
1. financial_relevance: QUÉ TAN RELEVANTE es para mercados financieros (high/medium/low)
2. relevance_reason: por qué es relevante (o no)
3. topical_alignment: QUÉ TAN ALINEADO está con tendencias macro/mercado actuales (high/medium/low)

Tweets a analizar:
{tweets_text[:3000]}

Devuelve EXACTAMENTE este JSON (sin markdown):
{{{{
    "tweets": [
        {{
            "index": 0,
            "financial_relevance": "high",
            "relevance_reason": "explica por qué este tweet importa a un trader",
            "topical_alignment": "high"
        }},
        ... (misma estructura para cada tweet, en el mismo orden)
    ]
}}}}

Reglas:
- financial_revalence: "high" si habla de economía, mercados, trading, regulación, empresas públicas, crypto, divisas, commodities, política económica. "medium" si es tangencial. "low" si es personal/irrelevante
- topical_alignment: "high" si el tweet es coherente con tendencias actuales del mercado (ej: si la inflación es tendencia y el tweet habla de inflación). "medium" si es parcial. "low" si no tiene relación
- relevance_reason: concisa, en el idioma del análisis (2-3 oraciones máximo)
- Sé estricto: si un tweet no aporta valor a un trader, márcalo low
- IMPORTANTE: Devuelve SOLO el JSON, sin explicaciones adicionales"""
        try:
            result = self.chat([
                {"role": "system", "content": "Eres un analista financiero que evalúa tweets. Siempre devuelves JSON válido."},
                {"role": "user", "content": prompt}
            ], max_tokens=1200, temperature=0.2)
            cleaned = result.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            parsed = json.loads(cleaned)
            return parsed.get('tweets', [])
        except (json.JSONDecodeError, Exception) as e:
            return [{"index": i, "financial_relevance": "medium", "relevance_reason": "Análisis no disponible", "topical_alignment": "medium"} for i in range(len(tweets))]

    def trading_chat(self, messages, lang="es"):
        lang_instr = self._lang_instruction(lang, "trading y gestión de riesgo")
        system_prompt = f"""{lang_instr}

Eres el asistente educativo de Latin Labs Traders. Tu misión es ENSEÑAR a pensar como una prop firm, NO dar señales ni predicciones.

CONTEXTO:
- Latin Labs Traders es un canal educativo: "El canal que enseña a pensar como una prop firm"
- Sin señales, sin predicciones, sin gurús — solo educación en gestión de riesgo
- Los challenges disponibles son: 1 Phase (target 10%, max loss 6%), 2 Phase (Fase1: 8%, Fase2: 5%, max loss 8%), Rapid (target 5%, max loss 5%), Instant Funding (max loss 4% trailing)
- 44 instrumentos disponibles: Forex (26 pares), Indices (8), Commodities (5), Crypto (5)
- Conceptos clave: position sizing, risk/reward, drawdown, max daily loss, profit target, payout splits

CAPACIDADES:
- Explicar conceptos de gestión de riesgo con ejemplos numéricos concretos
- Ayudar con reglas de challenges de prop firms y cómo cumplirlas con disciplina
- Explicar cómo calcular posición, SL, TP, RR y su impacto en el drawdown
- Responder sobre psicología de trading, gestión emocional y consistencia
- ENSEÑAR, no predecir. Cuando te pidan predicciones ("¿XAUUSD va a subir?"), responde educativamente explicando análisis de contexto, no con predicciones direccionales

LIMITACIONES (debes mencionarlas cuando sea relevante):
- NO eres un asesor financiero certificado
- NO das señales de compra/venta
- NO garantizas resultados
- Este es un modelo de IA en fase de prueba/evaluación vía OpenRouter (tencent/hy3:free)
- El usuario debe verificar siempre la información antes de operar

Personalidad: Educador profesional, directo, preciso. Usa storytelling y ejemplos numéricos. Cuando te pidan predicciones, redirige a análisis educativo. Sé conciso pero completo."""
        try:
            full_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages:
                full_messages.append(msg)
            return self.chat(full_messages, max_tokens=2048, temperature=0.7)
        except Exception as e:
            return f"Lo siento, ocurrió un error: {str(e)}"

    def translate(self, text, target_lang="es", context="general"):
        lang_names = {"es": "español", "pt": "portugués", "en": "inglés"}
        target_name = lang_names.get(target_lang, "español")

        prompt = f"Traduce SOLAMENTE el siguiente texto a {target_name}. Conserva números, símbolos ($ %), tickers (EURUSD, BTC) y nombres propios. Devuelve ÚNICAMENTE el texto traducido:\n\n{text[:1500]}"
        try:
            result = self.chat([
                {"role": "system", "content": f"Eres un traductor financiero. Respondes ÚNICAMENTE en {target_name}. No añades explicaciones ni comentarios."},
                {"role": "user", "content": prompt}
            ], max_tokens=1024, temperature=0.1)
            if result and len(result) > 10:
                return result.strip()
            return text
        except Exception as e:
            return text
