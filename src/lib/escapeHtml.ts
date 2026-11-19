// Minimal HTML-escaping for interpolating user-submitted text (names,
// addresses, notes) into HTML emails. Prevents a customer's own quote
// form input from being interpreted as markup if it contains
// characters like <, >, or &.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
