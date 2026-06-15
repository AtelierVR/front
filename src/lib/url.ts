/**
 * Set a query parameter on a URL, overwriting any existing value.
 * Returns the URL as a string.
 */
export function addUrlQuery(url: string | URL, key: string, value?: string): string {
  const u = new URL(url.toString());
  u.searchParams.set(key, value ?? '');
  return u.toString().replace(/(\&|\?)\=/g, '$1').replace(/\=$/g, '');
}

export function removeUrlQuery(url: string | URL, key: string): string {
  const u = new URL(url.toString());
  u.searchParams.delete(key);
  return u.toString();
}