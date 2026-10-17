import { z } from "zod";

export const imageSchema = z
  .string()
  .regex(/^(?:|\/api\/images\/[a-f0-9-]{36})$/, "Envie uma imagem JPG ou PNG.");
