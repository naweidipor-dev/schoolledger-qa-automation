export function requiredText(value, label, min = 1, max = 100) {
  if (typeof value !== "string" || value.trim().length < min) return `${label} is required`;
  if (value.trim().length > max) return `${label} must be ${max} characters or fewer`;
  return null;
}

export function validEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function moneyToCents(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 1000000) return null;
  return Math.round(number * 100);
}

export function fieldErrors(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => Boolean(message)));
}
