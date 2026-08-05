"""
main.py — TraceGuard FastAPI Application
========================================
Entry-point for the network intrusion detection API.

Endpoints
---------
GET  /health   — Liveness check; confirms models are loaded.
POST /predict  — Classify a single network-flow record and return the
                 prediction, confidence, SHAP explanation (if malicious),
                 and provenance-graph context (if IPs are provided).
"""

from contextlib import asynccontextmanager
from typing import List

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Local modules (package-relative imports so Backend.main works when imported
# as a package module: `Backend.main`)
from . import models_loader
from . import provenance_graph as pg
from . import shap_explainer
from .schemas import FlowInput, PredictionResponse, ShapEntry

# ---------------------------------------------------------------------------
# Application lifespan — load models once on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all model artefacts before the first request is served."""
    models_loader.load_all_models()

    if not models_loader.models_are_loaded():
        print("[main] WARNING: One or more critical models failed to load. "
              "/predict will return errors until the issue is resolved.")

    yield  # Application runs here
    # Shutdown: nothing to clean up for now


# ---------------------------------------------------------------------------
# FastAPI app instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="TraceGuard — Network Intrusion Detection API",
    description=(
        "Classifies network-flow records as Benign or Malicious using "
        "pre-trained XGBoost models, provides SHAP-based explanations, "
        "and maintains an in-memory provenance graph for forensic analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS middleware — allow all origins for local frontend development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Welcome page offering basic API info and links to interactive docs."""
    return {
        "message": "Welcome to the TraceGuard Network Intrusion Detection System API!",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/health"
    }


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    """Simple liveness probe that also confirms model readiness."""
    return {
        "status": "ok",
        "models_loaded": models_loader.models_are_loaded(),
    }



# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------
@app.post("/predict", response_model=PredictionResponse)
async def predict(flow: FlowInput):
    """
    Classify a single network-flow record.

    Steps
    -----
    1. Build a single-row DataFrame from the 41 features.
    2. Binary classification (Benign / Malicious) with confidence.
    3. If malicious → multiclass classification for attack type.
    4. If malicious → SHAP feature attributions (top 10).
    5. If malicious + IPs provided → update provenance graph & traceback.
    6. Return structured response.
    """

    # --- Guard: ensure models are available --------------------------------
    if not models_loader.models_are_loaded():
        raise HTTPException(
            status_code=503,
            detail="Models are not loaded. Check server logs for details.",
        )

    # --- (a) Build single-row DataFrame in the exact column order ----------
    feature_cols: List[str] = models_loader.feature_columns
    row_data = {col: [getattr(flow, col)] for col in feature_cols}
    row_df = pd.DataFrame(row_data, columns=feature_cols)

    # --- (b) Binary prediction + confidence --------------------------------
    binary_pred = models_loader.xgb_binary.predict(row_df)[0]
    binary_proba = models_loader.xgb_binary.predict_proba(row_df)[0]

    is_malicious: bool = int(binary_pred) == 1

    if is_malicious:
        prediction_label = "Malicious"
        confidence = float(binary_proba[1])  # P(Malicious)
    else:
        prediction_label = "Benign"
        confidence = float(binary_proba[0])  # P(Benign)

    # --- (c) Multiclass attack type (only if malicious) --------------------
    attack_type: str | None = None
    if is_malicious:
        multi_pred = models_loader.xgb_multi.predict(row_df)[0]

        # le_multi.inverse_transform gives the original integer code
        # (one of [0,1,3,4,5,6,7,8,9]), which is an index into
        # label_encoder.classes_.
        original_code = models_loader.le_multi.inverse_transform(
            [int(multi_pred)]
        )[0]
        attack_type = str(
            models_loader.label_encoder.classes_[int(original_code)]
        )

    # --- (d) SHAP explanation (only if malicious) --------------------------
    shap_results: List[ShapEntry] = []
    if is_malicious:
        raw_shap = shap_explainer.get_shap_explanation(
            models_loader.xgb_binary, row_df
        )
        shap_results = [ShapEntry(**entry) for entry in raw_shap]

    # --- (e) Provenance graph (only if malicious AND both IPs provided) ----
    provenance_context = None
    if is_malicious and flow.source_ip and flow.destination_ip:
        pg.add_flow(
            source_ip=flow.source_ip,
            destination_ip=flow.destination_ip,
            attack_type=attack_type,
            confidence=confidence,
        )
        provenance_context = pg.get_traceback(flow.source_ip)

    # --- (f) Build and return response -------------------------------------
    return PredictionResponse(
        prediction=prediction_label,
        confidence=round(confidence, 6),
        attack_type=attack_type,
        shap_explanation=shap_results,
        provenance=provenance_context,
        source_ip=flow.source_ip,
        destination_ip=flow.destination_ip,
    )
