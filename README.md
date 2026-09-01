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

### Smoke and regression selection

- `npm run test:ui:smoke`: two login checks in Chromium, selected with `@smoke`; used by Jenkins.
- `npm run test:ui:regression`: all ten scenarios across Chromium and Firefox (20 executions), selected with `@regression`; used by GitHub Actions.
- Smoke tests also carry `@regression`, so the full suite retains them. Add `@regression` to new scenarios to include them in the CI selection.
- Verified evidence: [Jenkins smoke selection](evidence/framework/Jenkins-Tagged-Smoke.png), [Jenkins build 4 success](evidence/framework/Jenkins-Tagged-Smoke-Success.png), and [GitHub Actions regression success](evidence/framework/Tagged-Regression-CI-Success.png).

### Project references

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
| Accessibility testing | Accessible-name, ARIA state and keyboard-navigation checks that detected and verified a password-label defect | `tests/ui/accessibility.spec.js` |
| Mobile testing | Dedicated Pixel 5 project covering viewport overflow, collapsed navigation and mobile Students access | `tests/ui/mobile-responsive.spec.js` |
| Test reporting clarity | Named `test.step` actions expose business intent and timing in HTML reports | `evidence/framework/Playwright-Test-Steps-Verified.png` |
| Test reliability | Isolated reset fixture, unique test data and web-first assertions | `tests/ui/` |
| Resilience testing | Mocked JSON 503 and non-JSON 502 login failures with successful same-page retry against the real API | `tests/ui/network-error-handling.spec.js` |
| Reporting | HTML, JUnit XML and JSON reports; trace, screenshot and video on failure | `playwright.config.js` |
| GitHub Actions | API and Newman gates plus parallel Chromium, Firefox and Pixel 5 Playwright jobs with isolated artifacts | `.github/workflows/quality-gate.yml` |
| CI matrix design | Three independent Playwright projects, selective browser installation, `fail-fast: false` and reproducible `npm ci` installs | `evidence/ci-matrix/` |
| CI efficiency and security | Branch-scoped triggers, superseded-run cancellation, npm caching and read-only workflow permissions | `evidence/ci-efficiency/` |
| Jenkins | Windows-compatible pipeline for checkout, install, API and UI smoke stages | `Jenkinsfile` |
| Suite selection | Tagged Chromium smoke checks and full cross-browser regression, verified in separate CI systems | `package.json`, `tests/ui/`, `evidence/framework/Jenkins-Tagged-Smoke.png` |
| Git collaboration | Feature branch, reviewed pull request, six passing checks, conflict-free merge and local fast-forward sync | `evidence/workflow/` |
| Evidence management | CI success screens and downloadable report verification | `evidence/ci/`, `evidence/framework/` |

### Current verified results

- Postman runner: 75 passed, 0 failed.
- Newman CLI regression: 18 requests and 75 assertions, 0 failures.
- GitHub Actions: API, Postman/Newman and Playwright jobs passed.
- Parallel CI matrix: Chromium, Firefox and mobile Chromium reported independently; pull request #5 completed 10 checks successfully.
- CI optimization: duplicate feature-branch push checks were removed; pull request #7 completed the expected five checks successfully.
- Jenkins: pipeline completed with `Finished: SUCCESS`.
- Playwright framework: reusable login/student Page Objects and automatic test-data reset fixture.
- Hybrid automation: API-created test data verified through the browser UI.
- Accessibility automation: semantic labels, ARIA state and keyboard interaction verified after detecting and fixing a real defect.
- Mobile automation: two Pixel 5 scenarios passed; the combined tagged regression completed 22 executions with no failures.
- Resilience automation: four targeted cross-browser checks and 20 full regression executions passed locally.
- Pull request #1: API, Newman and UI checks passed for both push and pull-request events before merge.
- Playwright reporting: named business-action steps verified in the HTML report.
- CI reports: HTML, JUnit XML and JSON artifacts retained for 14 days.

## Safe portfolio wording

After you have personally run, changed and explained the tests, you may say:

> Built a fictional school-finance QA lab with Playwright UI tests, API contract and negative tests, role-based access checks, Postman/Newman regression coverage, SQL reconciliation queries, and CI quality gates.

> Refactored Playwright tests with reusable fixtures and Page Objects, published HTML/JUnit/JSON evidence, and configured passing GitHub Actions and Jenkins pipelines.

> Added named Playwright test steps so CI reports clearly communicate business actions, assertions and execution timing.

> Built a reusable Playwright API client and combined fast API test-data setup with cross-browser UI verification.

> Added Playwright accessibility checks that exposed an incorrect password-label association, fixed the markup, and verified the repair in CI.

> Tested login recovery from structured HTTP 503 and non-JSON HTTP 502 failures, then verified successful retry without a page refresh across Chromium and Firefox.

> Delivered the change through a feature branch and reviewed pull request with six passing CI checks before merging to `main`.

> Added a dedicated Playwright mobile project that verifies responsive login layout and authenticated navigation on a Pixel 5 profile without duplicating the desktop suite.

> Parallelized Playwright in GitHub Actions across Chromium, Firefox and Pixel 5 projects, with reproducible installs and separate diagnostic artifacts for each matrix entry.

> Reduced CI duplication and resource usage with branch-scoped triggers, concurrency cancellation and npm caching, while restricting workflow permissions to read-only repository access.

Do not claim that it was production work or a confidential employer system.
