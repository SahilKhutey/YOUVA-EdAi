# YOUVA-EdAI: Learning Knowledge Cycle (LKC-0) Production Specification
**Document Version:** 1.0.0  
**Status:** Architecturally Frozen & Production Contract Established  
**Scope:** Cycle 0 / Integration-First Platform Foundation  
**Repository Context:** `SahilKhutey/YOUVA-EdAi`

---

## 1. Objective & Philosophy

LKC-0 establishes the canonical **Learning Knowledge Cycle** contract for YOUVA-EdAI without introducing a redundant, parallel "knowledge database." 

The existing repository already houses robust modules:
- `global-learning`
- `knowledge-graph`
- `learning-loop`
- `learning-engine`
- `content-intelligence`
- `verified-learning/knowledge`
- `learner-state`
- `teacher-ops`

LKC-0 serves as the unifying architectural foundation answering:
> *How is educational knowledge created, stored, governed, discovered, delivered, consumed, measured, and returned into the learning cycle?*

```
TEACHER
   │
   ▼
CREATE KNOWLEDGE
   │
   ▼
DRAFT ──► VALIDATE ──► REVIEW ──► PUBLISH
                                      │
                                      ▼
                             KNOWLEDGE DATABASE
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
                   STUDENT                         TEACHER
                      │                               │
                      ▼                               ▼
                    LEARN                           TEACH
                      │                               │
                      ▼                               ▼
                   PRACTICE                        MONITOR
                      │                               │
                      └───────────────┬───────────────┘
                                      ▼
                              LEARNING EVIDENCE
                                      │
                                      ▼
                                LEARNER STATE
                                      │
                                      ▼
                               PERSONALIZATION
                                      │
                                      ▼
                                NEXT KNOWLEDGE
                                      │
                                      └──────────────► STUDENT
```

---

## 2. Core Architectural Rules & Invariants

1. **One Canonical Knowledge Identity**:
   - Educational entities (Concepts, Lessons, Questions, Assessments, Resources) share a unified identity across curriculum, teacher authoring, student learning, AI, graph, and analytics representations.
2. **Decoupled Architecture**:
   $$\text{KNOWLEDGE} \neq \text{LEARNING STATE} \neq \text{LEARNING EVIDENCE}$$
   - **Knowledge**: What the material *is* (immutable per published version).
   - **Learning Evidence**: What the student *did* (timestamped, immutable event).
   - **Learner State**: What the student *knows* (probabilistic mastery estimate).
3. **Immutable Content Versioning**:
   - Edits to published content produce version $v+1$. Historical learner records remain permanently pinned to the version completed.
4. **AI Governed Boundary**:
   - AI generates, enriches, hints, and personalizes, but **never publishes directly to the database**. Human teacher review and quality gates are required.

---

## 3. Canonical Contracts Summary

All contracts are implemented in `backend/src/learning-knowledge-cycle/contracts/`:

- **KnowledgeObjectType**: `SUBJECT`, `COURSE`, `UNIT`, `TOPIC`, `CONCEPT`, `LESSON`, `EXPLANATION`, `EXAMPLE`, `WORKED_EXAMPLE`, `ACTIVITY`, `QUESTION`, `ASSESSMENT`, `RESOURCE`, `HINT`, `REMEDIATION`, `EXTENSION`.
- **KnowledgeObject**: Canonical identity with `id`, `tenantId`, `type`, `title`, `slug`, `status`, `currentVersion`, `learningObjectives`, `prerequisites`, `tags`.
- **KnowledgeVersion**: Content versioning with `id`, `knowledgeObjectId`, `version`, `content`, `contentHash`, `sourceType` (`TEACHER` | `AI` | `IMPORTED` | `SYSTEM`), `reviewStatus`.
- **KnowledgeRelation & KnowledgeRelationship**: Semantic edges (`PREREQUISITE`, `PART_OF`, `CONTAINS`, `RELATED_TO`, `BUILDS_ON`, `CONTRASTS_WITH`, `EXAMPLE_OF`, `ASSESSED_BY`, `REMEDIATED_BY`, `EXTENDS_TO`).
- **KnowledgeLearningEvent**: Telemetry events (`VIEWED`, `STARTED`, `COMPLETED`, `PRACTICED`, `ANSWERED`, `MASTERED`, `STRUGGLED`, `REQUESTED_HINT`, `REQUESTED_EXPLANATION`).

---

## 4. State Machines & Enforced Transitions

All state machines are implemented in `backend/src/learning-knowledge-cycle/state-machines/`:

