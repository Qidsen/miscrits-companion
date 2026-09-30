const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => HTML_ESCAPES[c])
/** Class-name fragment from upstream data: letters only. */
export const safeClass = (s: string) => s.replace(/[^A-Za-z]/g, '')
