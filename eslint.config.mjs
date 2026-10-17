import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypes from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypes,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "directive", next: "*" },
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        {
          blankLine: "always",
          prev: "*",
          next: ["function", "class", "export"],
        },
        { blankLine: "always", prev: ["function", "class"], next: "*" },
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "expression", next: ["const", "let"] },
        { blankLine: "always", prev: "if", next: "*" },
        {
          blankLine: "always",
          prev: "*",
          next: ["if", "try", "for", "while", "switch"],
        },
        { blankLine: "always", prev: "multiline-const", next: "*" },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "src/generated/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
