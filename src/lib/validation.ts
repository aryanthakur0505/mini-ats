import { z } from "zod";
import { SORT_OPTIONS, SOURCES, STAGES } from "./constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const candidateInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: optionalText(30),
  role: z.string().trim().min(2, "Role is required").max(100),
  stage: z.enum(STAGES).default("APPLIED"),
  source: z.enum(SOURCES).default("OTHER"),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(20)
    .default([])
    .transform((list) => Array.from(new Set(list))),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: optionalText(2000),
});

export const candidateUpdateSchema = candidateInputSchema.partial();

export const stageUpdateSchema = z.object({ stage: z.enum(STAGES) });

export const candidateQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  stage: z.enum(STAGES).optional(),
  source: z.enum(SOURCES).optional(),
  sort: z.enum(Object.keys(SORT_OPTIONS) as [keyof typeof SORT_OPTIONS]).default("newest"),
});

export type CandidateInput = z.infer<typeof candidateInputSchema>;
export type CandidateQuery = z.infer<typeof candidateQuerySchema>;

export function formatZodError(error: z.ZodError) {
  return {
    error: "Validation failed",
    fields: Object.fromEntries(error.issues.map((i) => [i.path.join(".") || "_", i.message])),
  };
}
