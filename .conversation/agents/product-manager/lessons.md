# Branchcut planning lessons

## 2026-11-11 — Reconcile schema and behavioral promises before delegation

- ID: branchcut-planning-001
- Agent: product-manager
- Task: Branchcut prompt readiness assessment
- Confidence: 0.80
- Tags: documentation, quality, merge, contracts

**Problem:** The supplied prompt requires dynamic overflow tracks but defines a closed TrackId union; its resolution API also leaves handling of newly revealed overlaps unspecified.

**Root cause:** Schema examples and later behavioral acceptance criteria are not fully aligned. A manager delegating them literally would give specialists incompatible contracts.

**Solution applied:** Recorded explicit proposed track and resolution contracts in tasks/plan.md before implementation. Independent Adam and Mei reviews identified the same two issues.

**Better solution:** Check each state-changing acceptance criterion against the types and completion/error states before assigning implementation.

**Prevention strategy:** Require tests for overflow-lane rendering and resolution-induced collisions, and block merge completion on unresolved conflicts or overlaps.

**Future recommendations:** Review contract consistency even when a prompt is detailed. Do not mistake specification review for executed application verification.

**References:** Source Sections 7.3–7.5; tasks/plan.md decisions 1 and 4–5. This is a preventive planning lesson, not a claim that an agent authored the source defects.

## 2026-11-11 — Distinguish explicit checklist requirements from chosen P1 scope

- ID: branchcut-planning-002
- Agent: product-manager
- Task: Branchcut prompt readiness assessment
- Confidence: 0.60
- Tags: documentation, quality, traceability

**Problem:** The first plan draft said the final checklist required deterministic summaries; it directly requires editing, while summaries are separately specified P1/Compare scope.

**Root cause:** The consolidation grouped two valid scope decisions under one inaccurate source justification.

**Solution applied:** Corrected the rationale after Mei's cross-review. Added Adam's explicit UI/default-author criteria and Mei's selected-origin/placement criteria.

**Better solution:** Cite each requirement's actual section rather than generalizing a checklist rationale across adjacent features.

**Prevention strategy:** Trace every “required by checklist” claim to a specific checklist entry during documentation review.

**Future recommendations:** Keep necessary implementation scope separate from claims about the exact wording of source acceptance criteria.

**References:** Source F9, Phase 5 and Section 9; tasks/plan.md scope paragraph; Mei cross-review.
