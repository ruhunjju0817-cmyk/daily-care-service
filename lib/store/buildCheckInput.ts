import { CheckInput } from "@/lib/types/check";
import { TargetDoc } from "@/lib/types/target";

export function buildCheckInput(target: TargetDoc): CheckInput {
  return {
    targetId: target.id,
    checkedAt: new Date().toISOString(),
    medications: target.medications ?? [],
    meals: target.meals ?? [],
    exercises: target.exercises ?? [],
    conditions: target.conditions ?? [],
  };
}
