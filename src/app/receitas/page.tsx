import Screen from "@/components/pages/recipe-library";

export const metadata = { title: "Receitas" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const query = await searchParams;
  const category =
    typeof query.category === "string" && query.category.length <= 80
      ? query.category
      : undefined;

  return <Screen key={category ?? "all"} initialCategory={category} />;
}
