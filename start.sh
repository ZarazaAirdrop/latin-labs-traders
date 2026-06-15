#!/bin/bash
# Latin Labs Traders - Quick Start Script for macOS/Linux

echo "========================================"
echo "Latin Labs Traders - Setup & Run"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+"
    exit 1
fi

echo "[1/4] Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "Error: Failed to create virtual environment"
    exit 1
fi

echo "[2/4] Activating virtual environment..."
source venv/bin/activate

echo "[3/4] Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo "[4/4] Starting application..."
echo
echo "Application will be available at: http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo

python app.py