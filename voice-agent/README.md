---
title: HIS Voice Agent
emoji: 🎙️
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# Voice Agent Module

AI Voice Receptionist for Hospital Information System

## Overview

This module provides an AI-powered voice receptionist that integrates with the existing HIS backend.
It consumes the existing REST APIs as a new client, equivalent to the Web UI or Mobile App.

## Endpoints

- `POST /voice/call` - Handle incoming voice call
- `POST /voice/transcribe` - Speech-to-text
- `POST /voice/synthesize` - Text-to-speech
- `POST /conversation/process` - Process user utterance
- `GET /health` - Health check

## Tech Stack

- Python / FastAPI
- Google Cloud Speech-to-Text
- Google Cloud Text-to-Speech
- Google Gemini AI
