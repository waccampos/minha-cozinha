import RecipeRoute from "@/components/pages/recipe-route/recipe-route.page";

export const metadata = { title: "Receita" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <RecipeRoute key={id} id={id} view="detail" />;
}
