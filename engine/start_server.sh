#!/bin/bash

# TimePulse Engine Server Startup Script

echo "🚀 Starting TimePulse Engine Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
echo "📚 Installing dependencies..."
pip install fastapi uvicorn python-multipart python-dotenv

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f ".env.template" ]; then
        cp .env.template .env
        echo "✅ Created .env file from template. Please edit it with your credentials."
    else
        echo "❌ .env.template not found. Please create .env file manually."
    fi
fi

# Start the server
echo "🌟 Starting server on http://127.0.0.1:8000"
echo "📖 API Documentation: http://127.0.0.1:8000/docs"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

uvicorn simple_server:app --host 127.0.0.1 --port 8000 --reload
