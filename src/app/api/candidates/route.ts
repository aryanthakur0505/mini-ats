import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DUPLICATE_EMAIL, emailTaken, isUniqueViolation, listCandidates } from "@/lib/candidates";
import { candidateInputSchema, candidateQuerySchema, formatZodError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(
    [...req.nextUrl.searchParams.entries()].filter(([, v]) => v !== ""),
  );
  const parsed = candidateQuerySchema.safeParse(params);
  if (!parsed.success) return NextResponse.json(formatZodError(parsed.error), { status: 400 });

  const candidates = await listCandidates(parsed.data);
  return NextResponse.json({ candidates });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = candidateInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(formatZodError(parsed.error), { status: 400 });

  if (await emailTaken(parsed.data.email)) return NextResponse.json(DUPLICATE_EMAIL, { status: 409 });

  try {
    const candidate = await prisma.candidate.create({
      data: { ...parsed.data, history: { create: { fromStage: null, toStage: parsed.data.stage } } },
    });
    return NextResponse.json({ candidate }, { status: 201 });
  } catch (e) {
    // Backstop for two requests racing past the check above.
    if (isUniqueViolation(e)) return NextResponse.json(DUPLICATE_EMAIL, { status: 409 });
    throw e;
  }
}
