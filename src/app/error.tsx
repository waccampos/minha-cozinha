"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell page">
      <h1>Não foi possível abrir esta página</h1>
      <button className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
