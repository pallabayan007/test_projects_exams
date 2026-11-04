import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
example_request = json.loads(
    (Path(__file__).parents[1] / "app/data/example_request.json").read_text()
)


def test_health_does_not_require_authentication():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_frontend_origin_can_preflight_authenticated_triage():
    response = client.options(
        "/v1/claims/triage",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_triage_openapi_declares_basic_authentication():
    operation = app.openapi()["paths"]["/v1/claims/triage"]["post"]

    assert operation["security"] == [{"HTTPBasic": []}]


def test_triage_requires_authentication(monkeypatch):
    monkeypatch.setattr("app.main.settings.api_username", "test-user")
    monkeypatch.setattr("app.main.settings.api_password", "test-password")

    response = client.post("/v1/claims/triage", json=example_request)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Basic"


def test_triage_rejects_invalid_credentials(monkeypatch):
    monkeypatch.setattr("app.main.settings.api_username", "test-user")
    monkeypatch.setattr("app.main.settings.api_password", "test-password")

    response = client.post(
        "/v1/claims/triage",
        json=example_request,
        auth=("test-user", "wrong-password"),
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Basic"


def test_triage_requires_configured_credentials(monkeypatch):
    monkeypatch.setattr("app.main.settings.api_username", "")
    monkeypatch.setattr("app.main.settings.api_password", "")

    response = client.post(
        "/v1/claims/triage",
        json=example_request,
        auth=("test-user", "test-password"),
    )

    assert response.status_code == 503


def test_triage_accepts_valid_credentials(monkeypatch):
    monkeypatch.setattr("app.main.settings.api_username", "test-user")
    monkeypatch.setattr("app.main.settings.api_password", "test-password")

    response = client.post(
        "/v1/claims/triage",
        json=example_request,
        auth=("test-user", "test-password"),
    )

    assert response.status_code == 200
