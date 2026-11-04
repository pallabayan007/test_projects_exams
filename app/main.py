import logging

from fastapi import FastAPI, HTTPException
from app.config import settings
from app.models import ClaimRequest, TriageDecision
from app.agents.orchestrator import triage

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app=FastAPI(title="Agentic Claims Triage",version="0.1.0")
@app.get("/health")
async def health(): return {"status":"ok"}
@app.post("/v1/claims/triage",response_model=TriageDecision)
async def triage_claim(req: ClaimRequest):
    try: return await triage(req)
    except (KeyError,PermissionError,ValueError) as exc: raise HTTPException(status_code=400,detail=str(exc))
