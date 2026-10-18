import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { CandidateQuery } from "./validation";

const ORDER_BY: Record<CandidateQuery["sort"], Prisma.CandidateOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  name: [{ name: "asc" }],
  rating: [{ rating: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
};

export async function listCandidates({ q, stage, source, sort }: CandidateQuery) {
  const where: Prisma.CandidateWhereInput = {};
  if (stage) where.stage = stage;
  if (source) where.source = source;
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    // Prisma can't do a case-insensitive partial match inside a text[] column, so find those ids in SQL.
    const skillMatches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Candidate" WHERE EXISTS (SELECT 1 FROM unnest(skills) s WHERE s ILIKE ${pattern})
    `;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { role: { contains: q, mode: "insensitive" } },
      { id: { in: skillMatches.map((r) => r.id) } },
    ];
  }
  return prisma.candidate.findMany({ where, orderBy: ORDER_BY[sort] });
}

export async function emailTaken(email: string, excludeId?: string) {
  const existing = await prisma.candidate.findUnique({ where: { email }, select: { id: true } });
  return existing !== null && existing.id !== excludeId;
}

export const DUPLICATE_EMAIL = {
  error: "Validation failed",
  fields: { email: "A candidate with this email already exists" },
};

export function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export function isNotFound(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";
}
