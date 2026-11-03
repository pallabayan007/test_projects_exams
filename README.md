# Agentic Claims Triage using OpenAI

Reference implementation for an insurance claims triage agent. It uses the OpenAI Responses API, bounded specialist agents, deterministic insurance rules, read-only tools, prompt-injection checks, structured outputs, audit events, and a mandatory human decision boundary.

## Architecture

- Claims Orchestrator: invokes bounded specialists and synthesises a recommendation.
- Policy Agent: finds relevant clauses from an allowlisted policy repository.
- Evidence Agent: extracts and validates supplied claim evidence.
- Claims Data Agent: reads the current claim only.
- Risk Agent: consumes approved deterministic indicators; it does not accuse customers of fraud.
- Rules Engine: policy-active checks, thresholds, evidence requirements, and mandatory referrals.
- Human Boundary: settlement, decline, fraud escalation, bank changes, and exceptions are never executed by the agent.

## Run

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
uvicorn app.main:app --reload
```

Submit the supplied example:

```bash
curl -X POST http://localhost:8000/v1/claims/triage \
  -H 'Content-Type: application/json' \
  --data @app/data/example_request.json
```

Run tests:

```bash
pytest -q
```

## Production hardening still required

Replace local JSON repositories with authorised policy/claims APIs and a claim-filtered retrieval service. Add Entra/workload identity, private connectivity, malware scanning, DLP, durable audit storage, SIEM integration, rate limits, secrets management, model evaluation, red-team tests, and formal insurance/legal approval.
# test_projects_exams
# test_projects_exams
