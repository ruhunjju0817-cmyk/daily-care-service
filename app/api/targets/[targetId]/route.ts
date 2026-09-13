import { NextRequest, NextResponse } from "next/server";
import { getTarget, updateTarget } from "@/lib/store/target";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const target = getTarget(targetId);
  if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(target, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  const { targetId } = await params;
  const body = await request.json();
  const target = updateTarget(targetId, body);
  if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(target, { status: 200 });
}
