---
title: HIS ML Services
emoji: 🧠
colorFrom: yellow
colorTo: red
sdk: docker
pinned: false
---

# HIS ML Services

Combined Machine Learning services for Hospital Information System

## Services

### Predictive Analytics (`/predict/*`)
- OPD Rush Hour Predictions
- Bed Occupancy Forecasting
- Lab Workload Predictions

### Revenue Leakage Detection (`/revenue/*`)
- Anomaly Detection
- Billing Pattern Analysis
- Revenue Recovery Alerts

## Endpoints

- `/` - Service Info
- `/health` - Health Check
- `/docs` - API Documentation
- `/predict/opd` - OPD Predictions
- `/predict/beds` - Bed Occupancy
- `/predict/lab` - Lab Workload
- `/revenue/detect` - Run Detection
- `/revenue/anomalies` - Get Anomalies
- `/revenue/dashboard` - Dashboard Stats

## Tech Stack

- Python / FastAPI
- Prophet (Time Series)
- Scikit-learn
- MongoDB
