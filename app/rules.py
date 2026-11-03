from datetime import date
from app.models import ClaimRequest, RuleResult

def evaluate_rules(req: ClaimRequest, policy: dict, supplied_types: set[str]) -> list[RuleResult]:
    results=[]
    active = date.fromisoformat(policy["active_from"]) <= req.loss_date <= date.fromisoformat(policy["active_to"])
    results.append(RuleResult(rule_id="POLICY_ACTIVE", passed=active,
        message="Policy active on loss date" if active else "Policy not active on loss date",
        mandatory_referral=not active))
    required=set(policy.get("required_evidence",{}).get(req.loss_type,[]))
    missing=sorted(required-supplied_types)
    results.append(RuleResult(rule_id="REQUIRED_EVIDENCE", passed=not missing,
        message="Evidence complete" if not missing else f"Missing: {', '.join(missing)}"))
    high=req.claim_amount >= 100_000
    results.append(RuleResult(rule_id="HIGH_VALUE", passed=not high,
        message="Within standard value range" if not high else "High-value specialist referral required",
        mandatory_referral=high))
    return results
