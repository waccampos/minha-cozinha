"use client";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="shell page">
      <h1>Não foi possível abrir esta página</h1>
      <button className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
