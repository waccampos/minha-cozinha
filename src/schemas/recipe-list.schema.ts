import { z } from "zod";

export const recipeListInput = z.object({
  q: z.string().trim().max(400).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  category: z.string().max(80).optional(),
  difficulty: z.enum(["Fácil", "Médio", "Avançado"]).optional(),
  temperature: z.string().max(20).optional(),
  maxTime: z.coerce.number().int().min(1).max(1440).default(1440),
  rating: z.coerce.number().min(0).max(5).default(0),
  favorites: z.enum(["true", "false"]).default("false"),
  sort: z.enum(["recent", "rating", "time"]).default("recent"),
});

export type RecipeListQuery = z.infer<typeof recipeListInput>;
