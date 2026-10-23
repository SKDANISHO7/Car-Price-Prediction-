# ==============================================================================
# Car Price Prediction
# Oasis Infobyte Data Science Internship - Task 3
# ==============================================================================

import os
import warnings
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

warnings.filterwarnings("ignore")

OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ------------------------------------------------------------------------------
# 1. Load the dataset
# ------------------------------------------------------------------------------
df = pd.read_csv("dataset/car_data.csv")

print("Dataset loaded successfully.")
print("Shape:", df.shape)
print("\nPreview:\n", df.head().to_string(index=False))
print("\nColumns:", df.columns.tolist())

# ------------------------------------------------------------------------------
# 2. Data cleaning and standardization
# ------------------------------------------------------------------------------
df = df.drop_duplicates().dropna().copy()

for col in ["Car_Name", "Fuel_Type", "Seller_Type", "Transmission"]:
    df[col] = df[col].astype(str).str.strip()

# Clean categorical values
for col in ["Fuel_Type", "Seller_Type", "Transmission"]:
    df[col] = df[col].str.title()

# Create a new brand feature from the car name
if "Car_Name" in df.columns:
    df["Brand"] = df["Car_Name"].str.split().str[0].str.title()

# ------------------------------------------------------------------------------
# 3. Exploratory data analysis
# ------------------------------------------------------------------------------
plt.figure(figsize=(8, 5), dpi=150)
sns.histplot(df["Selling_Price"], bins=20, kde=True, color="steelblue")
plt.title("Distribution of Selling Price", fontsize=13, fontweight="bold")
plt.xlabel("Selling Price")
plt.ylabel("Frequency")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "selling_price_distribution.png"), dpi=300, bbox_inches="tight")
plt.show()

plt.figure(figsize=(8, 5), dpi=150)
sns.boxplot(data=df, x="Fuel_Type", y="Selling_Price", palette="Set2")
plt.title("Selling Price vs Fuel Type", fontsize=13, fontweight="bold")
plt.xlabel("Fuel Type")
plt.ylabel("Selling Price")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "price_vs_fuel_type.png"), dpi=300, bbox_inches="tight")
plt.show()

plt.figure(figsize=(8, 5), dpi=150)
sns.scatterplot(data=df, x="Year", y="Selling_Price", alpha=0.7)
plt.title("Selling Price vs Car Age", fontsize=13, fontweight="bold")
plt.xlabel("Year")
plt.ylabel("Selling Price")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "price_vs_year.png"), dpi=300, bbox_inches="tight")
plt.show()

plt.figure(figsize=(11, 8), dpi=150)
num_df = df.select_dtypes(include=[np.number])
sns.heatmap(num_df.corr(), annot=True, cmap="coolwarm", fmt=".2f")
plt.title("Feature Correlation Heatmap", fontsize=13, fontweight="bold")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "correlation_heatmap.png"), dpi=300, bbox_inches="tight")
plt.show()

# ------------------------------------------------------------------------------
# 4. Feature engineering
# ------------------------------------------------------------------------------
car_df = df.copy()
car_df["Car_Age"] = 2025 - car_df["Year"]
car_df = car_df.drop(columns=["Car_Name", "Year"], errors="ignore")

car_df = pd.get_dummies(
    car_df,
    columns=["Fuel_Type", "Seller_Type", "Transmission", "Brand"],
    drop_first=True,
    dtype=int
)

X = car_df.drop(columns=["Selling_Price"])
y = car_df["Selling_Price"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("\nTraining shape:", X_train.shape)
print("Testing shape:", X_test.shape)

# ------------------------------------------------------------------------------
# 5. Train regression models
# ------------------------------------------------------------------------------
def evaluate_model(name, model, X_train, X_test, y_train, y_test):
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    print(f"{name}: MAE={mae:.4f}, RMSE={rmse:.4f}, R2={r2:.4f}")
    return {"Model": name, "MAE": mae, "RMSE": rmse, "R2": r2, "Model_Object": model}

models = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(random_state=42),
    "Random Forest": RandomForestRegressor(n_estimators=200, random_state=42),
    "Gradient Boosting": GradientBoostingRegressor(random_state=42),
}

results = []
for model_name, model in models.items():
    results.append(evaluate_model(model_name, model, X_train, X_test, y_train, y_test))

results_df = pd.DataFrame(results).sort_values(by="R2", ascending=False).reset_index(drop=True)
print("\nModel comparison:\n", results_df[["Model", "MAE", "RMSE", "R2"]])

best_model_row = results_df.iloc[0]
best_model = best_model_row["Model_Object"]

# ------------------------------------------------------------------------------
# 6. Feature importance plot for the best model
# ------------------------------------------------------------------------------
if hasattr(best_model, "feature_importances_"):
    importances = pd.Series(best_model.feature_importances_, index=X.columns).sort_values(ascending=False)[:15]
    plt.figure(figsize=(10, 6), dpi=150)
    importances.plot(kind="bar", color="seagreen")
    plt.title(f"Top Feature Importances - {best_model_row['Model']}", fontsize=13, fontweight="bold")
    plt.ylabel("Importance")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "feature_importance.png"), dpi=300, bbox_inches="tight")
    plt.show()
else:
    print("Feature importance is not available for the selected model.")

# ------------------------------------------------------------------------------
# 7. Actual vs predicted plot
# ------------------------------------------------------------------------------
best_predictions = best_model.predict(X_test)
plt.figure(figsize=(8, 5), dpi=150)
plt.scatter(y_test, best_predictions, alpha=0.7)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], color="red", linestyle="--")
plt.title(f"Actual vs Predicted Prices - {best_model_row['Model']}", fontsize=13, fontweight="bold")
plt.xlabel("Actual Selling Price")
plt.ylabel("Predicted Selling Price")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, "actual_vs_predicted.png"), dpi=300, bbox_inches="tight")
plt.show()

# ------------------------------------------------------------------------------
# 8. Save model
# ------------------------------------------------------------------------------
joblib.dump(best_model, os.path.join(OUTPUT_DIR, "best_car_price_model.pkl"))
print("\nBest model saved to:", os.path.join(OUTPUT_DIR, "best_car_price_model.pkl"))
