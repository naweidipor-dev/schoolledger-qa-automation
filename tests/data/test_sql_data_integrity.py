"""Execute the portfolio SQL checks against SchoolLedger JSON data in SQLite."""

import json
import sqlite3
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[2]


def load_database():
    data = json.loads((ROOT / "data" / "seed.json").read_text(encoding="utf-8"))
    connection = sqlite3.connect(":memory:")
    connection.executescript((ROOT / "sql" / "schema.sql").read_text(encoding="utf-8"))
    connection.executemany(
        "INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (
                item["id"], item["firstName"], item["lastName"], item["email"],
                item["grade"], item["guardianName"], item["status"]
            )
            for item in data["students"]
        ],
    )
    connection.executemany(
        "INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (
                item["id"], item["studentId"], item["description"], item["amountCents"],
                item["paidCents"], item["dueDate"], item["status"]
            )
            for item in data["invoices"]
        ],
    )
    connection.executemany(
        "INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (
                item["id"], item["invoiceId"], item["amountCents"], item["method"],
                item["reference"], item["status"], item["createdAt"]
            )
            for item in data["payments"]
        ],
    )
    connection.executemany(
        "INSERT INTO refunds VALUES (?, ?, ?, ?, ?)",
        [
            (item["id"], item["paymentId"], item["amountCents"], item["reason"], item["createdAt"])
            for item in data["refunds"]
        ],
    )
    return connection


def run_checks(connection):
    query = (ROOT / "sql" / "qa_checks.sql").read_text(encoding="utf-8")
    return dict(connection.execute(query).fetchall())


class SqlDataIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.database = load_database()

    def tearDown(self):
        self.database.close()

    def test_seed_data_has_zero_integrity_violations(self):
        results = run_checks(self.database)
        self.assertEqual(
            set(results),
            {
                "duplicate_payment_references",
                "invalid_invoice_balances",
                "invoice_payment_reconciliation",
                "orphan_invoices",
                "orphan_payments",
                "orphan_refunds",
            },
        )
        self.assertEqual(results, {name: 0 for name in results})

    def test_orphan_invoice_is_detected(self):
        self.database.execute(
            "INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("inv-orphan", "missing-student", "Corrupt row", 1000, 0, "2026-12-31", "open"),
        )
        self.assertEqual(run_checks(self.database)["orphan_invoices"], 1)

    def test_case_insensitive_duplicate_payment_reference_is_detected(self):
        self.database.execute(
            "INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?)",
            ("pay-duplicate", "inv-2001", 100, "card", "card-10001", "completed", "2026-08-08T12:00:00Z"),
        )
        self.assertEqual(run_checks(self.database)["duplicate_payment_references"], 1)

    def test_payment_mismatch_is_detected(self):
        self.database.execute("UPDATE invoices SET paid_cents = paid_cents - 100 WHERE id = 'inv-2002'")
        self.assertEqual(run_checks(self.database)["invoice_payment_reconciliation"], 1)


if __name__ == "__main__":
    unittest.main()
