import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell page">
      <h1>Página não encontrada</h1>
      <p>Vamos voltar para a cozinha?</p>
      <Link href="/" className="btn btn-primary">
        Ir para o início
      </Link>
    </main>
  );
}
