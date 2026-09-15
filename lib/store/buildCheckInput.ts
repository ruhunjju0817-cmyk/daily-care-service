import { CheckInput } from "@/lib/types/check";
import { TargetDoc } from "@/lib/types/target";

function medicationReal(m: TargetDoc["medications"][number]) {
  return !!(m.name && m.time);
}

function mealReal(m: TargetDoc["meals"][number]) {
  return !!(m.time || m.status !== "unknown");
}

function exerciseReal(e: TargetDoc["exercises"][number]) {
  return !!(e.time || e.type || e.intensity !== "unknown");
}

function conditionReal(c: TargetDoc["conditions"][number]) {
  return !!(c.state && c.state !== "unknown") || !!c.note;
}

export function buildCheckInput(target: TargetDoc): CheckInput {
  return {
    targetId: target.id,
    checkedAt: new Date().toISOString(),
    medications: target.medications?.filter(medicationReal) ?? [],
    meals: target.meals?.filter(mealReal) ?? [],
    exercises: target.exercises?.filter(exerciseReal) ?? [],
    conditions: target.conditions?.filter(conditionReal) ?? [],
  };
}
