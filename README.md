# SchoolLedger QA Lab

A complete fictional school-finance application for learning and demonstrating junior-to-mid SDET skills. It includes a responsive dashboard, REST API, role-based permissions, validation, persistent local test data, audit evidence, automated API and UI tests, Postman, SQL exercises, GitHub Actions, Jenkins, Java/REST Assured, Selenium, Cypress, Python and interview practice.

The in-app **SDET Lab** adds an authenticated API console, unique test-data factory, release diagnostics, controlled latency/payment/dashboard faults, and a skills-evidence tracker.

No real student, employer, banking or customer information is used.

## Start the application

Requirements: Node.js 22 or later.

```powershell
node src/server.mjs
```

Open `http://127.0.0.1:4173`.

| Role | Username | Password | Access |
|---|---|---|---|
| Admin | `qa.admin` | `Admin123!` | All workflows and data reset |
| Accountant | `accountant` | `Account123!` | Students, invoices, payments and refunds |
| Viewer | `viewer` | `Viewer123!` | Read only |

These are deliberately public training credentials. Never copy this authentication design into a production application.

## Run the verified dependency-free API suite

```powershell
npm test
```

## Install and run Playwright/Newman

```powershell
npm install
npx playwright install chromium firefox
npm run test:ui
npm run postman
```

## Learning assets

- `docs/LEARNING_PATH.md` - four-sprint guided programme.
- `docs/TEST_PLAN.md` - risk-based scope and release criteria.
- `docs/MANUAL_TEST_CASES.md` - manual and exploratory scenarios.
- `docs/API_REFERENCE.md` - endpoints, roles and error contract.
- `docs/INTERVIEW_EVIDENCE.md` - what to explain in interviews.
- `postman/` - API collection and local environment.
- `sql/` - relational model and reconciliation queries.
- `tests/api/` - Node API integration tests.
- `tests/ui/` - Playwright critical journeys.
- `tests/cypress/` - secondary Cypress practice.
- `practice/java-sdet/` - REST Assured and Selenium examples.
- `practice/python/` - test-data integrity checks.

## Verified portfolio skills

| Area | Demonstrated skill | Evidence |
|---|---|---|
| API automation | Positive, negative, validation, authentication and RBAC tests | `tests/api/`, `postman/` |
| Postman/Newman | 18-request automated regression with 75 assertions | `evidence/newman/` |
| Playwright | Cross-browser critical journeys using fixtures and Page Objects | `tests/ui/fixtures.js`, `tests/ui/pages/` |
| Hybrid API/UI testing | Reusable API client for authentication, data reset and API-seeded UI verification | `tests/ui/api/school-ledger.api.js` |
| Test reporting clarity | Named `test.step` actions expose business intent and timing in HTML reports | `evidence/framework/Playwright-Test-Steps-Verified.png` |
| Test reliability | Isolated reset fixture, unique test data and web-first assertions | `tests/ui/` |
| Reporting | HTML, JUnit XML and JSON reports; trace, screenshot and video on failure | `playwright.config.js` |
| GitHub Actions | API, Newman and Playwright quality-gate jobs with downloadable artifacts | `.github/workflows/quality-gate.yml` |
| Jenkins | Windows-compatible pipeline for checkout, install, API and UI smoke stages | `Jenkinsfile` |
| Evidence management | CI success screens and downloadable report verification | `evidence/ci/`, `evidence/framework/` |

### Current verified results

- Postman runner: 75 passed, 0 failed.
- Newman CLI regression: 18 requests and 75 assertions, 0 failures.
- GitHub Actions: API, Postman/Newman and Playwright jobs passed.
- Jenkins: pipeline completed with `Finished: SUCCESS`.
- Playwright framework: reusable login/student Page Objects and automatic test-data reset fixture.
- Hybrid automation: API-created test data verified through the browser UI.
- Playwright reporting: named business-action steps verified in the HTML report.
- CI reports: HTML, JUnit XML and JSON artifacts retained for 14 days.

## Safe portfolio wording

After you have personally run, changed and explained the tests, you may say:

> Built a fictional school-finance QA lab with Playwright UI tests, API contract and negative tests, role-based access checks, Postman/Newman regression coverage, SQL reconciliation queries, and CI quality gates.

> Refactored Playwright tests with reusable fixtures and Page Objects, published HTML/JUnit/JSON evidence, and configured passing GitHub Actions and Jenkins pipelines.

> Added named Playwright test steps so CI reports clearly communicate business actions, assertions and execution timing.

> Built a reusable Playwright API client and combined fast API test-data setup with cross-browser UI verification.

Do not claim that it was production work or a confidential employer system.
