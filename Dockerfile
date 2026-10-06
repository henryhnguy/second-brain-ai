# Stage 1: Build React/Vite Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Application Runner
FROM python:3.12-slim
WORKDIR /app

# Environment configuration
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOST=0.0.0.0

# Install minimal OS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code and runner
COPY backend/ ./backend/
COPY run.py ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Setup non-root user (UID 1000 is required by Hugging Face Spaces)
RUN useradd -m -u 1000 user && \
    mkdir -p /app/backend/data/uploads && \
    chown -R user:user /app && \
    chmod -R 777 /app/backend/data

USER user

# Expose port (7860 for Hugging Face Spaces, overridable by PORT env var)
EXPOSE 7860

CMD ["python", "run.py"]
