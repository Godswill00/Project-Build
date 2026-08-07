"""
retraining.py — TraceGuard Binary Classifier Retraining Loop
============================================================
Retrains the XGBoost binary classifier using baseline_samples.parquet
combined with analyst feedback samples, updating the in-memory model object.
"""

import os
import json
import pandas as pd
import xgboost as xgb

from . import models_loader
from . import database

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_MODELS_DIR = os.path.join(_CURRENT_DIR, "..", "models")
_PARQUET_PATH = os.path.join(_MODELS_DIR, "baseline_samples.parquet")


def retrain_binary_classifier() -> bool:
    """
    Load baseline samples, fetch up to 50 unused feedback items, reconstruct
    feature rows, retrain XGBoost binary classifier with specified hyperparameters,
    replace in-memory model object, and mark feedback rows as used.
    """
    print("[retraining] Starting binary classifier retraining loop...")
    try:
        if not os.path.exists(_PARQUET_PATH):
            print(f"[retraining] ERR Baseline parquet dataset not found at {_PARQUET_PATH}")
            return False

        # 1. Load baseline dataset
        df_baseline = pd.read_parquet(_PARQUET_PATH)
        feature_cols = models_loader.feature_columns
        if not feature_cols:
            print("[retraining] ERR feature_columns not loaded from models_loader")
            return False

        X_baseline = df_baseline[feature_cols]
        y_baseline = df_baseline["LABEL"]

        # 2. Fetch unused feedback flows (up to 50)
        feedback_items = database.get_unused_feedback_with_flows(limit=50)
        if not feedback_items:
            print("[retraining] INFO No unused feedback available for retraining.")

        feedback_rows = []
        feedback_labels = []
        feedback_ids = []

        for item in feedback_items:
            try:
                features_dict = json.loads(item["features_json"])
                row = [float(features_dict.get(col, 0.0)) for col in feature_cols]
                # Verdict: 1 if "true_positive", 0 if "false_positive"
                label = 1 if item["verdict"] == "true_positive" else 0

                feedback_rows.append(row)
                feedback_labels.append(label)
                feedback_ids.append(item["feedback_id"])
            except Exception as parse_err:
                print(f"[retraining] WARNING: Skipping feedback item {item.get('feedback_id')}: {parse_err}")

        # 3. Combine baseline with feedback rows
        if feedback_rows:
            X_fb = pd.DataFrame(feedback_rows, columns=feature_cols)
            y_fb = pd.Series(feedback_labels, name="LABEL")

            X_train = pd.concat([X_baseline, X_fb], ignore_index=True)
            y_train = pd.concat([y_baseline, y_fb], ignore_index=True)
        else:
            X_train = X_baseline
            y_train = y_baseline

        # 4. Retrain XGBoost binary classifier with specified hyperparameters
        print(f"[retraining] Training XGBClassifier on {len(X_train)} samples...")
        new_xgb = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42,
        )
        new_xgb.fit(X_train, y_train)

        # 5. On success: replace in-memory model and mark feedback used
        models_loader.xgb_binary = new_xgb
        if feedback_ids:
            database.mark_feedback_used(feedback_ids)

        print(
            f"[retraining] OK Retraining succeeded! Binary classifier updated. "
            f"Processed {len(feedback_ids)} feedback samples."
        )
        return True

    except Exception as exc:
        print(f"[retraining] ERR Retraining failed with exception: {exc}")
        return False
