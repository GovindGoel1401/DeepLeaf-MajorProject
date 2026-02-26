from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    client = TestClient(app)

    payload = {
        "disease": "Brown Spot",
        "confidence": 0.87,
        "soil_type": "Clay",
        "location": "Bangalore",
        "user_query": "What should I do to save my crop?",
    }

    response = client.post("/advisory/", json=payload)
    print("Status code:", response.status_code)
    print("Response JSON:")
    print(response.json())


if __name__ == "__main__":
    main()

