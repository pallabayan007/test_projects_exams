from pathlib import Path
import logging
import pytest
from app.models import ClaimRequest,RecommendedAction
from app.agents.orchestrator import triage

@pytest.mark.asyncio
async def test_example_requests_missing_information(monkeypatch):
    monkeypatch.setattr("app.config.settings.openai_api_key","")
    req=ClaimRequest.model_validate_json((Path(__file__).parents[1]/"app/data/example_request.json").read_text())
    result=await triage(req)
    assert result.recommended_action==RecommendedAction.REQUEST_INFORMATION
    assert "plumber_invoice" in result.missing_evidence
    assert result.human_approval_required is True


@pytest.mark.asyncio
async def test_orchestration_flow_is_logged(monkeypatch, caplog):
    monkeypatch.setattr("app.config.settings.openai_api_key","")
    req=ClaimRequest.model_validate_json((Path(__file__).parents[1]/"app/data/example_request.json").read_text())

    with caplog.at_level(logging.INFO, logger="app.orchestration"):
        await triage(req)

    messages = [record.getMessage() for record in caplog.records]
    assert any("Triage started" in message for message in messages)
    assert any("Running specialist agents" in message for message in messages)
    assert any("Specialist agents completed" in message for message in messages)
    assert any("Deterministic rules evaluated" in message for message in messages)
    assert any("Using deterministic fallback" in message for message in messages)
    assert any("Triage completed" in message for message in messages)
