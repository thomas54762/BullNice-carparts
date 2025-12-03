#!/bin/bash
set -e

echo "🛑 Stopping all containers..."
docker compose -f docker-compose.prod.yml down

echo "🗑️  Removing old images..."
docker rmi bullnice-carparts-frontend bullnice-carparts-backend 2>/dev/null || true

echo "🗑️  Removing frontend_build volume..."
docker volume rm bullnice-carparts_frontend_build 2>/dev/null || true

echo "🔨 Building containers from scratch..."
docker compose -f docker-compose.prod.yml --env-file .env build --no-cache

echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "🔄 Running migrations..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

echo "📁 Collecting static files..."
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📊 Checking containers..."
docker compose -f docker-compose.prod.yml ps
echo ""
echo "🔍 Checking frontend files..."
docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/html | head -20
echo ""
echo "🌐 Testing site..."
curl -I http://localhost 2>/dev/null | head -5

