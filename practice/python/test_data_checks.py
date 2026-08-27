"""Standard-library practice: validate exported SchoolLedger JSON data."""
import json
from pathlib import Path

data = json.loads((Path(__file__).parents[2] / "data" / "runtime-db.json").read_text())
invoice_ids = {invoice["id"] for invoice in data["invoices"]}
student_ids = {student["id"] for student in data["students"]}

assert all(invoice["studentId"] in student_ids for invoice in data["invoices"]), "Orphan invoice found"
assert all(0 <= invoice["paidCents"] <= invoice["amountCents"] for invoice in data["invoices"]), "Invalid invoice balance"
assert all(payment["invoiceId"] in invoice_ids for payment in data["payments"]), "Orphan payment found"
references = [payment["reference"].lower() for payment in data["payments"]]
assert len(references) == len(set(references)), "Duplicate payment reference found"
print(f"Validated {len(data['students'])} students, {len(data['invoices'])} invoices and {len(data['payments'])} payments")
