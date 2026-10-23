# Alexa+ AI Car Price Assistant

A small conversational web demonstration built on the existing used-car price prediction project. Enter a vehicle’s details, ask for an estimate, and review the inputs and result in the conversation history.

## Problem and solution

Used-car buyers and sellers need a simple starting point for understanding a vehicle’s value. This project reuses its bundled dataset and saved scikit-learn preprocessing/model pipeline to produce an estimate. The conversational presentation is an independent local demonstration; it is not connected to Amazon Alexa+.

## Features

- Responsive local web application with a conversational assistant panel.
- Example prompts populated from real rows in `dataset/car_data.csv`.
- Validated car details and understandable errors.
- Price estimate in Indian rupees (₹ lakh), with the fields used and selected model shown.
- Conversation history and a button to try another estimate.
- Dataset overview and optional holdout comparison of four regressors.
- Optional MCP tool, `predict_car_price`, served over Streamable HTTP using the official MCP Python SDK.

Predictions are estimates, not guaranteed market prices.

## Dataset and model

The bundled CSV has 301 raw rows (299 after the app removes duplicate and incomplete records) and these columns: `Car_Name`, `Year`, `Selling_Price`, `Present_Price`, `Kms_Driven`, `Fuel_Type`, `Seller_Type`, `Transmission`, and `Owner`. The target is `Selling_Price`, expressed in lakh. The prediction features are `Present_Price`, `Kms_Driven`, `Owner`, derived `Car_Age`, and `Fuel_Type`, `Seller_Type`, `Transmission`, and `Brand` (the first word of `Car_Name`). A `ColumnTransformer` passes numeric values through and one-hot encodes the categorical values; the saved pipeline contains the chosen scikit-learn regressor.

At startup the app checks the existing `outputs/web_car_price_pipeline.joblib`. If its feature schema matches and it can produce a prediction, it is reused. If it is missing or incompatible, the app evaluates Random Forest, Gradient Boosting, Decision Tree, and Linear Regression on the existing fixed 80/20 split, then trains and saves the best pipeline. This does not alter the dataset or the standalone analysis script. The saved file is a generated local artifact and is ignored by Git.

The app derives car age from the current year. The dataset is small and reflects a limited set of Indian used-car listings, so estimates can be inaccurate, especially for vehicles outside the dataset’s range.

## Technology and architecture

- Python, Flask, Pandas, NumPy, scikit-learn, Joblib
- HTML, CSS, and JavaScript for the browser interface
- Optional official MCP Python SDK for a Streamable HTTP server at `/mcp`

The browser calls the Flask JSON endpoints. The MCP tool calls the same validated prediction endpoint, so both interfaces use the same dataset, validation, and saved model. The web app and MCP server run as separate local processes.

## Run the web application on Windows

Open PowerShell in the project folder:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r web-requirements.txt
python app.py
```

If PowerShell blocks activation, run the environment’s Python directly instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r web-requirements.txt
.\.venv\Scripts\python.exe app.py
```

Open <http://127.0.0.1:5000>. Leave the terminal running while using the site; press `Ctrl+C` to stop it. The existing `run_web.bat` is also available as a one-click launcher.

## Example use

Choose one of the sample prompts, or enter the supported vehicle details: car name/brand, model year, current showroom price in ₹ lakh, kilometers driven, previous-owner count, fuel type, seller type, and transmission. Select **Ask for estimate**. The result appears in the result panel; the conversation history shows the estimate and every input detail used.

## Optional MCP server

The MCP server is separate from the browser demo. It requires Python 3.11 or newer. Use the same active virtual environment, then install its optional dependencies:

```powershell
python -m pip install -r mcp-requirements.txt
mcp run mcp_server.py --transport streamable-http
```

The local MCP endpoint is `http://127.0.0.1:8000/mcp`. The tool schema is generated from the typed function arguments and its description. The server validates input through the same Flask prediction route and returns the model’s estimate in INR lakh. Start it only when an MCP client or Inspector needs it. The version range selects the official Python SDK 2.x line, which supports the required 2025-11-25 protocol as well as newer revisions. This server was exercised with MCP SDK 2.3.0; the client negotiated protocol `2026-07-28`, listed the tool, received a real prediction, and received a useful invalid-input error.

## Checks

Run the lightweight project checks from PowerShell:

```powershell
python -m compileall app.py mcp_server.py
python -c "from app import app, load_data; print(load_data().shape); c=app.test_client(); print(c.get('/api/overview').status_code)"
```

When MCP dependencies are installed and the server is running, check the endpoint from another PowerShell window:

```powershell
python verify_mcp.py
```

## Integration status and limitations

- **Category A: local conversational web demonstration:** yes.
- **Category B: verified MCP implementation:** yes. The official SDK Streamable HTTP server was verified locally with protocol `2026-07-28`, which is newer than the required `2025-11-25` minimum.
- **Category C: genuine Alexa+ experience:** no. No Alexa+ account, Agent Skill, or Amazon integration is configured.
- **AWS:** no AWS service is integrated. AWS Builder Mini Challenge eligibility requirements remain unmet unless the official rules provide another qualifying route.
- No deployment is configured for the local assistant. The repository’s existing Render configuration is separate and does not establish an AWS deployment.
- The model is trained on a small bundled dataset and is not a live market valuation service.

## Future improvements

Connect a properly registered Alexa+ Agent Skill if the track requires it, obtain a larger and more current dataset, measure error on representative data, and add a genuine AWS integration only when the submission route requires it and it can be configured safely.

## Demo video (under three minutes)

1. **0:00–0:20:** Introduce the used-car pricing problem and clarify that this is a local Alexa+-style demo, not an Amazon connection.
2. **0:20–0:45:** Show the dataset overview and sample prompts drawn from the bundled CSV.
3. **0:45–1:30:** Choose a sample car, submit the estimate, and show the returned ₹ lakh value, model name, and details used.
4. **1:30–2:00:** Try another prediction with a changed input and point out the validation and estimate disclaimer.
5. **2:00–2:30 (optional):** Show an MCP client listing `predict_car_price` and calling the local Streamable HTTP server if that server has been verified.
6. **2:30–2:50:** State the limits clearly: small dataset, estimate only, no AWS service, and no official Alexa+ integration.
