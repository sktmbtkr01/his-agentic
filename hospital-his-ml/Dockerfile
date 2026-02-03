# HIS ML Services - Docker Configuration for Hugging Face Spaces (FastAPI Version)
# Combines Predictive Analytics and Revenue Leakage services

FROM python:3.10-slim-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies for Prophet and scientific computing
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all source code
COPY . .

# Create models directories if they don't exist
RUN mkdir -p /app/predictive_analytics/models && \
    mkdir -p /app/revenue_leakage/models

# Set environment variables
ENV PORT=7860
ENV HOST=0.0.0.0
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose HF Spaces port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Start the combined service with uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "2"]
