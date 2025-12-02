# BullNice Car Parts

A modern car parts e-commerce platform built with Django REST Framework and React.

## Project Structure

```
BullNice-carparts/
├── backend/          # Django REST API
├── frontend/         # React + Vite + TypeScript
├── nginx/            # Nginx configuration for production
├── docker-compose.yml
└── DOCKER.md         # Detailed Docker documentation
```

## Tech Stack

### Backend
- Python 3.11
- Django 5.2.8
- Django REST Framework
- PostgreSQL
- JWT Authentication

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- Axios

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd BullNice-carparts
```

2. Start the application:
```bash
make build
make up
```

3. Run migrations:
```bash
make migrate
```

4. Create a superuser (optional):
```bash
make createsuperuser
```

5. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Database: localhost:5433 (mapped to avoid conflict with local PostgreSQL)
- Admin Panel: http://localhost:8000/admin

For detailed Docker documentation, see [DOCKER.md](DOCKER.md)

### Local Development (Without Docker)

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export USE_SQLITE=true  # Use SQLite instead of PostgreSQL
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Development

- Backend runs on port 8000 with hot reload
- Frontend runs on port 5173 with Vite HMR
- All changes are reflected immediately

## Available Commands

See `make help` for all available commands or check [DOCKER.md](DOCKER.md) for detailed usage.

## API Documentation

When the backend is running, visit:
- Swagger UI: http://localhost:8000/api/schema/swagger-ui/
- ReDoc: http://localhost:8000/api/schema/redoc/

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Add your license here]

