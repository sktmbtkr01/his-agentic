# HIS Agentic Backend - Dockerfile for Hugging Face Spaces
FROM node:18-alpine

# Install system dependencies for OCR (GraphicsMagick, Ghostscript)
RUN apk add --no-cache graphicsmagick ghostscript

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create uploads directory for file storage
RUN mkdir -p uploads/lab-reports uploads/radiology uploads/documents

# Expose HF Spaces default port
EXPOSE 7860

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:7860/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the server
CMD ["node", "server.js"]
