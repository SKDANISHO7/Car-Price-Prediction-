"""Smoke check the local Streamable HTTP MCP server. Start the server first."""

from __future__ import annotations

import asyncio
import json

from mcp import Client


ENDPOINT = "http://127.0.0.1:8000/mcp"
EXAMPLE = {
    "brand": "Ritz",
    "year": 2014,
    "present_price": 5.59,
    "kms_driven": 27000,
    "owner": 0,
    "fuel_type": "Petrol",
    "seller_type": "Dealer",
    "transmission": "Manual",
}


async def main() -> None:
    async with Client(ENDPOINT) as client:
        if client.protocol_version < "2025-11-25":
            raise RuntimeError(f"MCP protocol is too old: {client.protocol_version}")
        tools = await client.list_tools()
        tool = next((item for item in tools.tools if item.name == "predict_car_price"), None)
        if tool is None:
            raise RuntimeError("predict_car_price was not listed by the server.")
        if set(tool.input_schema.get("properties", {})) != set(EXAMPLE):
            raise RuntimeError(f"Unexpected tool input schema: {tool.input_schema}")
        if set(tool.input_schema.get("required", [])) != set(EXAMPLE):
            raise RuntimeError("The MCP tool schema does not require every car detail.")

        prediction = await client.call_tool("predict_car_price", EXAMPLE)
        if prediction.is_error:
            raise RuntimeError(prediction.content[0].text)
        value = json.loads(prediction.content[0].text)
        if not (value.get("price", 0) > 0 and value.get("currency") == "INR lakh"):
            raise RuntimeError(f"Unexpected prediction output: {value}")

        invalid = await client.call_tool(
            "predict_car_price", {**EXAMPLE, "fuel_type": "Unsupported fuel"}
        )
        if not invalid.is_error or "fuel type" not in invalid.content[0].text.lower():
            raise RuntimeError("The invalid category did not return a useful error.")

        print(f"MCP protocol: {client.protocol_version}")
        print(f"Tool: predict_car_price listed")
        print(f"Valid example: INR {value['price']:.2f} lakh ({value['model']})")
        print(f"Invalid input: {invalid.content[0].text}")


if __name__ == "__main__":
    asyncio.run(main())
