import { NextRequest, NextResponse } from "next/server";
import { getTarget, addMedication } from "@/lib/store/target";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const target = getTarget(targetId);
  if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ medications: target.medications }, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const body = await request.json();

  const item = {
    medicationId: body.medicationId ?? crypto.randomUUID?.() ?? String(Date.now()),
    name: body.name ?? "",
    time: body.time ?? "",
    beforeAfter: body.beforeAfter ?? "none",
    timesPerDay: body.timesPerDay ?? null,
    status: body.status ?? "scheduled",
  };

  const target = addMedication(targetId, item);
  if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json(target, { status: 200 });
}
