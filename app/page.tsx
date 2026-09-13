"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

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

const SECTION_BG = "#f7f8fc";
const CARD_BORDER = "#e2e5ee";
const CARD_SHADOW = "0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)";
const BASE_GAP = 16;

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

  const cardStyle: CSSProperties = {
    background: SECTION_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: 12,
    boxShadow: CARD_SHADOW,
    padding: BASE_GAP,
  };

  const addButtonStyle: CSSProperties = {
    marginTop: 12,
    padding: "8px 14px",
    background: "#3b5b8a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  };

  const checkButtonStyle: CSSProperties = {
    marginTop: 16,
    padding: "9px 18px",
    background: "#2f4a73",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: checking ? "not-allowed" : "pointer",
    opacity: checking ? 0.7 : 1,
  };

  return (
    <div
      style={{
        padding: 28,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        maxWidth: 820,
        margin: "0 auto",
        color: "#1f2330",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 650, margin: "0 0 8px" }}>Daily Care Service MVP</h1>
        <p style={{ fontSize: 15, color: "#5b6478", margin: 0 }}>
          대상자 관리, 복약·식사·운동·컨디션 입력, 충돌 확인 MVP입니다.
        </p>
      </header>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>대상자</h2>
        {!currentTarget && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
              if (name) createTarget(name);
            }}
            style={{ display: "flex", gap: 10, alignItems: "center" }}
          >
            <input
              name="name"
              placeholder="대상자 이름"
              required
              style={{
                padding: "9px 12px",
                fontSize: 14,
                border: "1px solid #c7cdd9",
                borderRadius: 8,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "9px 14px",
                background: "#3b5b8a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              대상자 생성
            </button>
          </form>
        )}

        {targets.length > 0 && (
          <ul style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, padding: 0, listStyle: "none" }}>
            {targets.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => selectTarget(t)}
                  style={{
                    padding: "9px 14px",
                    background: currentTarget?.id === t.id ? "#e7ecf7" : "#fff",
                    border: `1px solid ${currentTarget?.id === t.id ? "#3b5b8a" : "#c7cdd9"}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: currentTarget?.id === t.id ? 600 : 400,
                    color: currentTarget?.id === t.id ? "#1f2330" : "#33415a",
                    cursor: "pointer",
                  }}
                >
                  {t.profile?.name ?? t.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {currentTarget && (
        <section style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
              현재 대상자: {currentTarget.profile?.name ?? currentTarget.id}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>복약</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {meds.map((m) => (
                  <li key={m.medicationId ?? m.name} style={{ padding: "7px 0", borderBottom: "1px solid #e6e9f1", fontSize: 14 }}>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    {" / "}
                    {m.time}
                    {" / "}
                    {m.beforeAfter}
                  </li>
                ))}
                {meds.length === 0 && (
                  <li style={{ color: "#8a93a3", fontSize: 13 }}>등록된 복약이 없습니다.</li>
                )}
              </ul>
              <button type="button" onClick={addMed} style={addButtonStyle}>
                복약 추가
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>식사</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {meals.map((m) => (
                  <li key={m.mealId ?? m.time} style={{ padding: "7px 0", borderBottom: "1px solid #e6e9f1", fontSize: 14 }}>
                    {m.time}
                    {" / "}
                    {m.mealType}
                    {" / "}
                    {m.status}
                  </li>
                ))}
                {meals.length === 0 && (
                  <li style={{ color: "#8a93a3", fontSize: 13 }}>등록된 식사가 없습니다.</li>
                )}
              </ul>
              <button type="button" onClick={addMeal} style={addButtonStyle}>
                식사 추가
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>운동</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {exercises.map((e) => (
                  <li key={e.exerciseId ?? e.time} style={{ padding: "7px 0", borderBottom: "1px solid #e6e9f1", fontSize: 14 }}>
                    {e.time}
                    {" / "}
                    {e.type}
                    {" / "}
                    {e.intensity}
                  </li>
                ))}
                {exercises.length === 0 && (
                  <li style={{ color: "#8a93a3", fontSize: 13 }}>등록된 운동이 없습니다.</li>
                )}
              </ul>
              <button type="button" onClick={addExercise} style={addButtonStyle}>
                운동 추가
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>컨디션</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {conditions.map((c) => (
                  <li key={c.conditionId ?? c.at} style={{ padding: "7px 0", borderBottom: "1px solid #e6e9f1", fontSize: 14 }}>
                    {c.at}
                    {" / "}
                    {c.state}
                    {" / "}
                    {c.note ?? "-"}
                  </li>
                ))}
                {conditions.length === 0 && (
                  <li style={{ color: "#8a93a3", fontSize: 13 }}>등록된 컨디션이 없습니다.</li>
                )}
              </ul>
              <button type="button" onClick={addCondition} style={addButtonStyle}>
                컨디션 추가
              </button>
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              onClick={runCheck}
              disabled={checking}
              style={{
                ...checkButtonStyle,
                background: "#33496f",
              }}
            >
              {checking ? "체크 중..." : "충돌/상태 체크하기"}
            </button>
          </div>

          {checkResult && (
            <div style={{ background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: BASE_GAP, boxShadow: CARD_SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    background: levelColor(checkResult.level),
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  {checkResult.level.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: 14, color: "#3a4658", lineHeight: 1.6, marginBottom: 8 }}>
                {checkResult.summary.split(/(?<=[.。!?])/).map((seg, i) => (
                  <p key={i} style={{ margin: "0 0 8px" }}>
                    {seg.trim() || seg}
                  </p>
                ))}
              </div>

              <ul style={{ padding: 0, margin: 0, listStyle: "disc", paddingLeft: 20 }}>
                {checkResult.items.map((item, i) => (
                  <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                    <strong style={{ color: "#2f3b4f" }}>{item.category}</strong>
                    {" "}
                    {item.message}
                    {item.action ? ` → ${item.action}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alerts.length > 0 && (
            <div style={{ background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: BASE_GAP, boxShadow: CARD_SHADOW }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>알림</h3>
              <ul style={{ padding: 0, margin: 0, listStyle: "disc", paddingLeft: 18 }}>
                {alerts.map((a) => (
                  <li
                    key={a.alertId}
                    style={{ marginBottom: 8, padding: "8px 10px", background: "#fff", border: "1px solid #e6e9f1", borderRadius: 8, fontSize: 13.5 }}
                  >
                    <strong style={{ color: "#2f3b4f" }}>{a.title}</strong>
                    <span style={{ color: "#3a4658" }}> {a.message}</span>
                    <div style={{ fontSize: 11, color: "#9aa2b2", marginTop: 4 }}>
                      {new Date(a.at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
