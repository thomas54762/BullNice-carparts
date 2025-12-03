#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building containers...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env build

echo -e "${YELLOW}🛑 Stopping old containers...${NC}"
docker compose -f docker-compose.prod.yml down

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env up -d

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

echo -e "${YELLOW}🔄 Running migrations...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput

echo -e "${YELLOW}📁 Collecting static files...${NC}"
docker compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Container status:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 Your site should be available at:"
echo "   https://demo.bullnice.tech"
echo "   https://demo.bullnice.tech/admin"
echo ""
echo "📝 View logs with:"
echo "   docker compose -f docker-compose.prod.yml logs -f"

