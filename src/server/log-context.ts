import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

export type LogContext = {
  requestId: string;
  operation: string;
  route?: string;
  method?: string;
};

export const logContext = new AsyncLocalStorage<LogContext>();

export function setLogOperation(operation: string) {
  const context = logContext.getStore();

  if (context) context.operation = operation;
}
