from datetime import date
from enum import Enum
from pydantic import BaseModel, Field

class RecommendedAction(str, Enum):
    REQUEST_INFORMATION = "REQUEST_INFORMATION"
    REFER_HANDLER = "REFER_HANDLER"
    REFER_SPECIALIST = "REFER_SPECIALIST"
    CONTINUE_ASSESSMENT = "CONTINUE_ASSESSMENT"

class Document(BaseModel):
    document_id: str
    document_type: str
    text: str = Field(max_length=40_000)

class ClaimRequest(BaseModel):
    claim_id: str = Field(pattern=r"^CLM-[A-Z0-9-]+$")
    policy_id: str
    loss_type: str
    loss_date: date
    claim_amount: float = Field(ge=0, le=10_000_000)
    customer_statement: str = Field(max_length=20_000)
    documents: list[Document] = []

class AgentFinding(BaseModel):
    agent: str
    summary: str
    facts: dict = {}
    citations: list[str] = []
    warnings: list[str] = []

class RuleResult(BaseModel):
    rule_id: str
    passed: bool
    message: str
    mandatory_referral: bool = False

class TriageDecision(BaseModel):
    claim_id: str
    coverage_assessment: str
    recommended_action: RecommendedAction
    rationale: list[str]
    missing_evidence: list[str]
    citations: list[str]
    confidence: float = Field(ge=0, le=1)
    human_approval_required: bool = True
    prohibited_actions: list[str] = [
        "APPROVE_PAYMENT", "DECLINE_CLAIM", "CHANGE_BANK_DETAILS",
        "CHANGE_AUTHORITY_LIMIT", "BYPASS_HUMAN_APPROVAL"
    ]
    security_events: list[str] = []
