# Manual test cases

Record evidence for every execution. Extend this set with boundaries and exploratory observations.

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| AUTH-01 | P0 | Admin signs in with valid credentials | Overview opens; Admin identity is shown |
| AUTH-02 | P0 | Submit an invalid password | 401-style error appears without exposing account details |
| AUTH-03 | P0 | Call dashboard API without a token | 401 `UNAUTHENTICATED` contract |
| ROLE-01 | P0 | Viewer attempts `POST /api/students` | 403 `FORBIDDEN`; data is unchanged |
| ROLE-02 | P1 | Accountant opens QA Practice | Reset control is hidden |
| STU-01 | P1 | Create a student with valid required fields | Record appears and audit event is created |
| STU-02 | P1 | Create a student with malformed email | Field-level 422 validation error |
| STU-03 | P1 | Reuse an existing guardian email | 409 duplicate error |
| STU-04 | P2 | Search by partial name, grade and email | Only matching records appear |
| INV-01 | P0 | Create invoice for active student | Correct amount, balance and status |
| INV-02 | P1 | Create invoice for inactive student | Validation failure; no invoice created |
| INV-03 | P1 | Create invoice with past due date and no payment | Status becomes overdue |
| PAY-01 | P0 | Record valid partial payment | Paid and outstanding values update; status partial |
| PAY-02 | P0 | Pay remaining balance | Outstanding becomes zero; status paid |
| PAY-03 | P0 | Pay more than outstanding | 422; invoice remains unchanged |
| PAY-04 | P0 | Reuse payment reference | 409; only one payment exists |
| REF-01 | P0 | Refund part of completed payment | Invoice paid value decreases and status recalculates |
| REF-02 | P0 | Refund more than refundable amount | 422; financial values unchanged |
| DASH-01 | P0 | Compare dashboard totals with invoices | Billed - collected = outstanding |
| AUD-01 | P1 | Complete a successful write action | Audit records actor, action, entity and time |
| RESET-01 | P1 | Admin resets data | Original deterministic seed is restored |
| LAB-01 | P1 | Run diagnostics with normal configuration | All checks pass and recommendation is GO |
| LAB-02 | P0 | Enable stale dashboard fault and run diagnostics | Reconciliation fails and recommendation is NO-GO |
| LAB-03 | P1 | Enable payment-service fault and submit payment | 503 controlled error; invoice data is unchanged |
| LAB-04 | P1 | Configure 1000 ms latency and use API console | Measured duration increases and UI remains usable |
| LAB-05 | P1 | Viewer attempts to configure faults directly through API | 403; configuration remains unchanged |

## Exploratory charters

1. Explore invoice and payment state changes using unusual order, date and amount combinations for 30 minutes.
2. Explore role boundaries through UI hiding and direct API calls for 30 minutes.
3. Explore error recovery after invalid JSON, network interruption and repeated submission for 30 minutes.
