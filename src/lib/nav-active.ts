export function resolveActiveNavUrl(
  pathname: string,
  urls: readonly string[]
): string | null {
  const matches = urls.filter(
    (url) => pathname === url || (url !== '/dashboard' && pathname.startsWith(`${url}/`))
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, url) => (url.length > best.length ? url : best));
}

export function isNavUrlActive(
  pathname: string,
  url: string,
  urls: readonly string[]
): boolean {
  return resolveActiveNavUrl(pathname, urls) === url;
}
