BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "minha_cozinha";

-- CreateTable
CREATE TABLE "minha_cozinha"."Recipe" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "servings" VARCHAR(120) NOT NULL,
    "difficulty" VARCHAR(20) NOT NULL,
    "temperature" VARCHAR(20) NOT NULL,
    "flavor" VARCHAR(20) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "searchText" TEXT NOT NULL DEFAULT '',
    "categoryId" INTEGER NOT NULL,
    "imageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Ingredient" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "quantity" VARCHAR(80) NOT NULL DEFAULT '',
    "unit" VARCHAR(40) NOT NULL DEFAULT '',
    "name" VARCHAR(200) NOT NULL,
    "normalized" TEXT NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."PreparationStep" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "PreparationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Category" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."RecipeTag" (
    "recipeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "RecipeTag_pkey" PRIMARY KEY ("recipeId","tagId")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Favorite" (
    "recipeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("recipeId")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Preparation" (
    "id" UUID NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Review" (
    "id" UUID NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "preparationId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "experience" TEXT NOT NULL,
    "changes" TEXT NOT NULL DEFAULT '',
    "imageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."PlanningEntry" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "meal" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "PlanningEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."ShoppingList" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."ShoppingItem" (
    "id" UUID NOT NULL,
    "listId" UUID NOT NULL,
    "label" VARCHAR(300) NOT NULL,
    "group" VARCHAR(80) NOT NULL DEFAULT 'Outros',
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "recipeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minha_cozinha"."Image" (
    "id" UUID NOT NULL,
    "fileName" VARCHAR(80) NOT NULL,
    "mimeType" VARCHAR(30) NOT NULL,
    "bytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recipe_categoryId_idx" ON "minha_cozinha"."Recipe"("categoryId");

-- CreateIndex
CREATE INDEX "Recipe_time_idx" ON "minha_cozinha"."Recipe"("time");

-- CreateIndex
CREATE INDEX "Recipe_temperature_flavor_idx" ON "minha_cozinha"."Recipe"("temperature", "flavor");

-- CreateIndex
CREATE INDEX "Recipe_imageId_idx" ON "minha_cozinha"."Recipe"("imageId");

-- CreateIndex
CREATE INDEX "Recipe_createdAt_idx" ON "minha_cozinha"."Recipe"("createdAt");

-- CreateIndex
CREATE INDEX "Ingredient_normalized_idx" ON "minha_cozinha"."Ingredient"("normalized");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_recipeId_position_key" ON "minha_cozinha"."Ingredient"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PreparationStep_recipeId_position_key" ON "minha_cozinha"."PreparationStep"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "minha_cozinha"."Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "minha_cozinha"."Tag"("name");

-- CreateIndex
CREATE INDEX "RecipeTag_tagId_idx" ON "minha_cozinha"."RecipeTag"("tagId");

-- CreateIndex
CREATE INDEX "Preparation_recipeId_date_idx" ON "minha_cozinha"."Preparation"("recipeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Review_preparationId_key" ON "minha_cozinha"."Review"("preparationId");

-- CreateIndex
CREATE INDEX "Review_recipeId_createdAt_idx" ON "minha_cozinha"."Review"("recipeId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_imageId_idx" ON "minha_cozinha"."Review"("imageId");

-- CreateIndex
CREATE INDEX "PlanningEntry_recipeId_idx" ON "minha_cozinha"."PlanningEntry"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningEntry_date_meal_key" ON "minha_cozinha"."PlanningEntry"("date", "meal");

-- CreateIndex
CREATE INDEX "ShoppingItem_listId_checked_idx" ON "minha_cozinha"."ShoppingItem"("listId", "checked");

-- CreateIndex
CREATE INDEX "ShoppingItem_recipeId_idx" ON "minha_cozinha"."ShoppingItem"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Image_fileName_key" ON "minha_cozinha"."Image"("fileName");

-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "minha_cozinha"."Image"("createdAt");

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Recipe" ADD CONSTRAINT "Recipe_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "minha_cozinha"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Recipe" ADD CONSTRAINT "Recipe_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "minha_cozinha"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Ingredient" ADD CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."PreparationStep" ADD CONSTRAINT "PreparationStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."RecipeTag" ADD CONSTRAINT "RecipeTag_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."RecipeTag" ADD CONSTRAINT "RecipeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "minha_cozinha"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Favorite" ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Preparation" ADD CONSTRAINT "Preparation_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Review" ADD CONSTRAINT "Review_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Review" ADD CONSTRAINT "Review_preparationId_fkey" FOREIGN KEY ("preparationId") REFERENCES "minha_cozinha"."Preparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."Review" ADD CONSTRAINT "Review_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "minha_cozinha"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."PlanningEntry" ADD CONSTRAINT "PlanningEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."ShoppingItem" ADD CONSTRAINT "ShoppingItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "minha_cozinha"."ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minha_cozinha"."ShoppingItem" ADD CONSTRAINT "ShoppingItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "minha_cozinha"."Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE minha_cozinha."Recipe" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0, ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "recipe_rating_idx" ON minha_cozinha."Recipe" ("rating");

-- Regras de negócio também no PostgreSQL.
ALTER TABLE minha_cozinha."Recipe" ADD CONSTRAINT "recipe_time_check" CHECK (time BETWEEN 1 AND 1440);
ALTER TABLE minha_cozinha."Review" ADD CONSTRAINT "review_rating_check" CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE minha_cozinha."PlanningEntry" ADD CONSTRAINT "planning_meal_check" CHECK (meal BETWEEN 0 AND 3);
CREATE UNIQUE INDEX "one_current_shopping_list" ON minha_cozinha."ShoppingList" ("current") WHERE "current" = true;
CREATE INDEX "recipe_search_fts" ON minha_cozinha."Recipe" USING GIN (to_tsvector('simple', "searchText"));

-- Somente dados de domínio, sem receitas/avaliações fictícias.
INSERT INTO minha_cozinha."Category" (name) VALUES ('Massas'), ('Saudáveis'), ('Sobremesas'), ('Bebidas'), ('Sopas'), ('Café da manhã');
INSERT INTO minha_cozinha."ShoppingList" (id, name, "current", "createdAt") VALUES ('a38fefbe-cb90-4760-a1a7-9eef3107dfe6','Lista de compras',true,CURRENT_TIMESTAMP);

-- pg_trgm é opcional e nunca é instalado pela aplicação. Índice só se já disponível.
DO $$
DECLARE ext_schema text;
BEGIN
 SELECT n.nspname INTO ext_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm';
 IF ext_schema IS NOT NULL THEN
  EXECUTE format('CREATE INDEX recipe_search_trgm ON minha_cozinha."Recipe" USING GIN ("searchText" %I.gin_trgm_ops)',ext_schema);
 END IF;
END $$;

COMMIT;
