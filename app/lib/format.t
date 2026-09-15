// app/lib/format.ts (또는 app/page.tsx, app/caregiver/page.tsx 위쪽에 놓아도 됨)
export type StatusLabel = {
  mealStatus: string;
  exerciseStatus: string;
  conditionState: string;
  beforeAfter: string;
  intensity: string;
  mealType: string;
};

export function mealStatusLabel(status?: string): string {
  if (!status) return "정보 없음";
  const map: Record<string, string> = {
    eaten: "섭취 완료",
    skipped: "섭취 안 함",
    partial: "일부 섭취",
    unknown: "확인 필요",
  };
  return map[status] ?? status;
}

export function exerciseStatusLabel(status?: string): string {
  if (!status) return "정보 없음";
  const map: Record<string, string> = {
    scheduled: "예정",
    done: "실시 완료",
    cancelled: "취소",
    changed: "변경됨",
  };
  return map[status] ?? status;
}

export function conditionStateLabel(state?: string): string {
  if (!state) return "정보 없음";
  if (state === "unknown") return "확인 필요";
  return state;
}

export function beforeAfterLabel(value?: string): string {
  if (!value) return "정보 없음";
  const map: Record<string, string> = {
    before: "식전(공복)",
    after: "식후",
    none: "상관없음",
  };
  return map[value] ?? value;
}

export function intensityLabel(value?: string): string {
  if (!value) return "정보 없음";
  const map: Record<string, string> = {
    low: "약함",
    moderate: "보통",
    high: "심함",
    unknown: "확인 필요",
  };
  return map[value] ?? value;
}

export function mealTypeLabel(value?: string): string {
  if (!value) return "정보 없음";
  const map: Record<string, string> = {
    breakfast: "아침",
    lunch: "점심",
    dinner: "저녁",
    snack: "간식",
  };
  return map[value] ?? value;
}
