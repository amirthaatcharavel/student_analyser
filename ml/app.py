"""
app.py — Flask API server for student performance prediction.

Endpoints:
    POST /predict  — predict student performance from 8 features
    GET  /health   — health check
"""

import os
import pandas as pd
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─── App Setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Node.js backend

# ─── Load trained model & label encoder ──────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
LABEL_ENCODER_PATH = os.path.join(os.path.dirname(__file__), "label_encoder.pkl")

model = None
label_encoder = None


def load_model():
    """Load the trained model and label encoder from disk."""
    global model, label_encoder
    
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. "
            "Run 'python train.py' first to train and save the model."
        )
    
    if not os.path.exists(LABEL_ENCODER_PATH):
        raise FileNotFoundError(
            f"Label encoder not found at {LABEL_ENCODER_PATH}. "
            "Run 'python train.py' first."
        )
    
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
    print("✅ Model and label encoder loaded successfully!")


# ─── Feature column order (must match training) ─────────────────────────────
FEATURE_COLUMNS = [
    "Age",
    "Attendance_Rate",
    "Prior_GPA",
    "LMS_Logins",
    "Study_Hours_Per_Week",
    "Assignment_Submission_Rate",
    "Engagement_Score",
    "Gender",
]


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict student performance.
    
    Expected JSON body:
    {
        "age": 20,
        "gender": "Female",
        "attendance_rate": 91.27,
        "prior_gpa": 2.45,
        "lms_logins": 194,
        "study_hours_per_week": 26.6,
        "assignment_submission_rate": 96.7,
        "engagement_score": 43.33
    }
    
    Returns:
    {
        "prediction": "High",
        "confidence": 96.5,
        "probabilities": { "High": 0.965, "Medium": 0.025, "Low": 0.010 }
    }
    """
    try:
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500

        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # ─── Validate required fields ───────────────────────────────────────
        required_fields = [
            "age", "gender", "attendance_rate", "prior_gpa",
            "lms_logins", "study_hours_per_week",
            "assignment_submission_rate", "engagement_score"
        ]
        
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing)}"
            }), 400

        # ─── Build DataFrame matching training feature order ────────────────
        input_df = pd.DataFrame([{
            "Age": float(data["age"]),
            "Attendance_Rate": float(data["attendance_rate"]),
            "Prior_GPA": float(data["prior_gpa"]),
            "LMS_Logins": float(data["lms_logins"]),
            "Study_Hours_Per_Week": float(data["study_hours_per_week"]),
            "Assignment_Submission_Rate": float(data["assignment_submission_rate"]),
            "Engagement_Score": float(data["engagement_score"]),
            "Gender": str(data["gender"]),
        }])

        # ─── Predict ────────────────────────────────────────────────────────
        pred_encoded = model.predict(input_df)[0]
        pred_proba = model.predict_proba(input_df)[0]
        pred_label = label_encoder.inverse_transform([pred_encoded])[0]

        # Build probability dict for all classes
        probabilities = {}
        for cls, prob in zip(label_encoder.classes_, pred_proba):
            probabilities[cls] = round(float(prob) * 100, 2)

        confidence = round(float(max(pred_proba)) * 100, 2)

        return jsonify({
            "prediction": pred_label,
            "confidence": confidence,
            "probabilities": probabilities,
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid input values: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ─── Main ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_model()
    port = int(os.environ.get("PORT", 5001))
    print(f"🚀 Flask ML API running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
