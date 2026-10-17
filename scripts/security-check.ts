import { readFile } from "node:fs/promises";

import { dependencyIssues } from "./dependency-policy";

const lock = JSON.parse(await readFile("package-lock.json", "utf8"));

const issues = dependencyIssues(lock.packages);

if (issues.length) {
  console.error(
    "Deploy bloqueado pelo piso de segurança de 14/10/2026:\n" +
      issues.join("\n") +
      "\nExecute npm run security:update com acesso ao registry, revise o lockfile e valide novamente.",
  );
  process.exitCode = 1;
} else
  console.log(
    "Pisos de segurança conferidos no lockfile. Execute também npm audit --omit=dev com internet.",
  );
