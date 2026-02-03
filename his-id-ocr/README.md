---
title: HIS ID OCR
emoji: 🪪
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# HIS ID OCR Service

AI-powered Government ID scanning microservice for Hospital Information System.

## Features

- Extract patient details from Aadhaar/Government ID cards
- Mask Aadhaar numbers in text (XXXX XXXX 1234)
- Mask Aadhaar regions in stored images (blur/black)
- Privacy-first design - raw Aadhaar never stored or returned

## API Endpoints

### POST /extract-id
Upload an ID card image for extraction.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "success": true,
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "maskedAadhaar": "XXXX XXXX 1234",
  "confidence": "high"
}
```

### GET /health
Health check endpoint.

## Tech Stack

- Python / FastAPI
- Tesseract OCR
- Google Gemini AI
