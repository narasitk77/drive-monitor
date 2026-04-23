FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app.py .
COPY templates/ templates/
COPY changelog.json .

# Persistent data volume (token.json, change_tokens.json, credentials.json)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 5001

ENV PYTHONUNBUFFERED=1 \
    DATA_DIR=/app/data

# Production: gunicorn with 1 worker (Drive API sessions are in-process)
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "1", "--timeout", "120", "--access-logfile", "-", "app:app"]
