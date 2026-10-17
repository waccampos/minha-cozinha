import { z } from "zod";

import { canonical } from "@/lib/search-parser";

export const searchInput = z.object({
  q: z.string().trim().max(400).default(""),
  include: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(80)
        .transform(canonical)
        .refine((value) => value.length > 0),
    )
    .max(30)
    .optional(),
  exclude: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(80)
        .transform(canonical)
        .refine((value) => value.length > 0),
    )
    .max(30)
    .optional(),
  maxTime: z.number().int().positive().max(1440).optional(),
  temperature: z.string().max(20).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  categories: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  flavor: z.string().max(20).optional(),
});

export const pantryInput = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(80)
      .transform(canonical)
      .refine((value) => value.length > 0),
  )
  .max(30);
