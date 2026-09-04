-- Executable data-quality report. Every check must return zero violations.
WITH
payment_totals AS (
  SELECT invoice_id, SUM(amount_cents) AS paid_cents
  FROM payments
  WHERE status = 'completed'
  GROUP BY invoice_id
),
refund_totals AS (
  SELECT p.invoice_id, SUM(r.amount_cents) AS refunded_cents
  FROM refunds r
  JOIN payments p ON p.id = r.payment_id
  GROUP BY p.invoice_id
),
checks AS (
  SELECT 'orphan_invoices' AS check_name, COUNT(*) AS violation_count
  FROM invoices i LEFT JOIN students s ON s.id = i.student_id
  WHERE s.id IS NULL
  UNION ALL
  SELECT 'orphan_payments', COUNT(*)
  FROM payments p LEFT JOIN invoices i ON i.id = p.invoice_id
  WHERE i.id IS NULL
  UNION ALL
  SELECT 'orphan_refunds', COUNT(*)
  FROM refunds r LEFT JOIN payments p ON p.id = r.payment_id
  WHERE p.id IS NULL
  UNION ALL
  SELECT 'invalid_invoice_balances', COUNT(*)
  FROM invoices
  WHERE amount_cents <= 0 OR paid_cents < 0 OR paid_cents > amount_cents
  UNION ALL
  SELECT 'duplicate_payment_references', COUNT(*)
  FROM (
    SELECT LOWER(reference)
    FROM payments
    GROUP BY LOWER(reference)
    HAVING COUNT(*) > 1
  ) duplicates
  UNION ALL
  SELECT 'invoice_payment_reconciliation', COUNT(*)
  FROM invoices i
  LEFT JOIN payment_totals p ON p.invoice_id = i.id
  LEFT JOIN refund_totals r ON r.invoice_id = i.id
  WHERE i.paid_cents <> COALESCE(p.paid_cents, 0) - COALESCE(r.refunded_cents, 0)
)
SELECT check_name, violation_count
FROM checks
ORDER BY check_name;
