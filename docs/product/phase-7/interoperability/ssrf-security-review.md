# YOUVA EdAI — Phase 7: SSRF Perimeter Security Review
## Real HTTP Execution Path Defense, Probe Vector Audits, and Hostname Allowlisting

---

## 1. Threat Profile: Server-Side Request Forgery (SSRF)

When an educational platform connects to school LMS endpoints, malicious users or compromised school admin accounts can attempt to point URLs toward internal infrastructure:
- Cloud metadata credentials (`http://169.254.169.254/latest/meta-data/`).
- Localhost internal management endpoints (`http://127.0.0.1:5432` or Redis).
- Private subnet databases (`http://10.0.0.5/admin`).

### Testing Requirement
> **SSRF protection must be tested against the actual HTTP execution path, not merely a regex URL validation helper.**

---

## 2. SSRF Perimeter Defense Engine (`SSRFGuard`)

Implemented in `phase7/models/lms_connector.py`, the `SSRFGuard` wraps all outbound socket requests with strict pre-flight and pre-connect checks:

```python
# Multi-Layer SSRF Perimeter Defense
1. Scheme Enforcement: Only https:// and http:// permitted (Blocks file://, gopher://, etc.)
2. Contract Allowlist Matching: Hostname must match allowedLmsHosts in tenant contract
3. Synchronous DNS Resolution: Resolves hostname to target IP before opening socket
4. IP Range Inspection: Checks resolved IP against prohibited CIDR ranges:
   - Loopback: 127.0.0.0/8, ::1
   - Link-Local / Cloud Metadata: 169.254.0.0/16, fe80::/10
   - Private RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
5. Redirect Interception: Re-evaluates target IP on every 301/302 HTTP redirect
```

---

## 3. Adversarial SSRF Probe Vector Test Results

| Probe ID | Attack Vector | Target Payload | Defense Reaction | Result |
|---|---|---|---|---|
| **SSRF-01** | Cloud Metadata Escape | `http://169.254.169.254/latest/meta-data/iam/` | Trapped by link-local IP filter; socket aborted | **BLOCKED** |
| **SSRF-02** | Localhost Enumeration | `http://127.0.0.1:6379/` (Internal Redis) | Trapped by loopback IP filter; socket aborted | **BLOCKED** |
| **SSRF-03** | Private Subnet Probe | `http://10.0.4.12:5432/` (PostgreSQL Primary) | Trapped by RFC 1918 CIDR filter; aborted | **BLOCKED** |
| **SSRF-04** | Non-Allowlisted Domain| `http://attacker-controlled-server.com/roster` | Fails contract hostname allowlist check | **BLOCKED** |
| **SSRF-05** | Protocol Smuggling | `file:///etc/passwd` | Fails HTTP/HTTPS scheme check; aborted | **BLOCKED** |

### Attestation
All 5 adversarial probe vectors were executed against the live HTTP connector in `test_lms_interoperability.py`. **100% of probes were fail-closed blocked with `SSRFSecurityViolationError`**.
