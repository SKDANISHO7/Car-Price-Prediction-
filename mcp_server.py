"""Optional MCP Streamable HTTP server for the local car price pipeline."""

from __future__ import annotations

from mcp.server import MCPServer
from mcp.server.mcpserver.tools.base import ToolError

from app import app


mcp = MCPServer(
    "Alexa+ AI Car Price Assistant (local demo)",
    instructions=(
        "Predict used car selling prices from the project's local machine learning model. "
        "Predictions are estimates in INR lakh, not guaranteed market prices. "
        "This server is not an Amazon Alexa+ integration."
    ),
)


@mcp.tool()
def predict_car_price(
    brand: str,
    year: int,
    present_price: float,
    kms_driven: int,
    owner: int,
    fuel_type: str,
    seller_type: str,
    transmission: str,
) -> dict:
    """Estimate a used car's selling price using all supported dataset features.

    `present_price` is in INR lakh. Supported fuel, seller, and transmission
    categories are loaded from the bundled car dataset. Returns the actual
    model estimate, currency, selected model, and normalized input details.
    Invalid or unsupported inputs return an actionable error.
    """
    payload = {
        "brand": brand,
        "year": year,
        "present_price": present_price,
        "kms_driven": kms_driven,
        "owner": owner,
        "fuel_type": fuel_type,
        "seller_type": seller_type,
        "transmission": transmission,
    }
    response = app.test_client().post("/api/predict", json=payload)
    result = response.get_json(silent=True) or {"error": "The prediction service returned no result."}
    if response.status_code >= 400:
        raise ToolError(result.get("error", "Please check the car details and try again."))
    return result


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
