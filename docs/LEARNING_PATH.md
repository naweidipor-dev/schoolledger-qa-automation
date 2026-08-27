# Four-sprint learning path

Use one sprint per week. Work for 90-120 minutes a day and keep a learning journal containing the command, expected result, actual result, evidence and lesson.

## Sprint 1 - Product risk and manual testing

1. Log in as each role and create a permission matrix.
2. Read `TEST_PLAN.md` and add three risks of your own.
3. Execute every P0 and P1 case in `MANUAL_TEST_CASES.md`.
4. Design boundary tests for money, dates, names and payment references.
5. Create two exploratory charters: invoice lifecycle and refund control.
6. Write three professional bug reports, even if you must describe intentionally invalid inputs as test observations rather than real defects.
7. Produce a release summary: tested scope, results, defects, residual risk and recommendation.

Definition of done: you can explain why each test exists and which risk it covers.

## Sprint 2 - API, Postman and data

1. Inspect calls in browser DevTools Network.
2. Run the Postman login request and explain the token.
3. Add tests for headers, schema, invalid JSON and missing authorization.
4. Create data-driven student tests for valid and invalid emails.
5. Test duplicate payment references and overpayments.
6. Translate JSON entities into the relational model in `sql/schema.sql`.
7. Explain every query in `sql/qa_checks.sql`.
8. Run `practice/python/test_data_checks.py` after exercising the app.

Definition of done: you can distinguish product, contract, test-data and environment failures.

## Sprint 3 - Playwright framework and reliability

1. Run the existing Chromium tests.
2. Run them in Firefox and compare evidence.
3. Add invoice creation and partial-payment tests.
4. Create a fixture that logs in by API and sets browser storage.
5. Refactor repeated interactions into page/component objects.
6. Add test tags for smoke and regression.
7. Force one failure, then diagnose it using trace, screenshot and network evidence.
8. Remove the forced failure and rerun the full suite three times.

Definition of done: tests pass repeatedly without fixed sleeps, shared order or manually prepared data.

## Sprint 4 - CI/CD, release gate and interview

1. Push the project to a personal GitHub repository.
2. Run the GitHub Actions workflow on a pull request.
3. Explain every stage and why reports are uploaded even after failure.
4. Configure a local Jenkins agent and run the `Jenkinsfile`.
5. Make a controlled test failure and trace it to the responsible layer.
6. Write a go/conditional-go/no-go decision.
7. Practise a five-minute architecture walkthrough.
8. Answer every question in `INTERVIEW_EVIDENCE.md` using the project as evidence.

Definition of done: you can demonstrate the repository live and explain design decisions without memorised wording.
