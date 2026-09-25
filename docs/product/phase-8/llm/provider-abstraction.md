# YOUVA EdAI — Phase 8: Multi-Provider LLM Gateway Architecture
## Multi-Tiered AI Routing, Vendor Redundancy, and Deterministic Offline Degradation

---

## 1. Architectural Strategy & Vendor Independence

YOUVA EdAI prevents vendor lock-in and mitigates single-point-of-failure vulnerabilities through an abstracted, multi-tiered LLM Provider Gateway (`llm_provider_gateway.py`).

The architecture establishes three prioritized tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: PRIMARY LLM (Gemini 2.5 Flash / Flash Lite)                    │
│ Low-latency, high-accuracy generative reasoning and hints.             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Connection Timeout or 5xx Error
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: SECONDARY BACKUP PROVIDER (Anthropic Claude 3.5 Sonnet / Azure)│
│ Hot-standby fallback with equivalent structured JSON output schemas.  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Complete External AI Outage
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 3: DETERMINISTIC CURRICULUM CACHE (Local Pre-Computed Hints)      │
│ 100% offline, zero-latency pedagogical guidance. Zero LLM dependency.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Universal Safety Pipeline Invariant

A non-negotiable architectural invariant dictates:
> **Primary, Secondary, and Deterministic fallbacks must all pass through the identical safety sanitization, schema validation, and authorization governance gates.**

Switching providers does not bypass or alter any security or pedagogical policy.

---

## 3. The Core Invariant: LLM Outage \(\ne\) Safety Outage

External LLM APIs are subject to internet routing disruptions, regional outages, or upstream quota cuts. Under no circumstances may an AI outage compromise the student safety escalation path.

```python
def is_safety_escalation_functional(self) -> bool:
    """
    CRITICAL INVARIANT: LLM Outage != Safety Escalation Outage.
    Safety operations remain 100% operational regardless of AI gateway status.
    """
    return self.safety_escalation_available
```

The safety reporting and distress escalation pipeline operates on an independent, non-LLM, high-availability relational event queue, ensuring that safeguarding reports are never dropped or delayed by AI downtime.
