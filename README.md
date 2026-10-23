# 🚗 Car Price Prediction

## 📌 Oasis Infobyte Data Science Internship - Task 3

## 📖 Project Overview

This project focuses on building a complete Machine Learning regression pipeline to predict the selling price of used cars based on various features such as car brand, age, mileage, fuel type, seller type, transmission, and ownership details.

The project includes complete data preprocessing, exploratory data analysis, feature engineering, model training, performance evaluation, and saving the best-performing regression model.

---

# 🎯 Objective

The objective of this project is to develop a reliable machine learning model that can accurately predict used car prices and identify the best regression algorithm based on evaluation metrics.

---

# 📂 Project Structure

```
Car-Price-Prediction/
│
├── dataset/
│   └── car_data.csv
│
├── outputs/
│   ├── selling_price_distribution.png
│   ├── price_vs_fuel_type.png
│   ├── price_vs_year.png
│   ├── correlation_heatmap.png
│   ├── feature_importance.png
│   └── actual_vs_predicted.png
│
├── CarPricePrediction.ipynb
├── CarPricePrediction.py
├── best_car_price_model.pkl
├── requirements.txt
└── README.md
```

---

# 📊 Dataset Information

The dataset contains information about used cars and their selling prices.

## Features Used

* Car_Name
* Year
* Present_Price
* Kms_Driven
* Fuel_Type
* Seller_Type
* Transmission
* Owner
* Selling_Price

---

# ⚙️ Feature Engineering

Additional features were created to improve model performance:

* **Brand Extraction**

  * Extracted car brand information from car names.

* **Car Age Calculation**

  * Calculated vehicle age using manufacturing year.

---

# 🛠 Technologies Used

* Python
* Pandas
* NumPy
* Matplotlib
* Seaborn
* Scikit-learn
* Joblib
* Jupyter Notebook

---

# 🔍 Data Preprocessing

The following preprocessing steps were performed:

* Dataset loading and inspection
* Handling missing values
* Removing duplicate records
* Standardizing categorical values
* Feature extraction
* Encoding categorical variables using One-Hot Encoding
* Splitting dataset into training and testing sets

---

# 📈 Exploratory Data Analysis

The project includes:

* Selling price distribution analysis
* Price comparison based on fuel type
* Car price trend according to manufacturing year
* Correlation heatmap
* Feature importance visualization
* Actual vs predicted price comparison

All visualizations are automatically saved inside the `outputs/` folder.

---

# 🤖 Machine Learning Models

Multiple regression algorithms were implemented and compared:

1. Linear Regression
2. Decision Tree Regressor
3. Random Forest Regressor
4. Gradient Boosting Regressor

---

# 📏 Model Evaluation

Models were evaluated using:

* **Mean Absolute Error (MAE)**
* **Root Mean Squared Error (RMSE)**
* **R² Score**

The best-performing model was selected and saved as:

```
best_car_price_model.pkl
```

---

# 📁 Output Files Generated

The project generates the following output files:

```
outputs/
│
├── selling_price_distribution.png
├── price_vs_fuel_type.png
├── price_vs_year.png
├── correlation_heatmap.png
├── feature_importance.png
└── actual_vs_predicted.png
```

---

# ▶️ How to Run the Project

### Run the website

The project includes a local web application with a used-car price estimator, dataset overview, market charts, model comparison, and a persistent light/dark theme toggle. The estimator starts blank with examples, validates all required fields, and refreshes the estimate automatically when complete vehicle details change.

On Windows, double-click `run_web.bat`. It creates an isolated `.venv-web` environment, installs only the website dependencies, and starts the app. Open **http://127.0.0.1:5000** in your browser.

You can also start it manually after installing the dependencies:

```bash
python -m pip install -r web-requirements.txt
python app.py
```

The app reads `dataset/car_data.csv`, compares four models on a fixed 80/20 holdout split on first load, and saves the selected prediction pipeline to `outputs/web_car_price_pipeline.joblib`. Predictions report estimated prices in ₹ lakh. Keep the terminal running while using the site; press `Ctrl+C` to stop it.

### Publish a live website

This is a Flask app, so it needs a web service host to provide a public website link. The repository includes a Render Blueprint configured for the `main` branch. To deploy it, open [Render](https://render.com/), sign in, choose **New → Blueprint**, connect this GitHub repository, and deploy the `car-price-prediction` service. Render will build and start the app using `render.yaml`; when deployment finishes, open the generated `onrender.com` URL in Chrome or share it with others. The free service may take a short time to wake after inactivity.

You can also use the [Render Flask deployment guide](https://render.com/docs/deploy-flask) if you prefer to configure a web service manually. Set the build command to `pip install -r web-requirements.txt` and the start command to `gunicorn --workers 1 --threads 4 --timeout 120 app:app`.

### Run the standalone analysis script

```bash
python CarPricePrediction.py
```

To explore the notebook, open the file that exists in this project:

```bash
jupyter notebook CarPricePrediction.ipynb
```

---

# ✅ Results

* Successfully developed a regression-based car price prediction system.
* Compared multiple machine learning models.
* Generated performance metrics and visual analysis.
* Saved the best trained model for future predictions.

---

# 👨‍💻 Author

**Shaikh Danish Shaikh Umar Farooq**

### Oasis Infobyte Data Science Internship


---
