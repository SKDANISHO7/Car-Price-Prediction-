"""Web application for the used car price prediction project."""

from __future__ import annotations

import os
from datetime import date
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "dataset" / "car_data.csv"
MODEL_PATH = BASE_DIR / "outputs" / "web_car_price_pipeline.joblib"
CURRENT_YEAR = date.today().year
NUMERIC_FEATURES = ["Present_Price", "Kms_Driven", "Owner", "Car_Age"]
CATEGORICAL_FEATURES = ["Fuel_Type", "Seller_Type", "Transmission", "Brand"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
_state: dict = {}


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH).drop_duplicates().dropna().copy()
    for col in ["Car_Name", "Fuel_Type", "Seller_Type", "Transmission"]:
        df[col] = df[col].astype(str).str.strip()
    for col in ["Fuel_Type", "Seller_Type", "Transmission"]:
        df[col] = df[col].str.title()
    df["Brand"] = df["Car_Name"].str.split().str[0].str.title()
    df["Car_Age"] = CURRENT_YEAR - df["Year"].astype(int)
    return df


def make_pipeline(estimator) -> Pipeline:
    preprocessing = ColumnTransformer(
        transformers=[
            ("numeric", "passthrough", NUMERIC_FEATURES),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )
    return Pipeline([("preprocessing", preprocessing), ("regressor", estimator)])


def get_state() -> dict:
    """Load data and train/cache the models on the first request."""
    if _state:
        return _state
    df = load_data()
    X = df[FEATURES]
    y = df["Selling_Price"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    factories = {
        "Random Forest": lambda: RandomForestRegressor(n_estimators=200, random_state=42),
        "Gradient Boosting": lambda: GradientBoostingRegressor(random_state=42),
        "Decision Tree": lambda: DecisionTreeRegressor(random_state=42),
        "Linear Regression": LinearRegression,
    }
    rows = []
    for name, factory in factories.items():
        model = make_pipeline(factory())
        model.fit(X_train, y_train)
        pred = model.predict(X_test)
        rows.append({
            "name": name,
            "mae": float(mean_absolute_error(y_test, pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_test, pred))),
            "r2": float(r2_score(y_test, pred)),
        })
    rows.sort(key=lambda row: row["r2"], reverse=True)
    best_name = rows[0]["name"]
    best_model = make_pipeline(factories[best_name]())
    best_model.fit(X, y)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)
    _state.update({"df": df, "models": rows, "best_name": best_name, "model": best_model})
    return _state


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/overview")
def overview():
    try:
        state = get_state()
        df = state["df"]
        return jsonify({
            "records": int(len(df)),
            "average_price": round(float(df["Selling_Price"].mean()), 2),
            "median_price": round(float(df["Selling_Price"].median()), 2),
            "average_age": round(float(df["Car_Age"].mean()), 1),
            "categories": {
                key: sorted(df[key].dropna().unique().tolist())
                for key in ["Fuel_Type", "Seller_Type", "Transmission"]
            },
            "fuel_counts": df["Fuel_Type"].value_counts().to_dict(),
            "year_prices": [
                {"year": int(year), "price": round(float(price), 2)}
                for year, price in df.groupby("Year")["Selling_Price"].median().items()
            ],
            "top_brands": df.groupby("Brand").size().sort_values(ascending=False).head(8).to_dict(),
        })
    except Exception as exc:
        app.logger.exception("Could not build project overview")
        return jsonify({"error": str(exc)}), 500


@app.get("/api/models")
def models():
    try:
        state = get_state()
        return jsonify({"models": state["models"], "best_model": state["best_name"]})
    except Exception as exc:
        app.logger.exception("Could not train models")
        return jsonify({"error": str(exc)}), 500


@app.post("/api/predict")
def predict():
    try:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            raise ValueError("Send the vehicle details as a JSON object.")
        required = ["brand", "year", "present_price", "kms_driven", "owner", "fuel_type", "seller_type", "transmission"]
        missing = [field.replace("_", " ") for field in required if field not in payload or payload[field] in (None, "")]
        if missing:
            raise ValueError("Complete all vehicle details: " + ", ".join(missing) + ".")

        def read_number(field: str) -> float:
            raw = payload[field]
            if isinstance(raw, bool):
                raise ValueError(f"Enter a valid number for {field.replace('_', ' ')}.")
            try:
                number = float(raw)
            except (TypeError, ValueError, OverflowError) as exc:
                raise ValueError(f"Enter a valid number for {field.replace('_', ' ')}.") from exc
            if not np.isfinite(number):
                raise ValueError(f"Enter a finite number for {field.replace('_', ' ')}.")
            return number

        year_value = read_number("year")
        owner_value = read_number("owner")
        if not year_value.is_integer() or not owner_value.is_integer():
            raise ValueError("Model year and previous owner count must be whole numbers.")
        year = int(year_value)
        owner = int(owner_value)
        present_price = read_number("present_price")
        kms = read_number("kms_driven")
        if not (1950 <= year <= CURRENT_YEAR):
            raise ValueError(f"Year must be between 1950 and {CURRENT_YEAR}.")
        if present_price <= 0 or kms < 0 or owner < 0 or owner > 5:
            raise ValueError("Enter a positive current price, nonnegative mileage, and 0–5 previous owners.")
        name_parts = str(payload["brand"]).strip().split()
        if not name_parts:
            raise ValueError("Enter the car model or name.")
        brand = name_parts[0].title()
        state = get_state()
        for field, column in [("fuel_type", "Fuel_Type"), ("seller_type", "Seller_Type"), ("transmission", "Transmission")]:
            value = str(payload[field]).strip().title()
            if value not in set(state["df"][column].unique()):
                raise ValueError(f"Choose a {field.replace('_', ' ')} from the available options.")
        row = pd.DataFrame([{
            "Present_Price": present_price,
            "Kms_Driven": kms,
            "Owner": owner,
            "Car_Age": CURRENT_YEAR - year,
            "Fuel_Type": str(payload["fuel_type"]).strip().title(),
            "Seller_Type": str(payload["seller_type"]).strip().title(),
            "Transmission": str(payload["transmission"]).strip().title(),
            "Brand": brand,
        }], columns=FEATURES)
        result = float(state["model"].predict(row)[0])
        return jsonify({"price": round(max(0, result), 2), "currency": "INR lakh", "model": state["best_name"]})
    except (KeyError, TypeError, ValueError) as exc:
        return jsonify({"error": str(exc) or "Please check the values and try again."}), 400
    except Exception as exc:
        app.logger.exception("Prediction failed")
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
