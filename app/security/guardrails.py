import re
from dataclasses import dataclass

INJECTION_PATTERNS = [
    r"ignore (all|any|the|previous) instructions",
    r"system (prompt|instruction)",
    r"approve (the|this) claim",
    r"call (the )?(payment|payout|bank) api",
    r"reveal (the )?(prompt|secret|api key)",
    r"bypass (human|approval|policy|rules)",
]

@dataclass
class Inspection:
    safe_text: str
    suspicious: bool
    matches: list[str]


def inspect_untrusted_text(text: str) -> Inspection:
    matches = [p for p in INJECTION_PATTERNS if re.search(p, text, re.I)]
    # Keep content for evidential review, but delimit and label it explicitly.
    safe = f"<UNTRUSTED_EVIDENCE>\n{text}\n</UNTRUSTED_EVIDENCE>"
    return Inspection(safe_text=safe, suspicious=bool(matches), matches=matches)


def enforce_claim_scope(requested_claim_id: str, authorised_claim_id: str) -> None:
    if requested_claim_id != authorised_claim_id:
        raise PermissionError("Cross-claim access denied")


def assert_allowed_tool(tool_name: str) -> None:
    allowed = {"read_policy", "read_claim", "inspect_evidence", "read_risk_indicators"}
    if tool_name not in allowed:
        raise PermissionError(f"Tool '{tool_name}' is not allowed")
