"use client";

import { useEffect, useState } from "react";

type Alert = {
  alertId: string;
  type: "medication" | "meal" | "exercise" | "check";
  title: string;
  message: string;
  at: string;
  status: "scheduled" | "sent" | "dismissed";
};

type Target = {
  id: string;
  profile?: { name?: string; note?: string };
};

type Medication = {
  medicationId?: string;
  name: string;
  time: string;
  beforeAfter: "before" | "after" | "none";
  timesPerDay?: number | null;
  status?: "scheduled" | "taken" | "missed" | "changed";
};

type Meal = {
  mealId?: string;
  time: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  status: "eaten" | "skipped" | "partial" | "unknown";
};

type Exercise = {
  exerciseId?: string;
  time: string;
  type: string;
  intensity: "low" | "moderate" | "high" | "unknown";
  status: "scheduled" | "done" | "cancelled" | "changed";
};

type Condition = {
  conditionId?: string;
  at: string;
  state: string;
  note?: string | null;
};

type CheckOutput = {
  targetId: string;
  checkedAt: string;
  summary: string;
  level: "ok" | "caution" | "warning";
  items: Array<{
    category: "medication" | "meal" | "exercise" | "condition";
    message: string;
    action: string | null;
  }>;
  raw: string | null;
};

export default function Home() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);

  const [meds, setMeds] = useState<Medication[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckOutput | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then(setTargets)
      .catch(() => setTargets([]));
  }, []);

  useEffect(() => {
    if (!currentTarget) return;
    fetch(`/api/targets/${currentTarget.id}/alerts`)
      .then((res) => res.json())
      .then((data) => setAlerts(data?.alerts ?? []))
      .catch(() => setAlerts([]));
  }, [currentTarget]);

  const createTarget = async (name: string) => {
    const res = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { name, note: "" } }),
    });
    const data = await res.json();
    setTargets((prev) => [...prev, data]);
    setCurrentTarget(data);
    resetInputs();
  };

  const selectTarget = (t: Target) => {
    setCurrentTarget(t);
    resetInputs();
    setCheckResult(null);
    fetchInputs(t.id);
  };

  const resetInputs = () => {
    setMeds([]);
    setMeals([]);
    setExercises([]);
    setConditions([]);
    setCheckResult(null);
  };

  const fetchInputs = async (id: string) => {
    try {
      const medRes = await fetch(`/api/targets/${id}/medications`);
      const medsData = await medRes.json();
      setMeds(medsData?.medications ?? []);

      const mealRes = await fetch(`/api/targets/${id}/meals`);
      const mealsData = await mealRes.json();
      setMeals(mealsData?.meals ?? []);

      const exRes = await fetch(`/api/targets/${id}/exercises`);
      const exData = await exRes.json();
      setExercises(exData?.exercises ?? []);

      const condRes = await fetch(`/api/targets/${id}/conditions`);
      const condData = await condRes.json();
      setConditions(condData?.conditions ?? []);
    } catch {
      // 인메모리 MVP에서는 비어도 진행 가능
    }
  };

  const addMed = async () => {
    const name = window.prompt("약 이름") ?? "";
    const time = window.prompt("시간(예: 08:00)") ?? "";
    const beforeAfter = window.prompt("공복/식후/none") ?? "none";
    if (!name || !time) return;
    const res = await fetch(`/api/targets/${currentTarget!.id}/medications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, time, beforeAfter }),
    });
    const data = await res.json();
    setMeds(data?.medications ?? []);
  };

  const addMeal = async () => {
    const time = window.prompt("식사 시간") ?? "";
    const type = window.prompt("끼니 구분(breakfast/lunch/dinner/snack)") ?? "breakfast";
    const status = window.prompt("상태(eaten/skipped/partial/unknown)") ?? "unknown";
    if (!time) return;
    const res = await fetch(`/api/targets/${currentTarget!.id}/meals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time, mealType: type, status }),
    });
    const data = await res.json();
    setMeals(data?.meals ?? []);
  };

  const addExercise = async () => {
    const time = window.prompt("운동 시간") ?? "";
    const type = window.prompt("운동 종류") ?? "";
    const intensity = window.prompt("강도(low/moderate/high/unknown)") ?? "unknown";
    const status = window.prompt("상태(scheduled/done/cancelled/changed)") ?? "scheduled";
    if (!time) return;
    const res = await fetch(`/api/targets/${currentTarget!.id}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time, type, intensity, status }),
    });
    const data = await res.json();
    setExercises(data?.exercises ?? []);
  };

  const addCondition = async () => {
    const state = window.prompt("컨디션 상태") ?? "";
    const note = window.prompt("메모") ?? "";
    if (!state) return;
    const res = await fetch(`/api/targets/${currentTarget!.id}/conditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, note, at: new Date().toISOString() }),
    });
    const data = await res.json();
    setConditions(data?.conditions ?? []);
  };

  const runCheck = async () => {
    if (!currentTarget) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/targets/${currentTarget.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: currentTarget.id }),
      });
      const data = await res.json();
      setCheckResult(data);
    } catch {
      setCheckResult({
        targetId: currentTarget.id,
        checkedAt: new Date().toISOString(),
        summary: "체크 응답을 받지 못했습니다.",
        level: "caution",
        items: [],
        raw: null,
      });
    } finally {
      setChecking(false);
    }
  };

  const levelColor = (level: string) => {
    if (level === "warning") return "#d32f2f";
    if (level === "caution") return "#f57f17";
    return "#2e7d32";
  };

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1>Daily Care Service MVP</h1>
      <p>대상자 관리, 복약·식사·운동·컨디션 입력, 충돌 확인 MVP입니다.</p>

      <section style={{ marginTop: 24 }}>
        <h2>대상자</h2>
        {!currentTarget && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
              if (name) createTarget(name);
            }}
          >
            <input name="name" placeholder="대상자 이름" required />
            <button type="submit">대상자 생성</button>
          </form>
        )}

        {targets.length > 0 && (
          <ul style={{ marginTop: 12 }}>
            {targets.map((t) => (
              <li key={t.id}>
                <button onClick={() => selectTarget(t)}>
                  {t.profile?.name ?? t.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {currentTarget && (
        <section style={{ marginTop: 24, border: "1px solid #e5e7eb", padding: 16 }}>
          <h2>현재 대상자: {currentTarget.profile?.name ?? currentTarget.id}</h2>

          <div>
            <h3>복약</h3>
            <ul>
              {meds.map((m) => (
                <li key={m.medicationId ?? m.name}>
                  {m.name} / {m.time} / {m.beforeAfter}
                </li>
              ))}
            </ul>
            <button type="button" onClick={addMed}>
              복약 추가
            </button>
          </div>

          <div>
            <h3>식사</h3>
            <ul>
              {meals.map((m) => (
                <li key={m.mealId ?? m.time}>
                  {m.time} / {m.mealType} / {m.status}
                </li>
              ))}
            </ul>
            <button type="button" onClick={addMeal}>
              식사 추가
            </button>
          </div>

          <div>
            <h3>운동</h3>
            <ul>
              {exercises.map((e) => (
                <li key={e.exerciseId ?? e.time}>
                  {e.time} / {e.type} / {e.intensity} / {e.status}
                </li>
              ))}
            </ul>
            <button type="button" onClick={addExercise}>
              운동 추가
            </button>
          </div>

          <div>
            <h3>컨디션</h3>
            <ul>
              {conditions.map((c) => (
                <li key={c.conditionId ?? c.at}>
                  {c.at} / {c.state} / {c.note ?? "-"}
                </li>
              ))}
            </ul>
            <button type="button" onClick={addCondition}>
              컨디션 추가
            </button>
          </div>

          <button
            type="button"
            onClick={runCheck}
            disabled={checking}
            style={{ marginTop: 16, padding: "8px 16px", cursor: checking ? "not-allowed" : "auto" }}
          >
            {checking ? "체크 중..." : "충돌/상태 체크하기"}
          </button>

          {checkResult && (
            <section style={{ marginTop: 16, border: "1px solid #e5e7eb", padding: 16 }}>
              <h3 style={{ color: levelColor(checkResult.level) }}>
                {checkResult.level.toUpperCase()}
              </h3>
              <p>{checkResult.summary}</p>
              <ul>
                {checkResult.items.map((item, i) => (
                  <li key={i}>
                    <strong>{item.category}</strong>: {item.message}
                    {item.action ? ` → ${item.action}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {alerts.length > 0 && (
            <section style={{ marginTop: 16, border: "1px solid #e5e7eb", padding: 12 }}>
              <h3 style={{ fontSize: 14, margin: "0 0 8px" }}>알림</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "disc", paddingLeft: 18 }}>
                {alerts.map((a) => (
                  <li key={a.alertId} style={{ marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>{a.title}</strong>
                    <span style={{ color: "#333", fontSize: 13 }}> {a.message}</span>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {new Date(a.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
