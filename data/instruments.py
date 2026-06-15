"""
Instruments data for Risk Calculator
44 instruments across 4 groups: Forex, Indices, Commodities, Crypto
"""

INSTRUMENT_GROUPS = {
    "Forex": [
        {"symbol": "EURUSD", "name": "Euro / US Dollar", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"},
        {"symbol": "GBPUSD", "name": "British Pound / US Dollar", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"},
        {"symbol": "USDJPY", "name": "US Dollar / Japanese Yen", "pip_size": 0.01, "valor_pip": 10, "group": "Major"},
        {"symbol": "USDCHF", "name": "US Dollar / Swiss Franc", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"},
        {"symbol": "AUDUSD", "name": "Australian Dollar / US Dollar", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"},
        {"symbol": "USDCAD", "name": "US Dollar / Canadian Dollar", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"},
        {"symbol": "NZDUSD", "name": "New Zealand Dollar / US Dollar", "pip_size": 0.0001, "valor_pip": 10, "group": "Major"},
        {"symbol": "EURGBP", "name": "Euro / British Pound", "pip_size": 0.0001, "valor_pip": 8, "group": "Cross"},
        {"symbol": "EURJPY", "name": "Euro / Japanese Yen", "pip_size": 0.01, "valor_pip": 8, "group": "Cross"},
        {"symbol": "GBPJPY", "name": "British Pound / Japanese Yen", "pip_size": 0.01, "valor_pip": 12, "group": "Cross"},
        {"symbol": "EURAUD", "name": "Euro / Australian Dollar", "pip_size": 0.0001, "valor_pip": 7, "group": "Cross"},
        {"symbol": "EURCAD", "name": "Euro / Canadian Dollar", "pip_size": 0.0001, "valor_pip": 8, "group": "Cross"},
        {"symbol": "EURCHF", "name": "Euro / Swiss Franc", "pip_size": 0.0001, "valor_pip": 8, "group": "Cross"},
        {"symbol": "EURNZD", "name": "Euro / New Zealand Dollar", "pip_size": 0.0001, "valor_pip": 7, "group": "Cross"},
        {"symbol": "GBPAUD", "name": "British Pound / Australian Dollar", "pip_size": 0.0001, "valor_pip": 9, "group": "Cross"},
        {"symbol": "GBPCAD", "name": "British Pound / Canadian Dollar", "pip_size": 0.0001, "valor_pip": 9, "group": "Cross"},
        {"symbol": "GBPCHF", "name": "British Pound / Swiss Franc", "pip_size": 0.0001, "valor_pip": 9, "group": "Cross"},
        {"symbol": "GBPNZD", "name": "British Pound / New Zealand Dollar", "pip_size": 0.0001, "valor_pip": 8, "group": "Cross"},
        {"symbol": "AUDJPY", "name": "Australian Dollar / Japanese Yen", "pip_size": 0.01, "valor_pip": 6, "group": "Cross"},
        {"symbol": "AUDCAD", "name": "Australian Dollar / Canadian Dollar", "pip_size": 0.0001, "valor_pip": 6, "group": "Cross"},
        {"symbol": "AUDCHF", "name": "Australian Dollar / Swiss Franc", "pip_size": 0.0001, "valor_pip": 6, "group": "Cross"},
        {"symbol": "AUDNZD", "name": "Australian Dollar / New Zealand Dollar", "pip_size": 0.0001, "valor_pip": 6, "group": "Cross"},
        {"symbol": "CADJPY", "name": "Canadian Dollar / Japanese Yen", "pip_size": 0.01, "valor_pip": 7, "group": "Cross"},
        {"symbol": "CHFJPY", "name": "Swiss Franc / Japanese Yen", "pip_size": 0.01, "valor_pip": 8, "group": "Cross"},
        {"symbol": "NZDJPY", "name": "New Zealand Dollar / Japanese Yen", "pip_size": 0.01, "valor_pip": 6, "group": "Cross"},
    ],
    "Indices": [
        {"symbol": "US30", "name": "Dow Jones Industrial Average", "pip_size": 1, "valor_pip": 0.5, "group": "US"},
        {"symbol": "US500", "name": "S&P 500", "pip_size": 0.1, "valor_pip": 1, "group": "US"},
        {"symbol": "US100", "name": "NASDAQ 100", "pip_size": 0.1, "valor_pip": 0.2, "group": "US"},
        {"symbol": "DE40", "name": "DAX 40", "pip_size": 0.1, "valor_pip": 1, "group": "Europe"},
        {"symbol": "UK100", "name": "FTSE 100", "pip_size": 0.1, "valor_pip": 0.1, "group": "Europe"},
        {"symbol": "FR40", "name": "CAC 40", "pip_size": 0.1, "valor_pip": 1, "group": "Europe"},
        {"symbol": "JP225", "name": "Nikkei 225", "pip_size": 1, "valor_pip": 0.5, "group": "Asia"},
        {"symbol": "AU200", "name": "ASX 200", "pip_size": 1, "valor_pip": 0.07, "group": "Asia"},
    ],
    "Commodities": [
        {"symbol": "XAUUSD", "name": "Gold / US Dollar", "pip_size": 0.01, "valor_pip": 1, "group": "Precious"},
        {"symbol": "XAGUSD", "name": "Silver / US Dollar", "pip_size": 0.01, "valor_pip": 0.5, "group": "Precious"},
        {"symbol": "XTIUSD", "name": "Crude Oil (WTI)", "pip_size": 0.01, "valor_pip": 1, "group": "Energy"},
        {"symbol": "XTOUSD", "name": "Brent Crude Oil", "pip_size": 0.01, "valor_pip": 1, "group": "Energy"},
        {"symbol": "XNGUSD", "name": "Natural Gas", "pip_size": 0.001, "valor_pip": 0.1, "group": "Energy"},
    ],
    "Crypto": [
        {"symbol": "BTCUSD", "name": "Bitcoin", "pip_size": 0.01, "valor_pip": 1, "group": "Major"},
        {"symbol": "ETHUSD", "name": "Ethereum", "pip_size": 0.01, "valor_pip": 1, "group": "Major"},
        {"symbol": "SOLUSD", "name": "Solana", "pip_size": 0.001, "valor_pip": 0.1, "group": "Altcoin"},
        {"symbol": "XRPUSD", "name": "Ripple", "pip_size": 0.0001, "valor_pip": 0.01, "group": "Altcoin"},
        {"symbol": "ADAUSD", "name": "Cardano", "pip_size": 0.0001, "valor_pip": 0.01, "group": "Altcoin"},
    ]
}

def get_instrument_groups():
    """Returns instrument groups for select dropdown"""
    return INSTRUMENT_GROUPS

def get_instrument(symbol):
    """Get instrument details by symbol"""
    for group, instruments in INSTRUMENT_GROUPS.items():
        for inst in instruments:
            if inst["symbol"] == symbol:
                return inst
    return None