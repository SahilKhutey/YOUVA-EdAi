# YOUVA EdAI — Phase 8: AI Model Sandbox Specification
## Ingress Sanitization, Output Schema Containment, and Tool Boundary Isolation

---

## 1. Architectural Scope

The AI Model Sandbox establishes an isolated runtime containment zone around all large language model interactions within YOUVA EdAI. Its core mandate is to prevent:
1. Adversarial prompt injection attacks from students or external actors.
2. Uncontrolled execution of arbitrary model outputs.
3. Privilege escalation or unauthorized tool invocations.
4. Cross-tenant data leakage.

```
                          SANDBOX PIPELINE
                                 │
     ┌───────────────────────────▼───────────────────────────┐
     │ 1. INGRESS: Server-Side Prompt Sanitization           │
     │    - Regex pattern matching against jailbreak vectors │
     │    - Stripping executable control sequences           │
     └───────────────────────────┬───────────────────────────┘
                                 │ Clean Prompt
                                 ▼
     ┌───────────────────────────────────────────────────────┐
     │ 2. MODEL EXECUTION (LLM Provider Gateway)             │
     └───────────────────────────┬───────────────────────────┘
                                 │ Raw Output
                                 ▼
     ┌───────────────────────────────────────────────────────┐
     │ 3. EGRESS: Output Schema Validation                   │
     │    - Code-fence stripping                             │
     │    - JSON schema conformance check                    │
     │    - Forbidden action keyword filter                  │
     └───────────────────────────┬───────────────────────────┘
                                 │ Validated Structured JSON
                                 ▼
     ┌───────────────────────────────────────────────────────┐
     │ 4. TOOL ISOLATION: Tenant & Tool Whitelist Guard      │
     │    - Verify caller tenant matches target tenant       │
     │    - Verify requested tool in capability whitelist    │
     └───────────────────────────────────────────────────────┘
```

---

## 2. Ingress Sanitization Specifications

All user input is treated as untrusted data. The ingress filter intercepts 14 distinct adversarial pattern categories:

```python
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s+prompt",
    r"developer\s+mode",
    r"override\s+(policy|safety|guardrails)",
    r"certify\s+(my\s+)?mastery",
    r"close\s+safety(\s+case)?",
    r"grant\s+(me\s+)?admin",
    r"reveal\s+(api\s+)?key",
    r"disregard\s+(the\s+)?rules",
    r"jailbreak",
    r"eval\s*\(",
    r"exec\s*\(",
    r"__import__",
    r"os\.system",
    r"subprocess\."
]
```

Detection of any matching substring immediately raises `PromptInjectionDetectedError`.

---

## 3. Egress Output Schema Enforcement

Models are never permitted to emit raw unstructured markdown directly to downstream execution systems. Model responses must conform to `schemas/structured_ai_output.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StructuredAIOutput",
  "type": "object",
  "required": ["action", "target", "newValue", "confidence", "reasonCode"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["GENERATE_HINT", "DISCLOSE_HINT_TIER", "RECOMMEND_ACTIVITY", "ADJUST_DIFFICULTY"]
    },
    "target": { "type": "string" },
    "newValue": {},
    "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
    "reasonCode": { "type": "string" }
  },
  "additionalProperties": false
}
```

Any output failing JSON parsing or schema validation raises `SchemaValidationFailedError`.

---

## 4. Tool Invocation & Multi-Tenant Boundary

The sandbox inspects every requested tool invocation before dispatching to backend services:
- **Whitelist Check:** The requested tool must reside in the capability's `allowed_tools` list.
- **Tenant Isolation Check:** The calling tenant identifier must strictly match the target tenant identifier (`caller_tenant_id == target_tenant_id`).

Violations raise `SandboxEscapeAttemptError` and terminate the session.
