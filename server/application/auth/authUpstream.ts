const DEFAULT_AUTH_UPSTREAM_ORIGIN = "http://web:3000";

export function resolveAuthUpstreamUrl(
  path: string,
  origin = process.env.GLASNO_AUTH_UPSTREAM_URL ?? DEFAULT_AUTH_UPSTREAM_ORIGIN,
) {
  return new URL(`/api/auth/${path.replace(/^\/+/, "")}`, origin).toString();
}
