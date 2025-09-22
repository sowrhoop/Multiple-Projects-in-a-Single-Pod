FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for isolation
RUN useradd -m -u 10001 -s /usr/sbin/nologin appuser

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

# Ensure ownership for runtime user
RUN chown -R appuser:appuser /app

ENV PORT=8000
EXPOSE 8000

USER appuser

# Respect PORT env with a sensible default
CMD ["/bin/sh", "-lc", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
