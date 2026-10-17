import assert from "node:assert/strict";
import test from "node:test";

import { atLeast, dependencyIssues } from "../scripts/dependency-policy";

test("deploy bloqueia Next vulnerável e Sharp transitivo antigo", () => {
  assert.equal(atLeast("16.1.4", "16.4.1"), false);
  assert.equal(atLeast("16.4.1", "16.4.1"), true);
  assert.equal(atLeast("16.4.1-canary.1", "16.4.1"), false);

  const packages = {
    "node_modules/next": { version: "16.4.1" },
    "node_modules/react": { version: "19.2.6" },
    "node_modules/react-dom": { version: "19.2.6" },
    "node_modules/sharp": { version: "0.35.5" },
  };

  assert.deepEqual(dependencyIssues(packages), []);
  assert.equal(
    dependencyIssues({
      ...packages,
      "node_modules/next/node_modules/sharp": { version: "0.34.5" },
    }).length,
    1,
  );
});
