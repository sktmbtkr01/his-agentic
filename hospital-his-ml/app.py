"""
Combined ML Services Entry Point for HF Spaces Deployment (FastAPI Version)
Mounts both Predictive Analytics and Revenue Leakage services under a unified FastAPI app
"""

import os
import sys
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ml_services')

# Add paths for imports
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, base_dir)
sys.path.insert(0, os.path.join(base_dir, 'predictive_analytics'))
sys.path.insert(0, os.path.join(base_dir, 'revenue_leakage'))
sys.path.insert(0, os.path.join(base_dir, 'shared'))


# ============================================================
# Lifespan Context Manager
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    logger.info("🚀 Starting HIS ML Services...")
    logger.info("📊 Predictive Analytics: /predict/*")
    logger.info("💰 Revenue Leakage: /revenue/*")
    yield
    logger.info("👋 Shutting down HIS ML Services...")


# ============================================================
# Create Main Application
# ============================================================

app = FastAPI(
    title="HIS ML Services",
    description="Combined ML services for Hospital Information System - Predictive Analytics & Revenue Leakage Detection",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Root & Health Endpoints
# ============================================================

@app.get("/")
async def root():
    """Root endpoint - Service information"""
    return {
        "success": True,
        "service": "HIS ML Services",
        "version": "1.0.0",
        "description": "Combined ML services for Hospital Information System",
        "services": {
            "predictive_analytics": {
                "prefix": "/predict",
                "description": "OPD rush, bed occupancy, and lab workload predictions",
                "endpoints": ["/predict/opd", "/predict/beds", "/predict/lab"]
            },
            "revenue_leakage": {
                "prefix": "/revenue",
                "description": "Revenue leakage detection and anomaly analysis",
                "endpoints": ["/revenue/detect", "/revenue/anomalies", "/revenue/dashboard"]
            }
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Combined health check endpoint"""
    health_status = {
        "success": True,
        "service": "HIS ML Services",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "predictive_analytics": "available",
            "revenue_leakage": "available"
        }
    }
    return health_status


# ============================================================
# Predictive Analytics Endpoints
# ============================================================

@app.get("/predict/health")
async def predict_health():
    """Predictive Analytics health check"""
    try:
        from predictive_analytics.config import Config
        return {
            "success": True,
            "service": "Predictive Analytics",
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Predictive Analytics health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": str(e)}
        )


@app.post("/predict/opd")
async def predict_opd(request: Request):
    """Predict OPD rush hours"""
    try:
        body = await request.json() if await request.body() else {}
        hours = body.get("hours", 24)
        
        from predictive_analytics.opd_predictor import OPDPredictor
        predictor = OPDPredictor()
        predictions = predictor.predict(hours=hours)
        
        return {
            "success": True,
            "predictions": predictions,
            "hours": hours,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"OPD prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/beds")
async def predict_beds(request: Request):
    """Predict bed occupancy"""
    try:
        body = await request.json() if await request.body() else {}
        days = body.get("days", 7)
        
        from predictive_analytics.bed_predictor import BedPredictor
        predictor = BedPredictor()
        predictions = predictor.predict(days=days)
        
        return {
            "success": True,
            "predictions": predictions,
            "days": days,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Bed prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/lab")
async def predict_lab(request: Request):
    """Predict lab workload"""
    try:
        body = await request.json() if await request.body() else {}
        hours = body.get("hours", 24)
        
        from predictive_analytics.lab_predictor import LabPredictor
        predictor = LabPredictor()
        predictions = predictor.predict(hours=hours)
        
        return {
            "success": True,
            "predictions": predictions,
            "hours": hours,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Lab prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predict/all")
async def get_all_predictions():
    """Get predictions from all models"""
    results = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "predictions": {}
    }
    
    # OPD predictions
    try:
        from predictive_analytics.opd_predictor import OPDPredictor
        predictor = OPDPredictor()
        results["predictions"]["opd"] = predictor.predict(hours=24)
    except Exception as e:
        results["predictions"]["opd"] = {"error": str(e)}
    
    # Bed predictions
    try:
        from predictive_analytics.bed_predictor import BedPredictor
        predictor = BedPredictor()
        results["predictions"]["beds"] = predictor.predict(days=7)
    except Exception as e:
        results["predictions"]["beds"] = {"error": str(e)}
    
    # Lab predictions
    try:
        from predictive_analytics.lab_predictor import LabPredictor
        predictor = LabPredictor()
        results["predictions"]["lab"] = predictor.predict(hours=24)
    except Exception as e:
        results["predictions"]["lab"] = {"error": str(e)}
    
    return results


# ============================================================
# Revenue Leakage Endpoints
# ============================================================

@app.get("/revenue/health")
async def revenue_health():
    """Revenue Leakage health check"""
    try:
        from revenue_leakage.config import Config
        return {
            "success": True,
            "service": "Revenue Leakage Detection",
            "status": "healthy",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Revenue Leakage health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": str(e)}
        )


@app.post("/revenue/detect")
async def detect_anomalies(request: Request):
    """Run anomaly detection scan"""
    try:
        body = await request.json() if await request.body() else {}
        days = body.get("days", 7)
        include_rules = body.get("include_rules", True)
        include_ml = body.get("include_ml", True)
        
        from revenue_leakage.anomaly_detector import AnomalyDetector
        detector = AnomalyDetector()
        anomalies = detector.detect(
            days=days,
            include_rules=include_rules,
            include_ml=include_ml
        )
        
        return {
            "success": True,
            "anomalies": anomalies,
            "count": len(anomalies) if isinstance(anomalies, list) else 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/revenue/anomalies")
async def get_anomalies(status: str = None, type: str = None, limit: int = 100):
    """Get detected anomalies from database"""
    try:
        from revenue_leakage.anomaly_detector import AnomalyDetector
        detector = AnomalyDetector()
        anomalies = detector.get_anomalies(status=status, anomaly_type=type, limit=limit)
        
        return {
            "success": True,
            "anomalies": anomalies,
            "count": len(anomalies) if isinstance(anomalies, list) else 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Get anomalies failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/revenue/dashboard")
async def get_dashboard():
    """Get revenue leakage dashboard statistics"""
    try:
        from revenue_leakage.anomaly_detector import AnomalyDetector
        detector = AnomalyDetector()
        stats = detector.get_dashboard_stats()
        
        return {
            "success": True,
            "dashboard": stats,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Dashboard fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/revenue/train")
async def train_model(request: Request):
    """Train or retrain the ML model"""
    try:
        body = await request.json() if await request.body() else {}
        force = body.get("force", False)
        
        from revenue_leakage.model_trainer import ModelTrainer
        trainer = ModelTrainer()
        result = trainer.train(force=force)
        
        return {
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Model training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Error Handlers
# ============================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": "Endpoint not found",
            "path": str(request.url.path),
            "available_services": ["/predict", "/revenue"],
            "documentation": "/docs"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc)
        }
    )


# ============================================================
# Main Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", os.getenv("FLASK_PORT", 7860)))
    host = os.getenv("HOST", os.getenv("FLASK_HOST", "0.0.0.0"))
    
    logger.info(f"🚀 Starting HIS ML Services on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
