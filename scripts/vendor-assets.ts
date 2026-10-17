import { mkdir, writeFile } from "node:fs/promises";

import { categories } from "../src/constants/category-artwork";

const cssUrl =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap";

try {
  await mkdir("public/fonts", { recursive: true });
  await mkdir("public/images/categories", { recursive: true });

  const response = await fetch(cssUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) throw new Error("Font CSS");

  let css = await response.text();
  let index = 0;

  for (const match of [
    ...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g),
  ]) {
    const url = match[1];
    const file = `dm-${++index}.${new URL(url).pathname.endsWith(".woff2") ? "woff2" : "ttf"}`;
    const font = await fetch(url, { signal: AbortSignal.timeout(30000) });

    if (!font.ok) throw new Error("Font download");

    await writeFile(
      `public/fonts/${file}`,
      Buffer.from(await font.arrayBuffer()),
    );
    css = css.replace(url, `/fonts/${file}`);
  }

  if (!index) throw new Error("No fonts");

  await writeFile("public/fonts/fonts.css", css);

  const { readFile } = await import("node:fs/promises");
  const globals = await readFile("src/styles/globals.css", "utf8");
  await writeFile(
    "src/styles/globals.css",
    globals.replace(
      /@import\s+url\((["'])https:\/\/fonts\.googleapis\.com[\s\S]*?\1\);?\s*/,
      "",
    ),
  );

  for (const category of categories) {
    const response = await fetch(category.image, {
      signal: AbortSignal.timeout(30000),
    });

    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw new Error("Category artwork");

    await writeFile(
      `public/images/categories/${category.icon}.jpg`,
      Buffer.from(await response.arrayBuffer()),
    );
  }

  console.log(
    "Fontes DM Sans/DM Serif e fotografias originais disponíveis localmente.",
  );
} catch {
  console.error(
    "Não foi possível baixar os assets originais. Execute novamente com internet antes do deploy para preservar tipografia e fotografias no modo local.",
  );
  process.exitCode = 1;
}
