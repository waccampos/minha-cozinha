import { normalize } from "@/lib/text";
import type { ParsedSearch } from "@/types/search";

const synonyms: Record<string, string> = {
  morangos: "morango",
  tomates: "tomate",
  ovos: "ovo",
  bananas: "banana",
  macas: "maca",
  cogumelos: "cogumelo",
  limoes: "limao",
  batatas: "batata",
  aipim: "mandioca",
  macaxeira: "mandioca",
  tangerina: "mexerica",
  acucares: "acucar",
};

export function canonical(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => synonyms[word] || word)
    .join(" ");
}

const knownIngredients = [
  "morango",
  "tomate",
  "leite",
  "ovo",
  "banana",
  "aveia",
  "maca",
  "limao",
  "abobora",
  "frango",
  "carne",
  "iogurte",
  "lactose",
  "peixe",
  "queijo",
  "arroz",
  "feijao",
  "chocolate",
  "farinha",
  "acucar",
  "gluten",
  "mandioca",
  "mexerica",
  "cebola",
  "alho",
  "manteiga",
  "creme",
  "cogumelo",
  "coco",
  "mel",
  "amendoim",
  "camarao",
  "batata",
];

export function parseSearch(query: string): ParsedSearch {
  let text = canonical(query.replace(/,/g, " e ")).replace(
    /[^a-z0-9\s,-]/g,
    " ",
  );
  const exclude: string[] = [];
  text = text.replace(
    /\b(?:sem|exceto|excluir|menos(?!\s+de\s+\d)|nao quero|nao pode ter)\s+([a-z]+(?:\s+(?:de|do|da)\s+[a-z]+)?)/g,
    (_, word: string) => {
      exclude.push(canonical(word));

      return " EXCLUDED ";
    },
  );
  // Conjunções continuam uma exclusão apenas quando nomeiam outro ingrediente conhecido.
  text = text.replace(
    /EXCLUDED((?:\s*(?:,|e|ou)\s+[a-z]+)*)/g,
    (_, tail: string) => {
      return tail.replace(
        /(?:,|e|ou)\s+([a-z]+)/g,
        (whole: string, word: string) => {
          if (knownIngredients.includes(word)) {
            exclude.push(word);

            return " ";
          }

          return whole;
        },
      );
    },
  );

  const include = knownIngredients.filter(
    (word) => new RegExp(`\\b${word}\\b`).test(text) && !exclude.includes(word),
  );

  const time = text.match(
    /(?:ate|maximo(?: de)?|menos de|em|no maximo)\s+(\d+)\s*(min(?:utos?)?|h(?:oras?)?)/,
  );

  let maxTime = time
    ? Number(time[1]) * (time[2].startsWith("h") ? 60 : 1)
    : undefined;

  if (!maxTime && /rapid|poucos minutos/.test(text)) maxTime = 20;

  const temperature = /gelad/.test(text)
    ? "Gelada"
    : /quente/.test(text)
      ? "Quente"
      : /fri[ao]/.test(text)
        ? "Fria"
        : /ambiente/.test(text)
          ? "Ambiente"
          : undefined;

  const flavor = /\bdoce\b/.test(text)
    ? "Doce"
    : /salgad/.test(text)
      ? "Salgado"
      : undefined;

  const categoryPatterns: [string, RegExp][] = [
    ["Massas", /\b(?:massas?|macarrao|espaguete|lasanha)\b/],
    ["Sobremesas", /\bsobremesas?\b/],
    ["Bebidas", /\b(?:bebidas?|sucos?|vitaminas?)\b/],
    ["Sopas", /\b(?:sopas?|caldos?)\b/],
    ["Café da manhã", /\bcafe da manha\b/],
    ["Saudáveis", /\b(?:saudavel|saudaveis|leves?)\b/],
  ];

  const categories = categoryPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);

  // As categorias já viram filtros; não devem limitar novamente o texto livre.
  for (const [, pattern] of categoryPatterns) {
    text = text.replace(new RegExp(pattern.source, "g"), " ");
  }

  const stop = new Set(
    "quero algo uma um com de do da para preparar fazer receita receitas que tenha e ou em ate minutos minuto hora horas no maximo rapido rapida quente fria frio gelado gelada doce salgado salgada massa massas macarrao sobremesa sobremesas bebida bebidas saudavel leve sopa sopas cafe manha".split(
      " ",
    ),
  );

  const terms = (time ? text.replace(time[0], " ") : text)
    .split(/\s+/)
    .filter(
      (word) =>
        word &&
        !stop.has(word) &&
        !/^\d+$/.test(word) &&
        !include.includes(word),
    )
    .join(" ");

  return {
    include,
    exclude: [...new Set(exclude)],
    maxTime,
    temperature,
    flavor,
    categories,
    terms,
  };
}

export function ingredientPattern(value: string) {
  const escaped = canonical(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return `\\m${escaped}\\M`;
}
