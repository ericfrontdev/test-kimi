import DOMPurify from "dompurify";

/**
 * Sanitize an HTML string before rendering with dangerouslySetInnerHTML.
 * Only call this in client components (DOMPurify requires a DOM environment).
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
  });
}
