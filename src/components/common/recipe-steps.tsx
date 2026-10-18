"use client";

type RecipeStepsProps = {
  steps: string[];
};

export default function RecipeSteps({ steps }: RecipeStepsProps) {
  return (
    <ol className="steps">
      {steps.map((step, i) => (
        <li key={step}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  );
}
