import Screen from "@/components/pages/search-page";

export const metadata = { title: "Busca" };

type PageProps = {
  searchParams: Promise<{ q?: string; modo?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
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
