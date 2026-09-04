-- Reference relational model for practising database checks. The running demo uses JSON storage.
CREATE TABLE students (
  id VARCHAR(40) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  guardian_email VARCHAR(120) NOT NULL UNIQUE,
  grade VARCHAR(30) NOT NULL,
  guardian_name VARCHAR(80) NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('active','inactive'))
);
CREATE TABLE invoices (
  id VARCHAR(40) PRIMARY KEY,
  student_id VARCHAR(40) NOT NULL REFERENCES students(id),
  description VARCHAR(120) NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_cents >= 0 AND paid_cents <= amount_cents),
  due_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('open','partial','paid','overdue'))
);
CREATE TABLE payments (
  id VARCHAR(40) PRIMARY KEY,
  invoice_id VARCHAR(40) NOT NULL REFERENCES invoices(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  method VARCHAR(20) NOT NULL,
  reference VARCHAR(60) NOT NULL UNIQUE,
  status VARCHAR(12) NOT NULL CHECK (status IN ('completed','refunded')),
  created_at TIMESTAMP NOT NULL
);
CREATE TABLE refunds (
  id VARCHAR(40) PRIMARY KEY,
  payment_id VARCHAR(40) NOT NULL REFERENCES payments(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  reason VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL
);
