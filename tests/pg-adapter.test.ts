import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test, { type TestContext } from "node:test";

import { Pool } from "pg";

import { SerializedPrismaPg } from "../src/server/database/serialized-pg";

function adapterFixture(context: TestContext) {
  const events: string[][] = [];

  context.mock.method(Pool.prototype, "connect", async () => {
    const calls: string[] = [];
    let active = false;
    events.push(calls);

    return Object.assign(new EventEmitter(), {
      async query(input: string | { text: string }) {
        assert.equal(
          active,
          false,
          "consultas concorrentes no mesmo cliente pg",
        );
        active = true;

        const sql = typeof input === "string" ? input : input.text;
        calls.push(`start ${sql}`);

        try {
          await new Promise<void>((resolve) => setImmediate(resolve));

          if (sql === "FAIL") throw new Error("consulta recusada");

          return { fields: [], rows: [], rowCount: 0 };
        } finally {
          active = false;
          calls.push(`end ${sql}`);
        }
      },
      release() {
        assert.equal(
          active,
          false,
          "conexão liberada antes de concluir a consulta",
        );
        calls.push("release");
      },
    });
  });

  return {
    factory: new SerializedPrismaPg({}, { schema: "minha_cozinha" }),
    events,
  };
}

const query = (sql: string) => ({ sql, args: [], argTypes: [] });

test("adapter serializa consultas internas, savepoints e liberação da transação", async (context) => {
  const { factory, events } = adapterFixture(context);
  const adapter = await factory.connect();
  const tx = await adapter.startTransaction();
  events[0].length = 0;

  await Promise.all([
    tx.queryRaw(query("SELECT 1")),
    tx.executeRaw(query("SELECT 2")),
    tx.createSavepoint!("etapa"),
    tx.rollbackToSavepoint!("etapa"),
    tx.releaseSavepoint!("etapa"),
    tx.commit(),
  ]);

  assert.deepEqual(events[0], [
    "start SELECT 1",
    "end SELECT 1",
    "start SELECT 2",
    "end SELECT 2",
    "start SAVEPOINT etapa",
    "end SAVEPOINT etapa",
    "start ROLLBACK TO SAVEPOINT etapa",
    "end ROLLBACK TO SAVEPOINT etapa",
    "start RELEASE SAVEPOINT etapa",
    "end RELEASE SAVEPOINT etapa",
    "release",
  ]);

  await adapter.dispose();
});

test("falha de consulta preserva o erro e permite rollback após concluir a fila", async (context) => {
  const { factory, events } = adapterFixture(context);
  const adapter = await factory.connect();
  const tx = await adapter.startTransaction();
  events[0].length = 0;

  const failed = tx.queryRaw(query("FAIL"));
  const rollback = tx.rollback();

  await assert.rejects(failed, /consulta recusada/);
  await rollback;

  assert.deepEqual(events[0], ["start FAIL", "end FAIL", "release"]);

  await adapter.dispose();
});

test("transações em conexões diferentes continuam executando em paralelo", async (context) => {
  const { factory, events } = adapterFixture(context);
  const adapter = await factory.connect();
  const first = await adapter.startTransaction();
  const second = await adapter.startTransaction();
  events.forEach((calls) => {
    calls.length = 0;
  });

  const firstQuery = first.queryRaw(query("SELECT 1"));
  const secondQuery = second.queryRaw(query("SELECT 2"));
  await Promise.resolve();

  assert.deepEqual(events, [["start SELECT 1"], ["start SELECT 2"]]);

  await Promise.all([firstQuery, secondQuery]);
  await Promise.all([first.commit(), second.commit()]);
  await adapter.dispose();
});
