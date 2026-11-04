import { useState, type FormEvent } from "react";

type ClaimDocument = {
  document_id: string;
  document_type: string;
  text: string;
};

type ClaimRequest = {
  claim_id: string;
  policy_id: string;
  loss_type: string;
  loss_date: string;
  claim_amount: number;
  customer_statement: string;
  documents: ClaimDocument[];
};

type TriageDecision = {
  claim_id: string;
  coverage_assessment: string;
  recommended_action: string;
  rationale: string[];
  missing_evidence: string[];
  citations: string[];
  confidence: number;
  human_approval_required: boolean;
  prohibited_actions: string[];
  security_events: string[];
};

function isTriageDecision(value: unknown): value is TriageDecision {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "claim_id" in value &&
    typeof value.claim_id === "string" &&
    "coverage_assessment" in value &&
    typeof value.coverage_assessment === "string" &&
    "recommended_action" in value &&
    typeof value.recommended_action === "string" &&
    "rationale" in value &&
    Array.isArray(value.rationale) &&
    value.rationale.every((item: unknown) => typeof item === "string") &&
    "missing_evidence" in value &&
    Array.isArray(value.missing_evidence) &&
    value.missing_evidence.every((item: unknown) => typeof item === "string") &&
    "citations" in value &&
    Array.isArray(value.citations) &&
    value.citations.every((item: unknown) => typeof item === "string") &&
    "confidence" in value &&
    typeof value.confidence === "number" &&
    "human_approval_required" in value &&
    typeof value.human_approval_required === "boolean" &&
    "prohibited_actions" in value &&
    Array.isArray(value.prohibited_actions) &&
    "security_events" in value &&
    Array.isArray(value.security_events)
  );
}

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/v1/claims/triage";

const initialForm: ClaimRequest = {
  claim_id: "",
  policy_id: "",
  loss_type: "escape_of_water",
  loss_date: "",
  claim_amount: 0,
  customer_statement: "",
  documents: [{ document_id: "", document_type: "", text: "" }],
};

