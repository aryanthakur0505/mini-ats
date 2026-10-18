import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DUPLICATE_EMAIL, emailTaken, isNotFound, isUniqueViolation } from "@/lib/candidates";
import { candidateUpdateSchema, formatZodError } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Candidate not found" }, { status: 404 });

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { history: { orderBy: { changedAt: "desc" } } },
  });
  return candidate ? NextResponse.json({ candidate }) : notFound();
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = candidateUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  if (parsed.data.email && (await emailTaken(parsed.data.email, id))) {
    return NextResponse.json(DUPLICATE_EMAIL, { status: 409 });
  }

  try {
    const candidate = await prisma.$transaction(async (tx) => {
      const current = await tx.candidate.findUniqueOrThrow({ where: { id }, select: { stage: true } });
      const { stage, ...rest } = parsed.data;
      const stageChanged = stage !== undefined && stage !== current.stage;
      return tx.candidate.update({
        where: { id },
        data: {
          ...rest,
          ...(stageChanged && {
            stage,
            history: { create: { fromStage: current.stage, toStage: stage } },
          }),
        },
      });
    });
    return NextResponse.json({ candidate });
  } catch (e) {
    if (isNotFound(e)) return notFound();
    if (isUniqueViolation(e)) return NextResponse.json(DUPLICATE_EMAIL, { status: 409 });
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.candidate.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (isNotFound(e)) return notFound();
    throw e;
  }
}
