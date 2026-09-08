import type { H3Event } from "h3";
import { defineEventHandler } from "h3";

import { ApiError } from "./apiError";

export function defineApiRoute(
  handler: (event: H3Event) => Promise<unknown> | unknown,
) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(error.data, { status: error.statusCode });
      }

      throw error;
    }
  });
}
