# Devpost submission draft

## Project title

Alexa+ AI Car Price Assistant

## Problem

Used-car buyers and sellers need a quick, understandable starting point for estimating a vehicle’s selling price.

## Solution

This project adds a conversational local web experience to an existing car-price prediction repository. Users can choose examples from the bundled dataset or enter vehicle details and receive a scikit-learn model estimate in Indian rupees (₹ lakh).

## Features

- Vehicle details form with input validation.
- Dataset-based examples, estimated result, and conversation history.
- Shows the details used and labels every result as an estimate.
- Optional MCP `predict_car_price` tool over Streamable HTTP.

## Technology

Python, Flask, Pandas, scikit-learn, Joblib, HTML/CSS/JavaScript, and the optional official MCP Python SDK.

## What I personally implemented

I adapted the existing Flask project into a conversational car price assistant, added dataset-based examples, complete input validation, estimate history, and a reset flow. I also added and locally verified a Streamable HTTP MCP server that calls the same prediction path.

## Implementation and model

I reused the repository’s 301-row car dataset and its preprocessing approach. The prediction pipeline uses current showroom price, kilometers driven, owner count, derived vehicle age, fuel, seller type, transmission, and brand extracted from the car name. The app reuses its saved compatible pipeline when present and only retrains if the artifact is missing or incompatible.

## What works

The local web application validates supported inputs and returns an estimate from the saved or locally trained model. The MCP server exposes the same prediction path over Streamable HTTP. It was tested with the official SDK client: protocol `2026-07-28` was negotiated, `predict_car_price` was listed, a valid example returned a real prediction, and an unsupported fuel type returned a clear tool error.

## Limitations

This is a local Alexa+-style demonstration with a verified MCP server, not an official Alexa+ experience or registered Agent Skill. No AWS service is integrated and nothing is deployed. The small dataset does not guarantee accurate market prices. AWS Builder Mini Challenge eligibility remains unmet unless another route in the official rules applies.

## Video

Show the app, choose a real dataset example, submit a prediction, inspect the returned price and input details, then demonstrate another estimate. Show the verified MCP tool call. Clearly disclose that the demo has no AWS or Amazon Alexa+ integration.

## Demo script (under three minutes)

- **0:00–0:20:** “This local demonstration helps users explore a used-car price estimate. It is Alexa+-style, but it is not connected to Amazon Alexa+.”
- **0:20–0:45:** Show the dataset overview and real example prompts.
- **0:45–1:30:** Choose a sample and submit it. Show the estimate, model name, and details used.
- **1:30–2:00:** Change a field or try another prediction; show validation and the estimate disclaimer.
- **2:00–2:30 (optional):** Show the verified MCP server and tool call.
- **2:30–2:50:** State the dataset, local-only, and AWS/Alexa+ limitations.
