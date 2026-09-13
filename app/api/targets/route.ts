import { NextRequest, NextResponse } from "next/server";
import { createTarget, listTargets } from "@/lib/store/target";

export async function GET() {
  const targets = listTargets();
  return NextResponse.json(targets, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const target = createTarget({
    id: body.id ?? crypto.randomUUID?.() ?? String(Date.now()),
    profile: body.profile ?? { name: "대상자", note: "" },
    medications: [],
    meals: [],
    exercises: [],
    conditions: [],
    caregivers: [],
    alerts: [],
  });
  return NextResponse.json(target, { status: 201 });
}
