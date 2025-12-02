.PHONY: help build up down restart logs shell-backend shell-frontend migrate makemigrations createsuperuser test clean

help:
	@echo "Available commands:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make shell-backend  - Open Django shell"
	@echo "  make shell-frontend - Open shell in frontend container"
	@echo "  make migrate        - Run Django migrations"
	@echo "  make makemigrations - Create new Django migrations"
	@echo "  make createsuperuser - Create Django superuser"
	@echo "  make test           - Run tests"
	@echo "  make clean          - Remove containers and volumes"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend python manage.py shell

shell-frontend:
	docker compose exec frontend sh

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

createsuperuser:
	docker compose exec backend python manage.py createsuperuser

test:
	docker compose exec backend python manage.py test

clean:
	docker compose down -v
	docker system prune -f

