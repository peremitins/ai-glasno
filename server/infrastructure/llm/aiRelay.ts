import { createHash, createHmac, randomUUID } from "node:crypto";

import { apiError } from "../../utils/apiError";

type RelayConfig = {
  authSecret: string;
  clientId: string;
  enabled: boolean;
  url: string;
};

export async function exchangeRealtimeSdpWithRelay(params: {
  config: RelayConfig;
  sdp: string;
  session: Record<string, unknown>;
}) {
  const { config } = params;
  if (!config.url || !config.authSecret || !config.clientId) {
    throw apiError("E_UPSTREAM", "Голосовой relay не настроен");
  }

  const path = "/v1/realtime/calls";
  const rawBody = JSON.stringify({ sdp: params.sdp, session: params.session });
  const timestamp = String(Date.now());
  const nonce = randomUUID();
  const requestId = randomUUID();
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const signature = createHmac("sha256", config.authSecret)
    .update(
      ["POST", path, timestamp, nonce, bodyHash, config.clientId].join("\n"),
    )
    .digest("base64");

  let response: Response;
  try {
    response = await fetch(`${config.url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Purpose": "realtime_call",
        "X-Relay-Client": config.clientId,
        "X-Relay-Nonce": nonce,
        "X-Request-Id": requestId,
        "X-Relay-Signature": signature,
        "X-Relay-Timestamp": timestamp,
      },
      body: rawBody,
    });
  } catch {
    throw apiError("E_UPSTREAM", "Не удалось подключиться к голосовому relay");
  }

  const answerSdp = await response.text();
  if (!response.ok || !answerSdp.trim()) {
    throw apiError("E_UPSTREAM", "Голосовой relay временно недоступен");
  }
  return answerSdp;
}
