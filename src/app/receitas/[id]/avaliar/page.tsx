import RecipeRoute from "@/components/pages/recipe-page";

export const metadata = { title: "Avaliar preparo" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RecipeRoute key={id} id={id} view="review" />;
}
