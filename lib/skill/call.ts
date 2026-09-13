import { CheckInput, CheckOutput } from "@/lib/types/check";

export async function callDailyCareManager(input: CheckInput): Promise<CheckOutput> {
  const raw = await callSkill(input);
  return parseSkillOutput(input, raw);
}

async function callSkill(input: CheckInput): Promise<string> {
  // TODO: 실제 Solar Pro 4 호출 구현
  // - 제공자/모델: Solar Pro 4 전용만 사용
  // - 요청에는 daily-care-manager가 요구하는 맥락 + 구조화된 입력 전달
  // - 예: 대상자별 복약/식사/운동/컨디션을 최신 상태 기준으로 넘김
  throw new Error("callSkill not implemented yet");
}

function parseSkillOutput(input: CheckInput, raw: string): CheckOutput {
  // 스킬 응답을 서비스 출력 형태로 정리
  // - summary/level/items 추출
  // - 애매하면 과한 확신을 피하고, 필요하면 확인 권고 성격 유지
  // - 서비스 화면에서 쓰기 좋게 category별 분리

  return {
    targetId: input.targetId,
    checkedAt: input.checkedAt,
    summary: raw ?? "현재 상태를 확인했습니다.",
    level: "ok",
    items: [],
    raw,
  };
}
