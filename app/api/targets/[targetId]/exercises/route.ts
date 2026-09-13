import { NextRequest, NextResponse } from "next/server";
import { addExercise } from "@/lib/store/target";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const body = await request.json();

  const item = {
    exerciseId: body.exerciseId ?? crypto.randomUUID?.() ?? String(Date.now()),
    time: body.time ?? "",
    type: body.type ?? "",
    intensity: body.intensity ?? "unknown",
    status: body.status ?? "scheduled",
  };

  const target = addExercise(targetId, item);
  if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json(target, { status: 200 });
}
