/**
 * Escapes the HTML for telegram parse mode.
 */
export function escapeHtml(text: string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };

  return text.replace(/[&<>]/g, (m) => map[m as keyof typeof map]);
}

/**
 * Adds dots surrounding the text if isMatched is true.
 */
export function selectedBtnText(text: string, isMatched: boolean) {
  return isMatched ? `• ${text} •` : text;
}

/**
 * Resulting array will have at most "limit" elements
 */
export function splitWithTail(str: string, separator: string, limit: number) {
  const parts = str.split(separator);
  const tail = parts.slice(limit - 1).join(separator);
  const result = parts.slice(0, limit - 1);
  result.push(tail);

  return result;
}

/**
 * Hash function using JSON.stringify.
 */
export function stringifyHash(obj: any): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }

  const res: Record<string, string> = {};
  Object.keys(obj).forEach((key) => {
    res[key] = stringifyHash(obj[key]);
  });

  return JSON.stringify(obj, Object.keys(obj).sort());
}
