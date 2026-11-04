import json
from pathlib import Path
from app.models import ClaimRequest
from app.rules import evaluate_rules
from app.tools.repositories import read_policy

def test_missing_invoice():
    req=ClaimRequest.model_validate_json((Path(__file__).parents[1]/"app/data/example_request.json").read_text())
    rules=evaluate_rules(req,read_policy(req.policy_id),{"customer_statement","repair_estimate"})
    evidence=next(r for r in rules if r.rule_id=="REQUIRED_EVIDENCE")
    print(evidence.message)
    assert not evidence.passed and "plumber_invoice" in evidence.message


    