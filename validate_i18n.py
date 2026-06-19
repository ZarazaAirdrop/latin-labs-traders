"""
Validación automatizada de traducciones en portugués y profit split.
Genera un reporte con screenshots de la UI en PT.
"""

from playwright.sync_api import sync_playwright
from datetime import datetime
import os

# Configuración
URL = "https://latin-labs-traders.onrender.com/calculator"
OUTPUT_DIR = "validation_screenshots"
TEST_DATA = {
    "accountBalance": "10000",
    "riskPercent": "1",
    "entryPrice": "1.1000",
    "stopPrice": "1.0950",
    "takePrice": "1.1050",
    "instrument": "EUR/USD",
    "challenge": "2 Phase",
    "fase": "1"
}

def setup_output_dir():
    """Crea el directorio para guardar screenshots."""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

def run_validation():
    """Ejecuta la validación automatizada."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible para depuración
        page = browser.new_page()
        
        # Navegar al sitio y cambiar idioma a PT
        page.goto(URL)
        page.click("button[data-lang='pt']")
        page.wait_for_timeout(2000)  # Esperar recarga
        
        # Capturar screenshot de la UI inicial
        page.screenshot(path=f"{OUTPUT_DIR}/01-ui-pt-inicial.png")
        
        # Llenar formulario
        page.fill("#accountBalance", TEST_DATA["accountBalance"])
        page.fill("#riskPercent", TEST_DATA["riskPercent"])
        
        # Selectores específicos (ajustar según la UI real)
        page.select_option("#instrument", TEST_DATA["instrument"])
        page.select_option("#challenge", TEST_DATA["challenge"])
        page.select_option("#fase", TEST_DATA["fase"])
        
        page.fill("#entryPrice", TEST_DATA["entryPrice"])
        page.fill("#stopPrice", TEST_DATA["stopPrice"])
        page.fill("#takePrice", TEST_DATA["takePrice"])
        
        # Enviar formulario
        page.click("button[type='submit']")
        page.wait_for_timeout(3000)  # Esperar resultados
        
        # Capturar screenshots de resultados
        page.screenshot(path=f"{OUTPUT_DIR}/02-resultados-pt.png")
        
        # Validar textos específicos
        errores = []
        textos_esperados = {
            "% disponível": "% disponível",
            "Fase 1": "Fase 1",
            "Parar Perda": "Stop Loss"
        }
        
        for clave, texto_esperado in textos_esperados.items():
            elementos = page.locator(f"text={clave}").all()
            if not elementos:
                errores.append(f"Texto faltante: '{clave}' (esperado: '{texto_esperado}')")
        
        # Validar profit split (90%)
        profit_text = page.locator(".detail-value:has-text('Profit')").inner_text()
        profit_value = float(profit_text.replace("$", "").replace(",", ""))
        expected_profit = float(TEST_DATA["accountBalance"]) * 0.9
        if abs(profit_value - expected_profit) > 1:
            errores.append(f"Profit split incorrecto: {profit_text} (esperado: ~${expected_profit})")
        
        # Generar reporte
        with open(f"{OUTPUT_DIR}/reporte.txt", "w", encoding="utf-8") as f:
            f.write(f"Reporte de Validación - {datetime.now()}\n")
            f.write(f"URL: {URL}\n")
            f.write(f"Idioma: Portugués (PT)\n\n")
            f.write("=== ERRORES ===\n")
            if errores:
                for error in errores:
                    f.write(f"- {error}\n")
            else:
                f.write("✅ No se encontraron errores.\n")
            f.write("\n=== SCREENSHOTS ===\n")
            f.write(f"- UI inicial: {OUTPUT_DIR}/01-ui-pt-inicial.png\n")
            f.write(f"- Resultados: {OUTPUT_DIR}/02-resultados-pt.png\n")
        
        browser.close()
        return errores

if __name__ == "__main__":
    setup_output_dir()
    errores = run_validation()
    if errores:
        print("❌ Errores encontrados:")
        for error in errores:
            print(f"- {error}")
    else:
        print("✅ Validación exitosa. Todos los textos en portugués y profit split = 90%.")