import { NextRequest, NextResponse } from "next/server";
import { getTarget, addAlert } from "@/lib/store/target";
import { buildCheckInput } from "@/lib/store/buildCheckInput";
import { callDailyCareManager } from "@/lib/skill/call";
import { CheckOutput } from "@/lib/types/check";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ targetId: string }> }
) {
  try {
    const { targetId } = await params;
    if (!targetId) return NextResponse.json({ error: "targetId가 필요합니다." }, { status: 400 });

    const target = getTarget(targetId);
    if (!target) return NextResponse.json({ error: "대상자를 찾을 수 없습니다." }, { status: 404 });

    const input = buildCheckInput(target);
    const output = await callDailyCareManager(input);

    if (output.level === "warning" || output.level === "caution") {
      addAlert(targetId, {
        alertId: crypto.randomUUID?.() ?? String(Date.now()),
        type: "check",
        title: "상태 확인 알림",
        message: output.summary ?? "현재 상태에 주의가 필요합니다.",
        at: output.checkedAt,
        status: "sent",
      });
    }

    return NextResponse.json(output, { status: 200 });
  } catch (error) {
    console.error(error);
    const fallback: CheckOutput = {
      targetId: "",
      checkedAt: new Date().toISOString(),
      summary: "현재 판단을 확인하지 못했습니다.",
      level: "caution",
      items: [
        {
          category: "condition",
          message: "현재 상태를 정확히 확인하지 못했습니다.",
          action: "복약/식사/운동/컨디션 정보를 다시 확인해 주세요.",
        },
      ],
      raw: null,
    };
    return NextResponse.json(fallback, { status: 500 });
  }
}
