#!/bin/bash

echo "🔍 Checking Docker setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
echo "✅ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi
echo "✅ Docker Compose is installed"

# Check if containers are running
echo ""
echo "📦 Checking containers..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running:"
    docker-compose ps
else
    echo "⚠️  Containers are not running. Start them with: make up"
fi

# Check if backend is responding
echo ""
echo "🔌 Checking backend..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ Backend is responding on port 8000"
else
    echo "⚠️  Backend is not responding on port 8000"
fi

# Check if frontend is responding
echo ""
echo "🎨 Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is responding on port 5173"
else
    echo "⚠️  Frontend is not responding on port 5173"
fi

# Check if database is responding
echo ""
echo "🗄️  Checking database..."
if docker-compose exec -T db pg_isready > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is not ready"
fi

echo ""
echo "✨ Health check complete!"

