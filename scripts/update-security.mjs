import { spawnSync } from "node:child_process";

const cli = process.env.npm_execpath;

if (!cli) throw new Error("Execute via npm run security:update.");

for (const args of [
  [
    "install",
    "--save-exact",
    "next@16.4.1",
    "react@19.2.6",
    "react-dom@19.2.6",
    "sharp@0.35.5",
  ],
  ["install", "--save-dev", "--save-exact", "eslint-config-next@16.4.1"],
]) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    stdio: "inherit",
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(
  "Dependências atualizadas. Rode security:check, audit, testes, lint, typecheck e build antes do Docker.",
);
