# Risk-based test plan

## Objective

Verify that SchoolLedger preserves access control and financial integrity across student, invoice, payment and refund workflows, while producing useful diagnostic and audit evidence.

## Highest risks

| Risk | Impact | Primary controls |
|---|---|---|
| Unauthorized financial write | High | Role matrix, missing/invalid token, direct API checks |
| Incorrect outstanding balance | High | Payment/refund lifecycle, dashboard reconciliation, SQL checks |
| Duplicate payment | High | Unique reference negative and concurrency testing |
| Overpayment or excessive refund | High | Boundary and state-transition tests |
| Invoice assigned to invalid student | Medium | Foreign-key and inactive-student validation |
| Untraceable change | Medium | Audit-event verification |
| Cross-browser workflow failure | Medium | Chromium and Firefox critical journeys |

## Test levels

- API integration: validation, authorization, contracts and state transitions.
- UI end-to-end: high-value user journeys only.
- Data: entity relationships, invariants and total reconciliation.
- Exploratory: usability, unexpected sequences and recovery behaviour.
- CI: smoke on pull request, broader regression and report publication.

## Out of scope

Real payment processing, production-grade authentication, email delivery, accessibility certification, load certification and real personal data.

## Entry criteria

- Server starts and `/api/health` returns 200.
- Seed data is available.
- test environment and credentials are documented.

## Exit criteria

- All P0 and P1 tests pass.
- No unresolved authorization or money-integrity defect.
- Dashboard totals reconcile with invoice records.
- Known flaky checks are owned and do not silently count as coverage.
- Release summary identifies tested scope and residual risks.
