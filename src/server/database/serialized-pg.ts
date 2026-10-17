import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

type PgAdapter = Awaited<ReturnType<PrismaPg["connect"]>>;
type PgTransaction = Awaited<ReturnType<PgAdapter["startTransaction"]>>;

function serializeTransaction(tx: PgTransaction): PgTransaction {
  let pending: Promise<void> = Promise.resolve();

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    // Uma falha de consulta não pode impedir o rollback nem a liberação do cliente.
    pending = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  return {
    provider: tx.provider,
    adapterName: tx.adapterName,
    options: tx.options,
    queryRaw: (query) => enqueue(() => tx.queryRaw(query)),
    executeRaw: (query) => enqueue(() => tx.executeRaw(query)),
    commit: () => enqueue(() => tx.commit()),
    rollback: () => enqueue(() => tx.rollback()),
    ...(tx.createSavepoint && {
      createSavepoint: (name: string) =>
        enqueue(() => tx.createSavepoint!(name)),
    }),
    ...(tx.rollbackToSavepoint && {
      rollbackToSavepoint: (name: string) =>
        enqueue(() => tx.rollbackToSavepoint!(name)),
    }),
    ...(tx.releaseSavepoint && {
      releaseSavepoint: (name: string) =>
        enqueue(() => tx.releaseSavepoint!(name)),
    }),
  };
}

// Prisma 7.5 pode carregar relações em paralelo dentro de uma única conexão pg.
// A fila é exclusiva de cada transação; conexões diferentes continuam independentes.
export class SerializedPrismaPg extends PrismaPg {
  override async connect() {
    const adapter = await super.connect();
    const startTransaction = adapter.startTransaction.bind(adapter);

    adapter.startTransaction = async (isolationLevel) =>
      serializeTransaction(await startTransaction(isolationLevel));

    return adapter;
  }
}
