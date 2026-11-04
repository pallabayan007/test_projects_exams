import logging
import hmac
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from app.config import settings
from app.models import ClaimRequest, TriageDecision
from app.agents.orchestrator import triage

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

app=FastAPI(title="Agentic Claims Triage",version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
basic_auth = HTTPBasic(auto_error=False)

@app.get("/health")
async def health(): return {"status":"ok"}

def require_basic_auth(
    credentials: Optional[HTTPBasicCredentials] = Depends(basic_auth),
) -> None:
    if not settings.api_username or not settings.api_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API authentication is not configured",
        )

    username = credentials.username if credentials is not None else ""
    password = credentials.password if credentials is not None else ""
    username_matches = hmac.compare_digest(
        username.encode("utf-8"), settings.api_username.encode("utf-8")
    )
    password_matches = hmac.compare_digest(
        password.encode("utf-8"), settings.api_password.encode("utf-8")
    )
    if not username_matches or not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Basic"},
        )

@app.post(
    "/v1/claims/triage",
    response_model=TriageDecision,
    dependencies=[Depends(require_basic_auth)],
)
async def triage_claim(req: ClaimRequest):
    try: return await triage(req)
    except (KeyError,PermissionError,ValueError) as exc: raise HTTPException(status_code=400,detail=str(exc))
