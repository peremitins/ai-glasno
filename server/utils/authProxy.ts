import { getHeader, readBody, type H3Event } from "h3";

import { resolveAuthUpstreamUrl } from "../application/auth/authUpstream";
import { apiError } from "./apiError";

export async function proxyAuthRequest(event: H3Event, path: string) {
  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
  });
  const cookie = getHeader(event, "cookie");
  if (cookie) headers.set("cookie", cookie);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(resolveAuthUpstreamUrl(path), {
      body: JSON.stringify(await readBody(event)),
      headers,
      method: "POST",
    });
  } catch {
    throw apiError("E_UPSTREAM", "Сервис авторизации временно недоступен");
  }

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  const getSetCookie = (
    upstreamResponse.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  for (const value of getSetCookie?.call(upstreamResponse.headers) ?? []) {
    responseHeaders.append("set-cookie", value);
  }

  return new Response(await upstreamResponse.text(), {
    headers: responseHeaders,
    status: upstreamResponse.status,
  });
}
