import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  _request,
  context,
) => {
  const { logFailure } = await import("./server/logger");

  logFailure("next.request_failed", error, {
    operation: context.routeType,
    status: 500,
  });
};
