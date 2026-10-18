import Screen from "@/components/pages/recipe-library/recipe-library.page";

export const metadata = { title: "Receitas" };

type PageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const query = await searchParams;
  const category =
    typeof query.category === "string" && query.category.length <= 80
      ? query.category
      : undefined;

  return <Screen key={category ?? "all"} initialCategory={category} />;
}
