import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  _error,
  _request,
  context,
) => {
  const { log } = await import("./server/logger");
  log("error", "next.request_failed", { operation: context.routeType });
};
