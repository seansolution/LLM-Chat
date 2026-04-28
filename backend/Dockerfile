# syntax=docker/dockerfile:1
# Target: linux/arm64 (Apple Silicon M1/M2/M3/M4)
FROM python:3.11-slim-bookworm

WORKDIR /app

# Build deps:
#   - build-essential, cargo: needed by cryptography (Rust) and tiktoken
#   - libffi-dev, libssl-dev: needed by cryptography
#   - curl: healthcheck / readiness probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libffi-dev \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust via rustup (arm64-compatible, needed by cryptography/tiktoken)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"

# Upgrade pip + install wheel first so binary wheels are preferred
RUN pip install --no-cache-dir --upgrade pip wheel setuptools

COPY requirements.txt .

# Install with --prefer-binary to use pre-built arm64 wheels where available
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
