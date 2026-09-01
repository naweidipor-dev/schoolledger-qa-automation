# Interview evidence guide

Do not memorise answers. Demonstrate the project and explain your own decisions.

## Framework and automation

1. Why are most validation and authorization checks at API level?
2. Which journeys deserve UI coverage, and which do not?
3. How do locators, web-first assertions and isolated data reduce flakiness?
4. Why are retries diagnostic rather than a repair for unreliable tests?
5. When would you introduce Page Objects versus fixtures or API clients?

## API and data

1. Explain 401 versus 403, and 409 versus 422, using this API.
2. How do you test duplicate payment references and idempotency?
3. How do refunds affect invoice and dashboard state?
4. Which SQL query detects orphan records or reconciliation errors?
5. How would you test simultaneous payments against the same invoice?

## Delivery and collaboration

1. What belongs in pull-request smoke versus scheduled regression?
2. What evidence should a failed CI test publish?
3. How do you distinguish product, test, data and environment failures?
4. What information supports a go, conditional-go or no-go recommendation?
5. Describe how you would report an intermittent financial-integrity failure to developers.

## Honest portfolio explanation

Say that SchoolLedger is a personal fictional training system. Describe what you personally ran, changed and diagnosed. Do not present it as employer or production work.

## Completed evidence to demonstrate

- Explain how the automatic fixture authenticates and resets test data before each UI scenario.
- Show how `LoginPage` and `StudentsPage` separate page behaviour from test intent.
- Explain how `SchoolLedgerApi` creates deterministic test data through the API before verifying it in the UI.
- Reproduce the password-label accessibility failure, explain its root cause, and show the passing CI run after the HTML fix.
- Demonstrate the GitHub Actions quality gate with three passing jobs.
- Demonstrate the successful local Jenkins pipeline and explain the Windows `bat` adaptation.
- Show Jenkins build #4 running two Chromium tests with `--grep @smoke`, and GitHub Actions run #16 passing the tagged regression suite.
- Explain why login smoke checks provide fast feedback but do not replace student, role, diagnostics and accessibility regression coverage.
- Open the Newman HTML report and describe the 75 automated assertions.
- Open the Playwright HTML report and identify the accompanying JUnit XML and JSON outputs.
- Expand a Playwright test result and explain how named `test.step` actions make failures and timing easier to diagnose.
- Explain how screenshots, video and traces are retained when a Playwright test fails.
- Show the targeted resilience run (4 passed) and full tagged regression run (20 passed), then explain why only one browser request is mocked.
- Walk through pull request #1: feature branch, diff review, six passing checks, no conflicts, merge, and local `git pull --ff-only`.
- Show the Pixel 5 project configuration and explain how `testMatch`/`testIgnore` keep mobile-only checks separate from desktop coverage.
- Demonstrate the 2-test mobile run, the complete 22-execution regression, and pull request #3 with six passing checks.
