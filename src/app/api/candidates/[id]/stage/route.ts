import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isNotFound } from "@/lib/candidates";
import { formatZodError, stageUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = stageUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(formatZodError(parsed.error), { status: 400 });

  const { stage } = parsed.data;
  try {
    const candidate = await prisma.$transaction(async (tx) => {
      const current = await tx.candidate.findUniqueOrThrow({ where: { id }, select: { stage: true } });
      if (current.stage === stage) return tx.candidate.findUniqueOrThrow({ where: { id } });
      return tx.candidate.update({
        where: { id },
        data: { stage, history: { create: { fromStage: current.stage, toStage: stage } } },
      });
    });
    return NextResponse.json({ candidate });
  } catch (e) {
    if (isNotFound(e)) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    throw e;
  }
}
