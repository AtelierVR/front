/**
 * Set a query parameter on a URL, overwriting any existing value.
 * Returns the URL as a string.
 */
export function addUrlQuery(url: string | URL, key: string, value?: string): string {
  const u = new URL(url.toString(), 'http://localhost');
  u.searchParams.set(key, value ?? '');
  const isRelative = typeof url === 'string' && url.startsWith('/');
  const result = u.toString().replace(/(\&|\?)\=/g, '$1').replace(/\=$/g, '');
  return isRelative ? result.replace('http://localhost', '') : result;
}

export function removeUrlQuery(url: string | URL, key: string): string {
  const u = new URL(url.toString(), 'http://localhost');
  u.searchParams.delete(key);
  const isRelative = typeof url === 'string' && url.startsWith('/');
  const result = u.toString();
  return isRelative ? result.replace('http://localhost', '') : result;
}