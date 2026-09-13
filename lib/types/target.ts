import {
  Medication,
  Meal,
  Exercise,
  Condition,
} from "./check";

export type {
  Medication,
  Meal,
  Exercise,
  Condition,
} from "./check";

export type Caregiver = {
  caregiverId: string;
  role: string;
  canEdit: boolean;
};

export type Alert = {
  alertId: string;
  type: "medication" | "meal" | "exercise" | "check";
  at: string;
  status: "scheduled" | "sent" | "dismissed";
};

export type TargetDoc = {
  id: string;
  profile: {
    name?: string;
    note?: string;
  };
  medications: Medication[];
  meals: Meal[];
  exercises: Exercise[];
  conditions: Condition[];
  caregivers: Caregiver[];
  alerts: Alert[];
};
