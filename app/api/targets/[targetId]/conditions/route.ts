import { NextRequest, NextResponse } from "next/server";
import { addCondition } from "@/lib/store/target";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const body = await request.json();

  const item = {
    conditionId: body.conditionId ?? crypto.randomUUID?.() ?? String(Date.now()),
    at: body.at ?? new Date().toISOString(),
    state: body.state ?? "",
    note: body.note ?? null,
  };

  const target = addCondition(targetId, item);
  if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json(target, { status: 200 });
}
