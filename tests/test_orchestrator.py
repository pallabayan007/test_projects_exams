from pathlib import Path
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
