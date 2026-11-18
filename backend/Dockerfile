
FROM python:3.13-slim

WORKDIR /app

# Install Tesseract OCR
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Verify installation during image build
RUN which tesseract && tesseract --version

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Explicitly configure Tesseract
ENV TESSERACT_CMD=/usr/bin/tesseract

EXPOSE 10000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
