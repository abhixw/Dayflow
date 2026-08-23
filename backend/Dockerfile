FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Production default: migrate, then serve (no --reload). Local dev overrides
# this whole command in docker-compose.yml to add --reload on a fixed port.
# $PORT is set by Render (and most PaaS hosts); falls back to 8000 elsewhere.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
