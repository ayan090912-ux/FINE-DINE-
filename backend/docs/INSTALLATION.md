# DineFlow SaaS Backend Installation & Deployment Guide

## Prerequisites

- **Python 3.10+**
- **Docker & Docker Compose**
- **PostgreSQL 16+** (Optional if using Docker)
- **Redis 7+** (Optional if using Docker)

---

## Quickstart with Docker Compose (Recommended)

1. Clone repository & copy environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Spin up FastAPI backend, PostgreSQL database, Redis, and Adminer:
   ```bash
   docker-compose up -d --build
   ```

3. Check logs:
   ```bash
   docker-compose logs -f backend
   ```

4. Access Services:
   - **FastAPI API**: `http://localhost:8000`
   - **Swagger Docs**: `http://localhost:8000/docs`
   - **Adminer DB UI**: `http://localhost:8080`

---

## Local Development (Without Docker)

1. Create Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Apply database migrations:
   ```bash
   alembic upgrade head
   ```

4. Run development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## Running Test Suite

Run unit and integration tests with pytest:
```bash
pytest
```
