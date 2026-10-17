import Link from "next/link";

export default function RecipeMissing() {
  return (
    <main className="shell page">
      <h1>Receita não encontrada</h1>
      <p>Esta receita não está disponível neste navegador.</p>
      <Link className="btn btn-primary" href="/receitas">
        Voltar à biblioteca
      </Link>
    </main>
  );
}
