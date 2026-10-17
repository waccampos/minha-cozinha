BEGIN;

SET LOCAL lock_timeout = '10s';

-- Aplicar em manutenção: a versão anterior depende de Recipe.categoryId.
-- Todos os vínculos existentes são copiados antes da remoção da coluna antiga.
LOCK TABLE minha_cozinha."Recipe" IN ACCESS EXCLUSIVE MODE;

CREATE TABLE minha_cozinha."RecipeCategory" (
  "recipeId" INTEGER NOT NULL,
  "categoryId" INTEGER NOT NULL,
  CONSTRAINT "RecipeCategory_pkey" PRIMARY KEY ("recipeId", "categoryId"),
  CONSTRAINT "RecipeCategory_recipeId_fkey" FOREIGN KEY ("recipeId")
    REFERENCES minha_cozinha."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecipeCategory_categoryId_fkey" FOREIGN KEY ("categoryId")
    REFERENCES minha_cozinha."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "RecipeCategory_categoryId_idx" ON minha_cozinha."RecipeCategory" ("categoryId");

INSERT INTO minha_cozinha."RecipeCategory" ("recipeId", "categoryId")
SELECT id, "categoryId" FROM minha_cozinha."Recipe";

-- Abortar toda a transação se algum vínculo não tiver sido preservado.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM minha_cozinha."Recipe" r
    WHERE NOT EXISTS (
      SELECT 1 FROM minha_cozinha."RecipeCategory" rc
      WHERE rc."recipeId" = r.id AND rc."categoryId" = r."categoryId"
    )
  ) THEN
    RAISE EXCEPTION 'A migração não preservou todas as categorias das receitas';
  END IF;
END $$;

ALTER TABLE minha_cozinha."Recipe" DROP CONSTRAINT "Recipe_categoryId_fkey";
DROP INDEX minha_cozinha."Recipe_categoryId_idx";
ALTER TABLE minha_cozinha."Recipe" DROP COLUMN "categoryId";

COMMIT;
