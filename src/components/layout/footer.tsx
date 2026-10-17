import RecipePromptDialog from "@/components/common/recipe-prompt-dialog";

export default function Footer() {
  return (
    <footer>
      <div className="shell">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>
            Minha <i>Cozinha</i>
          </span>
        </div>
        <p>Receitas, memórias e afeto à mesa.</p>
        <span>Feito para cozinhar com calma.</span>
        <RecipePromptDialog />
      </div>
    </footer>
  );
}
