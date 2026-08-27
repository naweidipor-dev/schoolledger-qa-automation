-- 1. Invoices that violate the paid <= billed invariant (expected: zero rows).
SELECT id, amount_cents, paid_cents FROM invoices WHERE paid_cents < 0 OR paid_cents > amount_cents;

-- 2. Orphan invoices (expected: zero rows).
SELECT i.id FROM invoices i LEFT JOIN students s ON s.id = i.student_id WHERE s.id IS NULL;

-- 3. Reconcile each invoice with completed payments minus refunds.
SELECT i.id, i.paid_cents,
       COALESCE(SUM(p.amount_cents),0) - COALESCE(SUM(r.amount_cents),0) AS calculated_paid
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
LEFT JOIN refunds r ON r.payment_id = p.id
GROUP BY i.id, i.paid_cents
HAVING i.paid_cents <> COALESCE(SUM(p.amount_cents),0) - COALESCE(SUM(r.amount_cents),0);

-- 4. Dashboard totals.
SELECT SUM(amount_cents) AS total_billed,
       SUM(paid_cents) AS collected,
       SUM(amount_cents-paid_cents) AS outstanding
FROM invoices;

-- 5. Duplicate payment references (expected: zero rows).
SELECT reference, COUNT(*) FROM payments GROUP BY reference HAVING COUNT(*) > 1;
