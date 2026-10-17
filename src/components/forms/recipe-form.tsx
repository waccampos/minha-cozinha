"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import TaxonomyManager from "@/components/forms/taxonomy-manager";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import ImageUploader from "@/components/ui/image-uploader";
import { useKitchen } from "@/hooks/use-kitchen";
import useKitchenNavigation from "@/hooks/use-kitchen-navigation";
import {
  recipeFormSchema,
  type RecipeFormValues,
} from "@/schemas/recipe.schema";
import type { Recipe } from "@/types/recipe";

export default function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const { navigate } = useKitchenNavigation(recipe?.id);
  const { saveRecipe, categories, pending } = useKitchen();
  const [taxonomy, setTaxonomy] = useState<"category" | "tag" | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: recipe?.title ?? "",
      description: recipe?.description ?? "",
      image: recipe?.image.startsWith("/api/images/") ? recipe.image : "",
      category: recipe?.category as RecipeFormValues["category"] | undefined,
      time: recipe?.time,
      servings: recipe?.servings ?? "",
      difficulty: recipe?.difficulty ?? "Fácil",
      temperature:
        (recipe?.temperature as RecipeFormValues["temperature"]) ?? "Quente",
      flavor: (recipe?.flavor as RecipeFormValues["flavor"]) ?? "Salgado",
      notes: recipe?.notes ?? "",
      tags: recipe?.tags ?? [],
      ingredients: recipe?.ingredientDetails ??
        recipe?.ingredients.map((name) => ({
          quantity: "",
          unit: "",
          name,
        })) ?? [{ quantity: "", unit: "", name: "" }],
      steps: recipe?.steps.map((text) => ({ text })) ?? [
        { text: "" },
        { text: "" },
        { text: "" },
      ],
    },
  });

  const ingredients = useFieldArray({ control, name: "ingredients" });

  const steps = useFieldArray({ control, name: "steps" });

  const submit = handleSubmit(async (values) => {
    const result = await saveRecipe(values, recipe?.id ?? saved ?? undefined);

    if (result) setSaved(result.id);
  });

  const fieldError = (message?: string) =>
    message ? (
      <small className="field-error" role="alert">
        {message}
      </small>
    ) : null;

  return (
    <main className="shell page form-page">
      <form onSubmit={submit} noValidate>
        <div className="form-head">
          <div>
            <p className="eyebrow">{recipe ? "Sua criação" : "Nova criação"}</p>
            <h1>{recipe ? "Editar receita" : "Adicionar receita"}</h1>
            <p>Guarde cada detalhe para repetir seus melhores sabores.</p>
          </div>
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(recipe ? "detail" : "home")}
            >
              Cancelar
            </Button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={pending}
            >
              Salvar receita
            </button>
          </div>
        </div>
        <div className="form-layout">
          <div>
            <section className="form-section">
              <span className="section-number">01</span>
              <div className="form-title">
                <h2>Sobre a receita</h2>
                <p>Comece com as informações essenciais.</p>
              </div>
              <div className="field full">
                <label htmlFor="recipe-title">Nome da receita</label>
                <input
                  id="recipe-title"
                  placeholder="Ex.: Risoto de cogumelos"
                  {...register("title")}
                  aria-invalid={!!errors.title}
                />
                {fieldError(errors.title?.message)}
              </div>
              <div className="field full">
                <label htmlFor="recipe-description">Descrição</label>
                <textarea
                  id="recipe-description"
                  placeholder="Conte um pouco sobre essa receita..."
                  rows={4}
                  {...register("description")}
                  aria-invalid={!!errors.description}
                />
                {fieldError(errors.description?.message)}
              </div>
              <div className="field full">
                <span className="field-label">Fotografias</span>
                <Controller
                  name="image"
                  control={control}
                  render={({ field }) => (
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {fieldError(errors.image?.message)}
              </div>
            </section>
            <section className="form-section">
              <span className="section-number">02</span>
              <div className="form-title">
                <h2>Detalhes</h2>
                <p>Ajude a organizar sua coleção.</p>
              </div>
              <div className="fields-grid">
                <div className="field">
                  <label htmlFor="recipe-category">Categoria</label>
                  <select
                    id="recipe-category"
                    {...register("category")}
                    aria-invalid={!!errors.category}
                  >
                    <option value="">Escolha uma categoria</option>
                    {categories.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {fieldError(errors.category?.message)}
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => setTaxonomy("category")}
                  >
                    Gerenciar categorias
                  </button>
                </div>
                <div className="field">
                  <label htmlFor="recipe-time">Tempo de preparo</label>
                  <input
                    id="recipe-time"
                    type="number"
                    min={1}
                    max={1440}
                    placeholder="45 minutos"
                    {...register("time", { valueAsNumber: true })}
                    aria-invalid={!!errors.time}
                  />
                  {fieldError(errors.time?.message)}
                </div>
                <div className="field">
                  <label htmlFor="recipe-servings">Rendimento</label>
                  <input
                    id="recipe-servings"
                    placeholder="4 porções"
                    {...register("servings")}
                    aria-invalid={!!errors.servings}
                  />
                  {fieldError(errors.servings?.message)}
                </div>
                <div className="field">
                  <label htmlFor="recipe-difficulty">Dificuldade</label>
                  <select id="recipe-difficulty" {...register("difficulty")}>
                    <option>Fácil</option>
                    <option>Médio</option>
                    <option>Avançado</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="recipe-temperature">Temperatura</label>
                  <select id="recipe-temperature" {...register("temperature")}>
                    <option>Quente</option>
                    <option>Fria</option>
                    <option>Gelada</option>
                    <option>Ambiente</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="recipe-flavor">Perfil de sabor</label>
                  <select id="recipe-flavor" {...register("flavor")}>
                    <option>Salgado</option>
                    <option>Doce</option>
                    <option>Misto</option>
                  </select>
                </div>
              </div>
            </section>
            <section className="form-section">
              <span className="section-number">03</span>
              <div className="form-title">
                <h2>Ingredientes</h2>
                <p>Liste tudo que será necessário.</p>
              </div>
              <div className="dynamic-list">
                {ingredients.fields.map((field, i) => (
                  <div key={field.id}>
                    <div className="ingredient-row">
                      <span aria-hidden="true">⋮⋮</span>
                      <input
                        aria-label={`Quantidade do ingrediente ${i + 1}`}
                        placeholder="Quantidade"
                        {...register(`ingredients.${i}.quantity`)}
                      />
                      <select
                        aria-label={`Unidade do ingrediente ${i + 1}`}
                        {...register(`ingredients.${i}.unit`)}
                      >
                        <option value="">unidade</option>
                        <option>g</option>
                        <option>ml</option>
                        <option>un.</option>
                        <option>xícara</option>
                        <option>colher</option>
                      </select>
                      <input
                        placeholder="Ingrediente"
                        aria-label={`Ingrediente ${i + 1}`}
                        aria-invalid={!!errors.ingredients?.[i]?.name}
                        {...register(`ingredients.${i}.name`)}
                      />
                      <button
                        type="button"
                        aria-label={`Remover ingrediente ${i + 1}`}
                        onClick={() => ingredients.remove(i)}
                      >
                        <Icon name="x" />
                      </button>
                    </div>
                    {fieldError(errors.ingredients?.[i]?.name?.message)}
                  </div>
                ))}
                {fieldError(
                  errors.ingredients?.root?.message ??
                    errors.ingredients?.message,
                )}
              </div>
              <Button
                variant="soft"
                icon="plus"
                onClick={() =>
                  ingredients.append({ quantity: "", unit: "", name: "" })
                }
              >
                Adicionar ingrediente
              </Button>
            </section>
            <section className="form-section">
              <span className="section-number">04</span>
              <div className="form-title">
                <h2>Modo de preparo</h2>
                <p>Organize as etapas na ordem certa.</p>
              </div>
              {steps.fields.map((field, i) => (
                <div className="step-field" key={field.id}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <textarea
                      rows={3}
                      placeholder={`Descreva a etapa ${i + 1}...`}
                      aria-label={`Etapa ${i + 1}`}
                      aria-invalid={!!errors.steps?.[i]?.text}
                      {...register(`steps.${i}.text`)}
                    />
                    {fieldError(errors.steps?.[i]?.text?.message)}
                    <button
                      className="text-action"
                      type="button"
                      onClick={() => steps.remove(i)}
                    >
                      Remover etapa {i + 1}
                    </button>
                  </div>
                </div>
              ))}
              <div className="field full">
                {fieldError(
                  errors.steps?.root?.message ?? errors.steps?.message,
                )}
              </div>
              <Button
                variant="soft"
                icon="plus"
                onClick={() => steps.append({ text: "" })}
              >
                Adicionar etapa
              </Button>
            </section>
            <section className="form-section">
              <div className="field full">
                <label htmlFor="recipe-tags">Características</label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="recipe-tags"
                      value={field.value.join(", ")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split(",")
                            .map((s) => s.trimStart()),
                        )
                      }
                      onBlur={() =>
                        field.onChange(
                          field.value.map((s) => s.trim()).filter(Boolean),
                        )
                      }
                      placeholder="Ex.: vegetariana, sem açúcar"
                    />
                  )}
                />
                <small>Separe as características por vírgulas.</small>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => setTaxonomy("tag")}
                >
                  Gerenciar características
                </button>
              </div>
            </section>
            <section className="form-section">
              <span className="section-number">05</span>
              <div className="form-title">
                <h2>Dicas e observações</h2>
                <p>Registre os segredos que fazem a diferença.</p>
              </div>
              <div className="field full">
                <label className="sr-only" htmlFor="recipe-notes">
                  Dicas e observações
                </label>
                <textarea
                  id="recipe-notes"
                  rows={5}
                  placeholder="Temperos, substituições, pontos de atenção..."
                  {...register("notes")}
                />
                {fieldError(errors.notes?.message)}
              </div>
            </section>
          </div>
          <aside className="form-aside">
            <div>
              <p className="eyebrow">Progresso</p>
              <strong>{recipe ? "Editar receita" : "Nova receita"}</strong>
              <ol>
                <li className="active">Sobre a receita</li>
                <li>Detalhes</li>
                <li>Ingredientes</li>
                <li>Modo de preparo</li>
                <li>Dicas</li>
              </ol>
            </div>
            <div className="tip-card">
              <strong>Uma boa foto faz diferença</strong>
              <p>Prefira luz natural e enquadre o prato de perto.</p>
            </div>
          </aside>
        </div>
        <div className="mobile-form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            <Icon name="check" size={18} />
            {pending ? "Salvando receita…" : "Salvar receita"}
          </button>
        </div>
      </form>
      {saved !== null && (
        <div className="toast" role="status">
          <Icon name="check" /> Receita salva com sucesso!{" "}
          <Link href={`/receitas/${saved}`}>Ver receita</Link>
        </div>
      )}
      {taxonomy && (
        <TaxonomyManager kind={taxonomy} onClose={() => setTaxonomy(null)} />
      )}
    </main>
  );
}
