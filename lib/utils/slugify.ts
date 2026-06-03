export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word, non-space, non-hyphen
    .replace(/[\s_]+/g, '-')    // spaces/underscores → single hyphen
    .replace(/-{2,}/g, '-')     // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '')    // trim leading/trailing hyphens
}
