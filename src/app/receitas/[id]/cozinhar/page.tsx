import RecipeRoute from "@/components/pages/recipe-page";

export const metadata = { title: "Modo cozinha" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RecipeRoute key={id} id={id} view="cooking" />;
}
