/**
 * Turns chat text into safe HTML. Every character that could start a tag or attribute is escaped FIRST,
 * and only then are **bold** and *italic* converted. Without the escaping, a message such as
 * <img src=x onerror=...> would run script in a page that also holds the login token.
 */
export function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderChatMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}
