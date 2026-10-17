import RecipeRoute from "@/components/pages/recipe-page";

export const metadata = { title: "Receita" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RecipeRoute key={id} id={id} view="detail" />;
}
