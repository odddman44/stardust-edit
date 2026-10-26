function parseUrl(value: string): URL | undefined {
  if (!value || value.trim() !== value || /[\u0000-\u0020\u007f\\]/.test(value)) return;
  try {
    return new URL(value);
  } catch {
    return;
  }
}

export function isSafeLinkUrl(value: string): boolean {
  const url = parseUrl(value);
  return !!url && ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
}

export function isSafeImageUrl(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/') && !value.startsWith('//') && !/[\u0000-\u0020\u007f\\]/.test(value)) return true;
  const url = parseUrl(value);
  return !!url && ['http:', 'https:'].includes(url.protocol);
}
