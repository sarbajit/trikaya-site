export function stripHtml(html: string, maxLength?: number): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!maxLength || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + "…";
}
