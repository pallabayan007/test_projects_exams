from app.models import ClaimRequest, AgentFinding
from app.security.guardrails import inspect_untrusted_text
from app.tools.repositories import read_policy, read_claim, read_risk_indicators

async def policy_agent(req: ClaimRequest) -> AgentFinding:
    policy=read_policy(req.policy_id)
    clauses=[c for c in policy["clauses"] if c["loss_type"]==req.loss_type]
    return AgentFinding(agent="policy", summary="Retrieved applicable policy clauses",
        facts={"active_from":policy["active_from"],"active_to":policy["active_to"],"excess":policy["excess"],"clauses":clauses},
        citations=[f"policy:{req.policy_id}#{c['id']}" for c in clauses])

async def evidence_agent(req: ClaimRequest) -> AgentFinding:
    warnings=[]; docs=[]
    statement=inspect_untrusted_text(req.customer_statement)
    if statement.suspicious: warnings.append("PROMPT_INJECTION_SIGNAL:customer_statement")
    for d in req.documents:
        inspected=inspect_untrusted_text(d.text)
        if inspected.suspicious: warnings.append(f"PROMPT_INJECTION_SIGNAL:{d.document_id}")
        docs.append({"id":d.document_id,"type":d.document_type,"content":inspected.safe_text[:4000]})
    return AgentFinding(agent="evidence",summary="Inspected supplied evidence",
        facts={"document_types":[d.document_type for d in req.documents],"documents":docs,
               "customer_statement":statement.safe_text[:4000]},warnings=warnings,
        citations=[f"document:{d.document_id}" for d in req.documents])

async def claims_data_agent(req: ClaimRequest) -> AgentFinding:
    claim=read_claim(req.claim_id, req.claim_id)
    return AgentFinding(agent="claims_data",summary="Retrieved authorised claim record",facts=claim,
                        citations=[f"claim:{req.claim_id}"])

async def risk_agent(req: ClaimRequest) -> AgentFinding:
    indicators=read_risk_indicators(req.claim_id, req.claim_id)
    return AgentFinding(agent="risk",summary="Retrieved approved deterministic indicators; no fraud conclusion made",
                        facts=indicators,citations=[f"risk:{req.claim_id}"])
