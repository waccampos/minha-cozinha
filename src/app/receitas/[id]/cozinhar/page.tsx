import RecipeRoute from "@/components/pages/recipe-page";

export const metadata = { title: "Modo cozinha" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <RecipeRoute key={id} id={id} view="cooking" />;
}
