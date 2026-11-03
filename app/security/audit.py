import json, logging, time, uuid
logger = logging.getLogger("audit")

def audit_event(event_type: str, claim_id: str, details: dict) -> str:
    event_id = str(uuid.uuid4())
    logger.info(json.dumps({"event_id": event_id, "ts": time.time(), "event_type": event_type,
                            "claim_id": claim_id, "details": details}, default=str))
    return event_id
