"""
YOUVA-EdAI — Phase 8: AI Model Sandbox & Prompt Injection Defenses (P8.12, P8.13)
Enforces:
1. Server-Side Prompt Injection Barrier (treats all prompt text as untrusted data).
2. Strict JSON Schema Validation on Model Outputs (prevents unvalidated execution).
3. Sandbox Escape & Tool Invocation Boundary Defense.
"""

import json
from pathlib import Path
import re
from typing import Any, Dict, List, Optional
import jsonschema

OUTPUT_SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "structured_ai_output.schema.json"

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


class PromptInjectionDetectedError(SecurityError if "SecurityError" in dir(__builtins__) else PermissionError):
    """Raised when adversarial prompt injection patterns are detected in model inputs."""
    pass


class SchemaValidationFailedError(ValueError):
    """Raised when model response fails formal JSON schema validation."""
    pass


class SandboxEscapeAttemptError(PermissionError):
    """Raised when a model attempts to escape its sandbox or invoke unauthorized tool actions."""
    pass


class AIModelSandbox:
    """
    Guarantees that model inputs and outputs are strictly contained and validated.
    """

    def __init__(self, schema_path: Optional[Path] = None):
        self.schema_path = schema_path or OUTPUT_SCHEMA_PATH
        with open(self.schema_path, "r", encoding="utf-8") as f:
            self.output_schema = json.load(f)

    def sanitize_input_prompt(self, user_prompt: str) -> str:
        """
        Validates user/student prompt against known injection vectors.
        Raises PromptInjectionDetectedError if adversarial pattern detected.
        """
        if not user_prompt or not isinstance(user_prompt, str):
            return ""

        lower_text = user_prompt.lower()
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, lower_text, re.IGNORECASE):
                raise PromptInjectionDetectedError(
                    f"Adversarial prompt injection pattern detected: '{pattern}' in input"
                )

        return user_prompt.strip()

    def validate_and_parse_output(self, raw_model_response: str) -> Dict[str, Any]:
        """
        Parses and schema-validates raw LLM response.
        Strips markdown code fences if present.
        """
        if not raw_model_response or not isinstance(raw_model_response, str):
            raise SchemaValidationFailedError("Model response was empty or non-string")

        cleaned = raw_model_response.strip()
        # Clean common markdown code wrappers
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise SchemaValidationFailedError(f"Model output is not valid JSON: {e}") from e

        # Check for forbidden escaped actions
        action = parsed.get("action")
        if action in ("MODIFY_MASTERY", "MODIFY_CONSENT", "MODIFY_ROLE", "CLOSE_SAFETY_CASE"):
            raise SandboxEscapeAttemptError(
                f"Model response attempted forbidden autonomous action: {action}"
            )

        # Validate schema
        try:
            jsonschema.validate(instance=parsed, schema=self.output_schema)
        except jsonschema.ValidationError as e:
            raise SchemaValidationFailedError(f"Model output schema validation failed: {e.message}") from e

        return parsed

    def verify_tool_invocation(
        self,
        requested_tool: str,
        allowed_tools: List[str],
        caller_tenant_id: str,
        target_tenant_id: Optional[str] = None
    ) -> bool:
        """
        Enforces tool invocation boundary within the active tenant and allowed whitelist.
        """
        if requested_tool not in allowed_tools:
            raise SandboxEscapeAttemptError(
                f"Tool [{requested_tool}] is not in allowed sandbox tools: {allowed_tools}"
            )

        if target_tenant_id and target_tenant_id != caller_tenant_id:
            raise SandboxEscapeAttemptError(
                f"Cross-tenant tool call prohibited. Caller [{caller_tenant_id}] cannot target [{target_tenant_id}]"
            )

        return True
