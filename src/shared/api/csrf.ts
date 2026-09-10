export function readCsrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};

  const token = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("glasno_csrf="))
    ?.slice("glasno_csrf=".length);

  return token ? { "x-csrf-token": decodeURIComponent(token) } : {};
}

export function appendCsrfHeader(headers: Headers) {
  for (const [name, value] of Object.entries(readCsrfHeader())) {
    headers.set(name, value);
  }

  return headers;
}
