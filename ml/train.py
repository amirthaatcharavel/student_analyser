"""
train.py — Train a Random Forest model for 3-class student performance prediction.

Target classes: High, Medium, Low
Features: Age, Gender, Attendance_Rate, Prior_GPA, LMS_Logins,
          Study_Hours_Per_Week, Assignment_Submission_Rate, Engagement_Score

Outputs: model.pkl (serialized sklearn Pipeline)
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# ─── Configuration ───────────────────────────────────────────────────────────
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "student_performance_dataset.csv")
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
LABEL_ENCODER_PATH = os.path.join(os.path.dirname(__file__), "label_encoder.pkl")
RANDOM_STATE = 42
TEST_SIZE = 0.2

# ─── Feature definitions ────────────────────────────────────────────────────
NUMERIC_FEATURES = [
    "Age",
    "Attendance_Rate",
    "Prior_GPA",
    "LMS_Logins",
    "Study_Hours_Per_Week",
    "Assignment_Submission_Rate",
    "Engagement_Score",
]

CATEGORICAL_FEATURES = ["Gender"]

TARGET_COL = "Final_Academic_Performance"


def main():
    # ─── Load dataset ────────────────────────────────────────────────────────
    print("=" * 60)
    print("📂 Loading dataset...")
    print("=" * 60)
    
    df = pd.read_csv(DATASET_PATH)
    print(f"   Loaded {len(df)} rows × {len(df.columns)} columns")
    print(f"   Target classes: {df[TARGET_COL].unique()}")
    print(f"   Class distribution:\n{df[TARGET_COL].value_counts().to_string()}\n")

    # ─── Prepare features & target ───────────────────────────────────────────
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET_COL]

    # Encode target labels (High=0, Low=1, Medium=2) — stored for inverse transform
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    print(f"   Label mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}\n")

    # ─── Train/test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_encoded,
    )
    print(f"   Train: {X_train.shape[0]} samples | Test: {X_test.shape[0]} samples\n")

    # ─── Build preprocessing + model pipeline ────────────────────────────────
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )

    pipeline = Pipeline([
        ("preprocess", preprocessor),
        ("clf", RandomForestClassifier(random_state=RANDOM_STATE)),
    ])

    # ─── Hyperparameter tuning ───────────────────────────────────────────────
    param_grid = {
        "clf__n_estimators": [100, 200, 300],
        "clf__max_depth": [10, 20, None],
        "clf__min_samples_split": [2, 5],
        "clf__class_weight": ["balanced", None],
    }

    print("=" * 60)
    print("🔄 Training & tuning Random Forest (3-class)")
    print("=" * 60)

    grid = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring="f1_macro",
        cv=5,
        n_jobs=-1,
        verbose=1,
    )

    grid.fit(X_train, y_train)

    print(f"\n✅ Best Parameters: {grid.best_params_}")
    print(f"✅ Best CV f1_macro: {grid.best_score_:.4f}\n")

    # ─── Evaluate on test set ────────────────────────────────────────────────
    y_pred = grid.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)

    print("=" * 60)
    print(f"🎯 Test Accuracy: {test_acc:.4f}")
    print("=" * 60)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"Classes: {le.classes_}")
    print(cm)

    # ─── Save model & label encoder ─────────────────────────────────────────
    best_model = grid.best_estimator_
    joblib.dump(best_model, MODEL_OUTPUT_PATH)
    joblib.dump(le, LABEL_ENCODER_PATH)

    print(f"\n💾 Model saved to: {MODEL_OUTPUT_PATH}")
    print(f"💾 Label encoder saved to: {LABEL_ENCODER_PATH}")

    # ─── Quick sanity check ──────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("🔍 Sanity Check — Sample Prediction")
    print("=" * 60)

    sample = pd.DataFrame([{
        "Age": 20,
        "Attendance_Rate": 91.27,
        "Prior_GPA": 2.45,
        "LMS_Logins": 194,
        "Study_Hours_Per_Week": 26.6,
        "Assignment_Submission_Rate": 96.7,
        "Engagement_Score": 43.33,
        "Gender": "Female",
    }])

    pred_encoded = best_model.predict(sample)[0]
    pred_proba = best_model.predict_proba(sample)[0]
    pred_label = le.inverse_transform([pred_encoded])[0]

    print(f"   Prediction: {pred_label}")
    print(f"   Confidence: {max(pred_proba) * 100:.1f}%")
    print(f"   Probabilities: {dict(zip(le.classes_, [f'{p:.3f}' for p in pred_proba]))}")
    print("\n✅ Training complete!")


if __name__ == "__main__":
    main()
