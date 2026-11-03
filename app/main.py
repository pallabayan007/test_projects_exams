from fastapi import FastAPI, HTTPException
from app.models import ClaimRequest, TriageDecision
from app.agents.orchestrator import triage
app=FastAPI(title="Agentic Claims Triage",version="0.1.0")
@app.get("/health")
async def health(): return {"status":"ok"}
@app.post("/v1/claims/triage",response_model=TriageDecision)
async def triage_claim(req: ClaimRequest):
    try: return await triage(req)
    except (KeyError,PermissionError,ValueError) as exc: raise HTTPException(status_code=400,detail=str(exc))
