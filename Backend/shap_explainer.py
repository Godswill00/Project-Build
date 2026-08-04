"""
shap_explainer.py — TraceGuard SHAP Explanation Module
======================================================
Provides a cached SHAP TreeExplainer for the XGBoost binary classifier.
Returns the top-10 most influential features (by absolute SHAP value)
for a single flow record.
"""

from typing import Any, Dict, List

import numpy as np
import pandas as pd
import shap

# ---------------------------------------------------------------------------
# Module-level cache for the SHAP TreeExplainer (built once, reused)
# ---------------------------------------------------------------------------
_cached_explainer: shap.TreeExplainer | None = None
_cached_model_id: int | None = None  # id() of the model used to build the explainer


def get_shap_explanation(
    model: Any,
    row_df: pd.DataFrame,
) -> List[Dict[str, float]]:
    """
    Compute SHAP feature attributions for a single flow record.

    Parameters
    ----------
    model : xgboost.XGBClassifier
        The loaded xgb_binary model.
    row_df : pd.DataFrame
        A single-row DataFrame with the 41 feature columns.

    Returns
    -------
    list[dict]
        Top-10 features sorted by |SHAP value| descending.
        Each dict has keys ``feature`` (str) and ``value`` (float).
    """
    global _cached_explainer, _cached_model_id

    # Build the TreeExplainer only once (or if the model object changes)
    if _cached_explainer is None or _cached_model_id != id(model):
        _cached_explainer = shap.TreeExplainer(model)
        _cached_model_id = id(model)

    # Compute SHAP values for the single row
    shap_values = _cached_explainer.shap_values(row_df)

    # shap_values may be a list of arrays (one per class) for binary
    # classifiers — we want the values for the positive class (Malicious = 1).
    if isinstance(shap_values, list):
        values = shap_values[1]  # class-1 (Malicious) attributions
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        # Shape: (n_samples, n_features, n_classes)
        values = shap_values[0, :, 1]
    else:
        values = shap_values

    # Flatten to a 1-D array if needed
    values = np.array(values).flatten()

    # Pair each feature name with its SHAP value
    feature_names: List[str] = list(row_df.columns)
    paired = list(zip(feature_names, values.tolist()))

    # Sort by absolute value (most influential first), take top 10
    paired.sort(key=lambda x: abs(x[1]), reverse=True)
    top_10 = paired[:10]

    return [{"feature": name, "value": round(val, 6)} for name, val in top_10]
