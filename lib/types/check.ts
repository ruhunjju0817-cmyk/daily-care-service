export type Medication = {
  medicationId: string;
  name: string;
  time: string;
  beforeAfter: "before" | "after" | "none";
  timesPerDay: number | null;
  status: "scheduled" | "taken" | "missed" | "changed";
};

export type Meal = {
  mealId: string;
  time: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  status: "eaten" | "skipped" | "partial" | "unknown";
};

export type Exercise = {
  exerciseId: string;
  time: string;
  type: string;
  intensity: "low" | "moderate" | "high" | "unknown";
  status: "scheduled" | "done" | "cancelled" | "changed";
};

export type Condition = {
  conditionId: string;
  at: string;
  state: string;
  note: string | null;
};

export type CheckItem = {
  category: "medication" | "meal" | "exercise" | "condition";
  message: string;
  action: string | null;
};

export type CheckInput = {
  targetId: string;
  checkedAt: string;
  medications: Medication[];
  meals: Meal[];
  exercises: Exercise[];
  conditions: Condition[];
};

export type CheckOutput = {
  targetId: string;
  checkedAt: string;
  summary: string;
  level: "ok" | "caution" | "warning";
  items: CheckItem[];
  raw: string | null;
};
