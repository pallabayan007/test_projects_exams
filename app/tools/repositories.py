import json
from pathlib import Path
from app.security.guardrails import enforce_claim_scope
BASE = Path(__file__).resolve().parents[1] / "data"

def _load(name: str) -> dict:
    return json.loads((BASE / name).read_text())

def read_policy(policy_id: str) -> dict:
    policy = _load("policies.json").get(policy_id)
    if not policy: raise KeyError("Policy not found")
    return policy

def read_claim(claim_id: str, authorised_claim_id: str) -> dict:
    enforce_claim_scope(claim_id, authorised_claim_id)
    claim = _load("claims.json").get(claim_id)
    if not claim: raise KeyError("Claim not found")
    return claim

def read_risk_indicators(claim_id: str, authorised_claim_id: str) -> dict:
    claim = read_claim(claim_id, authorised_claim_id)
    return {"prior_similar_claims": claim.get("prior_similar_claims", 0),
            "approved_indicator_only": True}
