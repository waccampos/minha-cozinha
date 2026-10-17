import { z } from "zod";

import { imageSchema } from "./image.schema";

const text = (label: string) =>
  z.string().trim().min(1, `${label} é obrigatório.`);

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Escolha de 1 a 5 estrelas.").max(5),
  date: z.iso.date("Informe uma data válida."),
  experience: text("Experiência").max(3000),
  changes: z.string().trim().max(3000),
  image: imageSchema,
});

export type ReviewValues = z.infer<typeof reviewSchema>;
