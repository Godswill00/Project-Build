"""
main.py — TraceGuard FastAPI Application
========================================
Entry-point for the network intrusion detection API with MySQL persistence,
analyst authentication, and retraining loop.

Endpoints
---------
GET  /             — API welcome page.
GET  /health       — Liveness check; confirms models are loaded.
POST /login        — Analyst login (returns JWT token).
POST /predict      — Classify a single network-flow record (protected by Bearer token).
POST /feedback     — Submit true/false positive feedback for a flagged flow (protected).
GET  /flagged-flows— Retrieve historical flagged flows with feedback verdicts (protected).
"""

import json
from contextlib import asynccontextmanager
from typing import List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware

# Local modules
from . import database
from . import auth
from . import retraining
from . import models_loader
from . import provenance_graph as pg
from . import shap_explainer
from .schemas import (
    FlowInput,
    PredictionResponse,
    ShapEntry,
    LoginRequest,
    LoginResponse,
    FeedbackRequest,
)

# ---------------------------------------------------------------------------
# Application lifespan — load models & initialize database on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all model artefacts and initialize database before serving requests."""
    models_loader.load_all_models()

    if not models_loader.models_are_loaded():
        print("[main] WARNING: One or more critical models failed to load. "
              "/predict will return errors until the issue is resolved.")

    # Initialize database tables and seed initial analyst account
    database.init_db()

    yield  # Application runs here


# ---------------------------------------------------------------------------
# FastAPI app instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="TraceGuard — Network Intrusion Detection API",
    description=(
        "Classifies network-flow records as Benign or Malicious using "
        "pre-trained XGBoost models, provides SHAP-based explanations, "
        "maintains an in-memory provenance graph, persists flagged flows in MySQL, "
        "supports analyst authentication, and enables feedback-triggered retraining."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS middleware — allow all origins for local & deployed frontend development
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
        "version": "1.1.0",
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
# POST /login
# ---------------------------------------------------------------------------
@app.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """Authenticate analyst against users table and return a signed JWT access token."""
    user = database.get_user_by_username(credentials.username)
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": user.username})
    return LoginResponse(access_token=access_token, token_type="bearer")


# ---------------------------------------------------------------------------
# POST /predict (Protected)
# ---------------------------------------------------------------------------
@app.post("/predict", response_model=PredictionResponse)
async def predict(
    flow: FlowInput,
    current_analyst: str = Depends(auth.get_current_analyst),
):
    """
    Classify a single network-flow record. (Requires Bearer token)

    Steps
    -----
    1. Build a single-row DataFrame from the 41 features.
    2. Binary classification (Benign / Malicious) with confidence.
    3. If malicious → multiclass classification for attack type.
    4. If malicious → SHAP feature attributions (top 10).
    5. If malicious + IPs provided → update provenance graph & traceback.
    6. If malicious → persist to flagged_flows database table and return flagged_flow_id.
    7. Return structured response.
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
    attack_type: Optional[str] = None
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

    # --- (f) Persist malicious flow to database ----------------------------
    flagged_flow_id: Optional[int] = None
    if is_malicious:
        features_dict = {col: getattr(flow, col) for col in feature_cols}
        features_json = json.dumps(features_dict)
        shap_json = json.dumps([s.model_dump() for s in shap_results]) if shap_results else None
        provenance_json = json.dumps(provenance_context) if provenance_context else None

        flagged_flow_id = database.insert_flagged_flow(
            source_ip=flow.source_ip,
            destination_ip=flow.destination_ip,
            prediction=prediction_label,
            attack_type=attack_type,
            confidence=confidence,
            shap_json=shap_json,
            provenance_json=provenance_json,
            features_json=features_json,
        )

    # --- (g) Build and return response -------------------------------------
    return PredictionResponse(
        prediction=prediction_label,
        confidence=round(confidence, 6),
        attack_type=attack_type,
        shap_explanation=shap_results,
        provenance=provenance_context,
        source_ip=flow.source_ip,
        destination_ip=flow.destination_ip,
        flagged_flow_id=flagged_flow_id,
    )


# ---------------------------------------------------------------------------
# POST /feedback (Protected)
# ---------------------------------------------------------------------------
@app.post("/feedback")
async def submit_feedback(
    fb_req: FeedbackRequest,
    current_analyst: str = Depends(auth.get_current_analyst),
):
    """
    Submit analyst verdict ('true_positive' / 'false_positive') for a flagged flow.
    Triggers binary classifier retraining if 50+ unused feedback rows accumulate.
    """
    feedback_id = database.insert_feedback(
        flagged_flow_id=fb_req.flagged_flow_id,
        verdict=fb_req.verdict,
    )
    if not feedback_id:
        raise HTTPException(
            status_code=500,
            detail="Failed to record feedback in database."
        )

    unused_count = database.count_unused_feedback()
    retrain_triggered = False

    if unused_count >= 50:
        # NOTE: In a production system at scale, this synchronous retrain execution
        # would be dispatched to an asynchronous background task queue (e.g. Celery / ARQ / Redis).
        retrain_triggered = retraining.retrain_binary_classifier()

    return {
        "status": "success",
        "feedback_id": feedback_id,
        "unused_feedback_count": unused_count,
        "retrain_triggered": retrain_triggered,
    }


# ---------------------------------------------------------------------------
# GET /flagged-flows (Protected)
# ---------------------------------------------------------------------------
@app.get("/flagged-flows")
async def get_flagged_flows(
    current_analyst: str = Depends(auth.get_current_analyst),
):
    """Retrieve historical flagged flows joined with analyst feedback verdicts."""
    flows = database.get_all_flagged_flows_with_feedback()
    return flows
