"""
models_loader.py — TraceGuard Model Loader
==========================================
Loads all six pre-trained joblib artefacts from the ../models/ directory once
at import time and exposes them as module-level variables.

Each load is wrapped in its own try/except so that a single missing file
produces a clear error message without crashing the other loads.
"""

import os
import sys
import warnings
from typing import Any, List, Optional

import joblib

# ---------------------------------------------------------------------------
# Resolve the absolute path to the models/ directory (sibling of Backend/)
# ---------------------------------------------------------------------------
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_CURRENT_DIR, "..", "models")

# ---------------------------------------------------------------------------
# Module-level variables — populated on first import
# ---------------------------------------------------------------------------
xgb_binary: Any = None          # XGBoost binary classifier (0=Benign, 1=Malicious)
xgb_multi: Any = None           # XGBoost multiclass classifier
rf_binary: Any = None           # Random-Forest binary classifier (benchmark only)
label_encoder: Any = None       # LabelEncoder with 10 attack classes
le_multi: Any = None            # LabelEncoder for multiclass (malicious only)
feature_columns: Optional[List[str]] = None  # Ordered list of 41 feature names


def _load_artifact(filename: str, description: str) -> Any:
    """Load a single joblib file, logging success or failure."""
    filepath = os.path.join(_MODELS_DIR, filename)
    try:
        # Suppress version-mismatch warnings (models were trained on older
        # scikit-learn / xgboost but remain functionally compatible).
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            artifact = joblib.load(filepath)
        print(f"[models_loader] OK  Loaded {description} from {filepath}")
        return artifact
    except FileNotFoundError:
        print(
            f"[models_loader] ERR {description} not found at {filepath}. "
            f"Make sure the file exists in the models/ directory.",
            file=sys.stderr,
        )
        return None
    except Exception as exc:
        print(
            f"[models_loader] ERR loading {description} from {filepath}: {exc}",
            file=sys.stderr,
        )
        return None


def load_all_models() -> None:
    """
    Load every model artefact into the module-level variables.
    Called once during application startup.
    """
    global xgb_binary, xgb_multi, rf_binary
    global label_encoder, le_multi, feature_columns

    xgb_binary = _load_artifact("xgb_binary.joblib", "XGBoost binary classifier")
    xgb_multi = _load_artifact("xgb_multi.joblib", "XGBoost multiclass classifier")
    rf_binary = _load_artifact("rf_binary.joblib", "Random-Forest binary classifier")
    label_encoder = _load_artifact("label_encoder.joblib", "Label encoder (10 classes)")
    le_multi = _load_artifact("le_multi.joblib", "Label encoder (multiclass / malicious)")
    feature_columns = _load_artifact("feature_columns.joblib", "Feature columns list (41 features)")


def models_are_loaded() -> bool:
    """Return True only if every critical model artefact loaded successfully."""
    return all(
        obj is not None
        for obj in [xgb_binary, xgb_multi, label_encoder, le_multi, feature_columns]
    )
