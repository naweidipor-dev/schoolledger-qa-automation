# REST API reference

Base URL: `http://127.0.0.1:4173`

Authenticated calls require `Authorization: Bearer <token>`.

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Service health |
| POST | `/api/auth/login` | Public | Obtain session token |
| GET | `/api/me` | Read | Current identity |
| GET | `/api/dashboard` | Read | Calculated metrics and recent activity |
| GET | `/api/students?q=&status=` | Read | Search and filter students |
| POST | `/api/students` | Accountant/Admin | Create student |
| PATCH | `/api/students/:id` | Accountant/Admin | Update student |
| DELETE | `/api/students/:id` | Admin | Delete student without invoices |
| GET | `/api/invoices?status=` | Read | Filter invoices |
| POST | `/api/invoices` | Accountant/Admin | Create invoice |
| GET | `/api/payments` | Read | Payments and refunds |
| POST | `/api/payments` | Accountant/Admin | Record payment |
| POST | `/api/refunds` | Accountant/Admin | Record refund |
| GET | `/api/audit` | Read | Change evidence |
| POST | `/api/reset` | Admin | Restore seed data |
| GET | `/api/lab/config` | Read | View controlled SDET Lab configuration |
| PATCH | `/api/lab/config` | Admin | Configure latency and controlled faults |
| GET | `/api/lab/diagnostics` | Read | Run release-invariant checks |

Error contract:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check the highlighted fields",
    "fields": { "email": "Enter a valid guardian email" }
  }
}
```

Important response classes: 200 success, 201 created, 400 invalid JSON, 401 unauthenticated, 403 forbidden, 404 missing resource, 409 state conflict, 422 validation failure and 500 unexpected server failure.