function encodeBasicCredentials(username: string, password: string): string {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${btoa(binary)}`;
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getErrorMessage(body: unknown, status: number): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }
  if (
    typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    Array.isArray(body.detail)
  ) {
    return body.detail
      .map((issue: { loc?: string[]; msg?: string }) => {
        const field = issue.loc?.slice(1).join(".");
        return field ? `${field}: ${issue.msg}` : issue.msg;
      })
      .join(" ");
  }
  return `The API returned an error (${status}).`;
}

function App() {
  const [form, setForm] = useState<ClaimRequest>(initialForm);
  const [amountInput, setAmountInput] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<TriageDecision | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof ClaimRequest>(
    key: K,
    value: ClaimRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateDocument(
    index: number,
    key: keyof ClaimDocument,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      documents: current.documents.map((document, documentIndex) =>
        documentIndex === index
          ? { ...document, [key]: value }
          : document,
      ),
    }));
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    const enteredDocuments = form.documents.filter((document) =>
      document.document_id.trim() ||
      document.document_type.trim() ||
      document.text.trim(),
    );
    if (
      enteredDocuments.some(
        (document) =>
          !document.document_id.trim() || !document.document_type.trim(),
      )
    ) {
      setError("Each evidence document needs both a reference and a document type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: encodeBasicCredentials(username, password),
        },
        body: JSON.stringify({
          ...form,
          claim_amount: Number(amountInput),
          documents: enteredDocuments,
        }),
      });

      const responseBody: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getErrorMessage(responseBody, response.status));
      }

      if (!isTriageDecision(responseBody)) {
        throw new Error("The API returned an unexpected assessment response.");
      }
      setResult(responseBody);
    } catch (submitError) {
      setError(
        submitError instanceof TypeError
          ? "Could not reach the API. Check that the Python service is running and CORS is enabled for this UI."
          : submitError instanceof Error
            ? submitError.message
            : "The claim could not be assessed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Claims Desk home">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>
            <strong>northstar</strong>
            <small>CLAIMS DESK</small>
          </span>
        </a>

        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a className="nav-item active" href="#assessment">
            <span className="nav-icon" aria-hidden="true">
              ▤
            </span>
            Claim assessment
          </a>
          <span className="nav-item muted" aria-disabled="true">
            <span className="nav-icon" aria-hidden="true">
              ◷
            </span>
            Review queue
            <span className="nav-count">—</span>
          </span>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-indicator">
            <span className="status-dot" />
            <span>Assessment workspace</span>
          </div>
          <p>Recommendations support handler review. They do not settle claims.</p>
        </div>
      </aside>

      <main className="main-content" id="assessment">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Claims</span>
            <span aria-hidden="true">/</span>
            <strong>New assessment</strong>
          </div>
          <div className="topbar-right">
            <span className="secure-label">
              <span aria-hidden="true">◈</span> Secure workspace
            </span>
            <span className="avatar" aria-label="Handler">H</span>
          </div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow">CLAIMS OPERATIONS</div>
              <h1>Claim assessment</h1>
              <p>
                Review the information provided and request a guided triage
                recommendation.
              </p>
            </div>
            <div className="step-indicator">
              <span className="step-number">01</span>
              <span>CLAIM DETAILS</span>
              <span className="step-divider" />
              <span className={result ? "step-number complete" : "step-number"}>
                02
              </span>
              <span className={result ? "step-label complete" : "step-label"}>
                ASSESSMENT
              </span>
            </div>
          </section>

          <div className="content-grid">
            <form className="assessment-form" onSubmit={submitClaim}>
              <section className="card">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">
                    01
                  </span>
                  <div>
                    <h2>Claim information</h2>
                    <p>Enter the core details from the claim record.</p>
                  </div>
                </div>

                <div className="field-grid">
                  <label className="field">
                    <span>Claim reference <b>*</b></span>
                    <input
                      required
                      pattern="CLM-[A-Z0-9-]+"
                      title="Use the format CLM- followed by letters, numbers, or hyphens."
                      placeholder="e.g. CLM-001"
                      value={form.claim_id}
                      onChange={(event) =>
                        updateField("claim_id", event.target.value.toUpperCase())
                      }
                    />
                    <small>Format: CLM- followed by the claim number</small>
                  </label>
                  <label className="field">
                    <span>Policy reference <b>*</b></span>
                    <input
                      required
                      placeholder="e.g. POL-001"
                      value={form.policy_id}
                      onChange={(event) =>
                        updateField("policy_id", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Loss type <b>*</b></span>
                    <input
                      required
                      placeholder="e.g. escape_of_water"
                      value={form.loss_type}
                      onChange={(event) =>
                        updateField("loss_type", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Date of loss <b>*</b></span>
                    <input
                      required
                      type="date"
                      value={form.loss_date}
                      onChange={(event) =>
                        updateField("loss_date", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Claimed amount <b>*</b></span>
                    <div className="input-prefix">
                      <span>£</span>
                      <input
                        required
                        type="number"
                        min="0"
                        max="10000000"
                        step="0.01"
                        placeholder="0.00"
                        value={amountInput}
                        onChange={(event) => {
                          setAmountInput(event.target.value);
                          updateField(
                            "claim_amount",
                            event.target.value === "" ? 0 : Number(event.target.value),
                          );
                        }}
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="card">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">
                    02
                  </span>
                  <div>
                    <h2>Customer statement</h2>
                    <p>Capture the customer's description of what happened.</p>
                  </div>
                </div>
                <label className="field">
                  <span>Incident description <b>*</b></span>
                  <textarea
                    required
                    maxLength={20000}
                    rows={4}
                    placeholder="Describe the incident in the customer's own words..."
                    value={form.customer_statement}
                    onChange={(event) =>
                      updateField("customer_statement", event.target.value)
                    }
                  />
                  <small className="character-count">
                    {form.customer_statement.length.toLocaleString()} / 20,000
                    characters
                  </small>
                </label>
              </section>

              <section className="card">
                <div className="section-heading section-heading-between">
                  <div className="section-heading">
                    <span className="section-icon" aria-hidden="true">
                      03
                    </span>
                    <div>
                      <h2>Supporting evidence</h2>
                      <p>Add supplied documents for consideration.</p>
                    </div>
                  </div>
                  <button
                    className="button button-secondary add-document"
                    type="button"
                    onClick={() =>
                      updateField("documents", [
                        ...form.documents,
                        { document_id: "", document_type: "", text: "" },
                      ])
                    }
                  >
                    <span aria-hidden="true">+</span> Add document
                  </button>
                </div>
                <div className="documents-list">
                  {form.documents.map((document, index) => (
                    <div className="document-entry" key={index}>
                      <div className="document-entry-heading">
                        <span className="document-chip">DOCUMENT {index + 1}</span>
                        {form.documents.length > 1 && (
                          <button
                            className="text-button"
                            type="button"
                            onClick={() =>
                              updateField(
                                "documents",
                                form.documents.filter(
                                  (_, documentIndex) => documentIndex !== index,
                                ),
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>Document reference</span>
                          <input
                            placeholder="e.g. DOC-1"
                            value={document.document_id}
                            onChange={(event) =>
                              updateDocument(index, "document_id", event.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Document type</span>
                          <input
                            placeholder="e.g. repair_estimate"
                            value={document.document_type}
                            onChange={(event) =>
                              updateDocument(index, "document_type", event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <label className="field document-text">
                        <span>Extracted text or summary</span>
                        <textarea
                          maxLength={40000}
                          rows={3}
                          placeholder="Add relevant document text..."
                          value={document.text}
                          onChange={(event) =>
                            updateDocument(index, "text", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card credentials-card">
                <div className="section-heading">
                  <span className="section-icon auth-icon" aria-hidden="true">
                    ◈
                  </span>
                  <div>
                    <h2>API connection</h2>
                    <p>Credentials are used for this request and not saved.</p>
                  </div>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>API username <b>*</b></span>
                    <input
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>API password <b>*</b></span>
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                </div>
                <div className="api-endpoint">
                  <span className="endpoint-method">POST</span>
                  <code>{API_URL}</code>
                </div>
              </section>

              {error && (
                <div className="error-banner" role="alert">
                  <span className="error-symbol" aria-hidden="true">!</span>
                  <div>
                    <strong>Assessment could not be completed</strong>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <p><b>*</b> Required fields</p>
                <button
                  className="button button-primary submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Assessing claim...
                    </>
                  ) : (
                    <>
                      Get assessment <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <aside className="result-column" aria-live="polite">
              {result ? (
                <section className="card result-card">
                  <div className="result-topline">
                    <span className="result-kicker">TRIAGE RESULT</span>
                    <span className="result-check" aria-hidden="true">✓</span>
                  </div>
                  <h2>{humanize(result.recommended_action)}</h2>
                  <p className="result-claim">{result.claim_id}</p>
                  <div className="result-divider" />
                  <div className="result-metric">
                    <span>Confidence</span>
                    <strong>{Math.round(result.confidence * 100)}%</strong>
                  </div>
                  <div
                    className="confidence-track"
                    role="img"
                    aria-label={`Confidence ${Math.round(result.confidence * 100)} percent`}
                  >
                    <span style={{ width: `${Math.min(100, Math.max(0, result.confidence * 100))}%` }} />
                  </div>

                  <div className="assessment-summary">
                    <span className="summary-label">COVERAGE ASSESSMENT</span>
                    <p>{result.coverage_assessment}</p>
                  </div>

                  <div className="approval-notice">
                    <span aria-hidden="true">◎</span>
                    <div>
                      <strong>Handler review required</strong>
                      <p>
                        {result.human_approval_required
                          ? "This recommendation is not a settlement decision."
                          : "Review the recommendation before taking any action."}
                      </p>
                    </div>
                  </div>

                  {result.rationale.length > 0 && (
                    <ResultList title="RATIONALE" items={result.rationale} />
                  )}
                  {result.missing_evidence.length > 0 && (
                    <ResultList
                      title="EVIDENCE TO REQUEST"
                      items={result.missing_evidence.map(humanize)}
                      tone="warning"
                    />
                  )}
                  {result.security_events.length > 0 && (
                    <ResultList
                      title="SECURITY FLAGS"
                      items={result.security_events}
                      tone="danger"
                    />
                  )}
                  {result.citations.length > 0 && (
                    <div className="result-list">
                      <h3>SOURCE REFERENCES</h3>
                      <div className="citation-list">
                        {result.citations.map((citation) => (
                          <span className="citation" key={citation}>{citation}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                <section className="card empty-result">
                  <div className="empty-illustration" aria-hidden="true">
                    <span className="empty-document" />
                    <span className="empty-check">✓</span>
                  </div>
                  <h2>Your assessment will appear here</h2>
                  <p>
                    Complete the claim details and submit to receive a
                    recommendation from the triage service.
                  </p>
                  <div className="empty-divider" />
                  <div className="empty-detail">
                    <span className="empty-detail-icon" aria-hidden="true">i</span>
                    <span>All recommendations require a human handler review.</span>
                  </div>
                </section>
              )}

              <section className="principle-card">
                <span className="principle-icon" aria-hidden="true">✳</span>
                <div>
                  <strong>People make the decisions</strong>
                  <p>
                    This tool supports assessment only. It cannot approve
                    payment, decline a claim, or bypass handler review.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <footer className="page-footer">
            <span>Claims Desk <span aria-hidden="true">·</span> Assessment workspace</span>
            <span>Secure connection recommended</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function ResultList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className={`result-list ${tone}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