### 4.1 Knowledge Publishing State Machine
- `DRAFT` $\to$ `IN_REVIEW` (Teacher submits)
- `IN_REVIEW` $\to$ `APPROVED` (Reviewer signs off)
- `IN_REVIEW` $\to$ `DRAFT` (Reviewer requests changes)
- `APPROVED` $\to$ `PUBLISHED` (System / Admin deploys)
- `PUBLISHED` $\to$ `ARCHIVED` (Admin / Teacher retires)
- *Strict Rule*: Direct `DRAFT` $\to$ `PUBLISHED` transition is blocked unless explicit administrative bypass is active.

### 4.2 Version Lifecycle State Machine
- `DRAFT` $\to$ `PENDING_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED`.
- Once `PUBLISHED`, the version record is frozen and immutable.

---

## 5. Subsystem Boundaries & Integration Map

All boundaries are implemented in `backend/src/learning-knowledge-cycle/boundaries/`:

1. **Evidence Boundary** (`IEvidenceBoundary`): Ingests `KnowledgeLearningEvent` into the existing `learning-loop/evidence` processor.
2. **Learner-State Boundary** (`ILearnerStateBoundary`): Updates BKT / cognitive twin state without mutating canonical knowledge.
3. **AI Boundary** (`IAiBoundary`, `AiSafetyGuard`): Enforces that AI-generated versions carry `sourceType: 'AI'` and cannot be published without human approval.
4. **Search Boundary** (`ISearchBoundary`): Integrates with `content-intelligence` returning canonical Knowledge IDs.
5. **Tenant & Security Boundary** (`TenantSecurityBoundary`): Enforces tenant isolation and role-based permissions (`STUDENT`, `TEACHER`, `REVIEWER`, `ADMIN`).

### Integration Mapping Table

| Existing Repository Module | Canonical Role in LKC | LKC-0 Touchpoint |
| :--- | :--- | :--- |
| `backend/src/knowledge-graph/` | Graph representation & topological sorting | Consumes `KnowledgeRelationship` |
| `backend/src/verified-learning/knowledge/` | Empirical pedagogical research claims | Distinct research claims engine |
| `backend/src/learning-loop/` | Evidence ingestion & policy gating | Consumes `KnowledgeLearningEvent` |
| `backend/src/learner-state/` | Probabilistic mastery (BKT) | Updates Layer B mastery |
| `backend/src/content-intelligence/` | Semantic search & embeddings | Implements `ISearchBoundary` |
| `backend/src/teacher-ops/` | Teacher dashboard & assignments | Consumes Teacher API contract |

---

## 6. LKC-0 Acceptance Criteria Status

- [x] Every knowledge object has a stable identity (`KnowledgeObject.id`)
- [x] Every published object has an immutable version (`KnowledgeVersion.version`)
- [x] Teacher ownership is enforceable (`createdBy`, `authorId`)
- [x] Tenant isolation is enforceable (`tenantId` on objects, relations, events)
- [x] Draft/published states are explicit (`status`, `reviewStatus`)
- [x] Knowledge relationships have a canonical representation (`KnowledgeRelation`)
- [x] Student access resolves published knowledge only (`status === 'PUBLISHED'`)
- [x] Student activity can reference knowledge + version (`knowledgeId`, `knowledgeVersion`)
- [x] Learning evidence can reference knowledge (`KnowledgeLearningEvent`)
- [x] Learner-state can consume evidence (`LearnerStateBoundary`)
- [x] AI can consume canonical knowledge (`AiBoundary`)
- [x] AI-generated content cannot silently become canonical (`sourceType === 'AI'`, mandatory review)
- [x] Search returns canonical knowledge IDs (`SearchBoundary`)
- [x] Existing knowledge-graph functionality can consume the contract
- [x] Existing learning-loop functionality can consume the contract
- [x] Existing teacher-ops functionality can consume the contract
- [x] No duplicate canonical knowledge model is introduced

---

## 7. Roadmap to Subsequent Cycles

- **LKC-0 (Current)**: Canonical contracts, types, state machines, boundaries, integration maps, unit test verification. *(Complete & Frozen)*
- **LKC-1**: Production Database Implementation (Prisma schema integration into existing 82KB schema, migrations, repositories, controllers, seed data).
- **LKC-2**: Full Teacher UI & Authoring Studio.
- **LKC-3**: Full Student Learning, Exploration & Practice UI.
- **LKC-4**: Closed-loop Adaptive Recommendations & Teacher Intervention Analytics.
