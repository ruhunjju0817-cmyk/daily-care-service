import { TargetDoc, Medication, Meal, Exercise, Condition } from "@/lib/types/target";

let store: Record<string, TargetDoc> = {};

export function createTarget(doc: TargetDoc): TargetDoc {
  const target: TargetDoc = {
    ...doc,
    medications: doc.medications ?? [],
    meals: doc.meals ?? [],
    exercises: doc.exercises ?? [],
    conditions: doc.conditions ?? [],
    caregivers: doc.caregivers ?? [],
    alerts: doc.alerts ?? [],
  };
  store[target.id] = target;
  return target;
}

export function getTarget(id: string): TargetDoc | null {
  return store[id] ?? null;
}

export function listTargets(): TargetDoc[] {
  return Object.values(store);
}

export function updateTarget(id: string, patch: Partial<TargetDoc>): TargetDoc | null {
  const existing = store[id];
  if (!existing) return null;
  store[id] = { ...existing, ...patch };
  return store[id];
}

export function addMedication(targetId: string, item: Medication): TargetDoc | null {
  const target = getTarget(targetId);
  if (!target) return null;
  target.medications = [...target.medications, item];
  return target;
}

export function addMeal(targetId: string, item: Meal): TargetDoc | null {
  const target = getTarget(targetId);
  if (!target) return null;
  target.meals = [...target.meals, item];
  return target;
}

export function addExercise(targetId: string, item: Exercise): TargetDoc | null {
  const target = getTarget(targetId);
  if (!target) return null;
  target.exercises = [...target.exercises, item];
  return target;
}

export function addCondition(targetId: string, item: Condition): TargetDoc | null {
  const target = getTarget(targetId);
  if (!target) return null;
  target.conditions = [...target.conditions, item];
  return target;
}
