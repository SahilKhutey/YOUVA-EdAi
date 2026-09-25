# YOUVA EdAI — Phase 4 Known Issues & Deferred Optimizations

**Version:** 1.0  
**Phase:** Phase 4 — Personalization Depth  

---

## 1. Known Non-Blocking Issues & Limitations

1. **Large Class Queue Scaling:**
   - In classes with 40–50 students, an unaggregated recommendation queue can overwhelm the educator.
   - *Status:* Mitigated in Phase 4 by grouping recommendations into 3 priority buckets (Urgent Reteach, Level Adjustments, Spaced Review). Full automated clustering deferred to Phase 7/8.
2. **Offline Data Sync on Slow Mobile Networks:**
   - In rural / 2G edge conditions, scratchpad stroke coordinates generate minor latency spikes if buffered improperly.
   - *Status:* Scoped for optimization in Phase 7 Scale Infrastructure.
3. **Non-Algebraic Curriculum Generalization:**
   - While the concept DAG operates cleanly on algebraic structures (equations, arithmetic), nonlinear subjects (geometry proofs, data interpretation) require graph schema extensions.
   - *Status:* Deferred to Phase 5 High School Expansion.

---

## 2. Explicitly Deferred Capabilities

- **Autonomous Reinforcement Learning (RL):** Deferred permanently until multi-classroom evidence justifies automated policy tuning.
- **Multimodal Video / Speech Generation:** Kept out of scope to preserve DPDP data minimization and avoid unvetted cloud latency.
- **Automated Graph Rewriting:** Graph mutations remain strictly manual and SME-gated.
