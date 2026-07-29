# DineFlow

DineFlow is a modern Restaurant Operating System that streamlines restaurant operations through a single platform.

## Features

- Customer QR Ordering
- Owner Dashboard
- Kitchen Dashboard
- Waiter Dashboard
- Live Order Tracking
- Table Management
- QR Code Management
- Menu Management
- Analytics
- Discounts & Promotions
- Customer Feedback
- Role-Based Authentication

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic

## Installation

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Backend:

```env
DATABASE_URL=...
SECRET_KEY=...
```

Frontend:

```env
VITE_API_URL=http://localhost:8000
```

## Development

Backend

```
http://localhost:8000
```

Frontend

```
http://localhost:5173
```

API Documentation

```
http://localhost:8000/docs
```

## License

MIT License