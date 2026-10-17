export function atLeast(version: string, minimum: string) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return false;

  const actual = version.split(".").map(Number);
  const floor = minimum.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if (actual[i] > floor[i]) return true;

    if (actual[i] < floor[i]) return false;
  }

  return true;
}

export const floors: Record<string, string> = {
  next: "16.4.1",
  react: "19.2.6",
  "react-dom": "19.2.6",
  sharp: "0.35.5",
};

export function dependencyIssues(
  packages: Record<string, { version?: string }>,
) {
  const issues: string[] = [];

  for (const [name, minimum] of Object.entries(floors)) {
    const matches = Object.entries(packages).filter(
      ([key]) =>
        key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`),
    );

    if (!matches.length) issues.push(`${name}: não encontrado no lockfile.`);

    for (const [, pkg] of matches)
      if (!atLeast(pkg.version ?? "", minimum))
        issues.push(`${name}@${pkg.version ?? "?"}: mínimo ${minimum}.`);
  }

  return issues;
}
