import Screen from "@/components/pages/search-page";

export const metadata = { title: "Busca" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; modo?: string }>;
}) {
  const params = await searchParams;
  const mode = params.modo === "despensa" ? "pantry" : "search";

  return (
    <Screen
      key={`${params.q ?? ""}:${mode}`}
      initialQuery={params.q ?? ""}
      initialMode={mode}
    />
  );
}
