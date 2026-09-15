// app/caregiver/page.tsx
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

// ---------- 화면 표시용 라벨 헬퍼 ----------
function beforeAfterLabel(value?: string): string {
  if (!value) return "정보 없음";
  if (value === "before") return "식전(공복)";
  if (value === "after") return "식후";
  if (value === "none") return "상관없음";
  return value;
}

function mealStatusLabel(status?: string): string {
  if (!status) return "정보 없음";
  if (status === "eaten") return "섭취 완료";
  if (status === "skipped") return "섭취 안 함";
  if (status === "partial") return "일부 섭취";
  if (status === "unknown") return "확인 필요";
  return status;
}

function mealTypeLabel(value?: string): string {
  if (!value) return "정보 없음";
  if (value === "breakfast") return "아침";
  if (value === "lunch") return "점심";
  if (value === "dinner") return "저녁";
  if (value === "snack") return "간식";
  return value;
}

function exerciseStatusLabel(status?: string): string {
  if (!status) return "정보 없음";
  if (status === "scheduled") return "예정";
  if (status === "done") return "실시 완료";
  if (status === "cancelled") return "취소";
  if (status === "changed") return "변경됨";
  return status;
}

function intensityLabel(value?: string): string {
  if (!value) return "정보 없음";
  if (value === "low") return "약함";
  if (value === "moderate") return "보통";
  if (value === "high") return "심함";
  if (value === "unknown") return "확인 필요";
  return value;
}

function conditionStateLabel(value?: string): string {
  if (!value) return "정보 없음";
  if (value === "unknown") return "확인 필요";
  return value;
}

// ---------- 스타일 ----------
const SECTION_BG = "#f7f8fc";
const CARD_BORDER = "#e2e5ee";
const CARD_SHADOW = "0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)";
const BASE_GAP = 16;

// ---------- 순차 fetch 헬퍼 ----------
async function fetchDataSequentially(selectedId: string) {
  // 1) 대상자 조회
  let target: Target | null = null;
  try {
    const targetRes = await fetch(`/api/targets/${selectedId}`);
    const targetData = await targetRes.json();
    if (targetData && typeof targetData.id === "string") {
      target = targetData as Target;
    } else {
      console.warn("대상자 조회 실패 또는 대상 없음");
    }
  } catch (err) {
    console.warn("대상자 조회 실패:", err);
  }

  if (!target) {
    return {
      target: null,
      meds: [],
      meals: [],
      exercises: [],
      conditions: [],
      alerts: [],
    };
  }

  // 2) medications
  let meds: Medication[] = [];
  try {
    const medRes = await fetch(`/api/targets/${selectedId}/medications`);
    const medData = await medRes.json();
    meds = Array.isArray(medData?.medications) ? medData.medications : [];
  } catch (err) {
    console.warn("medications 조회 실패:", err);
  }

  // 3) meals
  let meals: Meal[] = [];
  try {
    const mealRes = await fetch(`/api/targets/${selectedId}/meals`);
    const mealData = await mealRes.json();
    meals = Array.isArray(mealData?.meals) ? mealData.meals : [];
  } catch (err) {
    console.warn("meals 조회 실패:", err);
  }

  // 4) exercises
  let exercises: Exercise[] = [];
  try {
    const exRes = await fetch(`/api/targets/${selectedId}/exercises`);
    const exData = await exRes.json();
    exercises = Array.isArray(exData?.exercises) ? exData.exercises : [];
  } catch (err) {
    console.warn("exercises 조회 실패:", err);
  }

  // 5) conditions
  let conditions: Condition[] = [];
  try {
    const condRes = await fetch(`/api/targets/${selectedId}/conditions`);
    const condData = await condRes.json();
    conditions = Array.isArray(condData?.conditions) ? condData.conditions : [];
  } catch (err) {
    console.warn("conditions 조회 실패:", err);
  }

  // 6) alerts
  let alerts: Alert[] = [];
  try {
    const alertRes = await fetch(`/api/targets/${selectedId}/alerts`);
    const alertData = await alertRes.json();
    alerts = Array.isArray(alertData?.alerts) ? alertData.alerts : [];
  } catch (err) {
    console.warn("alerts 조회 실패:", err);
  }

  return {
    target,
    meds,
    meals,
    exercises,
    conditions,
    alerts,
  };
}

// ---------- 컴포넌트 ----------
export default function CaregiverPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selected, setSelected] = useState<Target | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckOutput | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);

  useEffect(() => {
    fetch("/api/targets")
      .then((res) => res.json())
      .then((data) => setTargets(Array.isArray(data) ? data : []))
      .catch(() => setTargets([]));
  }, []);

  useEffect(() => {
    if (!selected) {
      setMeds([]);
      setMeals([]);
      setExercises([]);
      setConditions([]);
      setAlerts([]);
      setCheckResult(null);
      return;
    }

    fetchDataSequentially(selected.id).then((data) => {
      if (!data || !data.target) {
        setMeds([]);
        setMeals([]);
        setExercises([]);
        setConditions([]);
        setAlerts([]);
        return;
      }
      setMeds(data.meds);
      setMeals(data.meals);
      setExercises(data.exercises);
      setConditions(data.conditions);
      setAlerts(data.alerts);
    });
  }, [selected]);

  const runCheck = async () => {
    if (!selected) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/targets/${selected.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: selected.id }),
      });
      const data = await res.json();
      setCheckResult(data);
    } catch {
      setCheckResult({
        targetId: selected.id,
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

  const buttonStyle: CSSProperties = {
    padding: "9px 16px",
    background: "#33496f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
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
        <h1 style={{ fontSize: 24, fontWeight: 650, margin: "0 0 8px" }}>보호자 뷰</h1>
        <p style={{ fontSize: 15, color: "#5b6478", margin: 0 }}>
          대상자 상태를 확인하고, 체크 결과와 기록을 보는 최소 뷰입니다.
        </p>
      </header>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>대상자 선택</h2>
        {targets.length > 0 && (
          <ul style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, padding: 0, listStyle: "none" }}>
            {targets.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => { setSelected(t); setCheckResult(null); setAlerts([]); }}
                  style={{
                    padding: "9px 14px",
                    background: selected?.id === t.id ? "#e7ecf7" : "#fff",
                    border: `1px solid ${selected?.id === t.id ? "#3b5b8a" : "#c7cdd9"}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: selected?.id === t.id ? 600 : 400,
                    color: selected?.id === t.id ? "#1f2330" : "#33415a",
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

      {selected && (
        <section style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: "#2f3b4f" }}>
                대상자: {selected.profile?.name ?? selected.id}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={{ background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "#2f3b4f" }}>복약</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                  {meds.map((m) => (
                    <li key={m.medicationId ?? m.name} style={{ padding: "5px 0", borderBottom: "1px solid #e6e9f1", fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      {" / "}
                      {m.time}
                      {" / "}
                      {beforeAfterLabel(m.beforeAfter)}
                    </li>
                  ))}
                  {meds.length === 0 && (
                    <li style={{ color: "#8a93a3", fontSize: 12 }}>등록된 복약이 없습니다.</li>
                  )}
                </ul>
              </div>

              <div style={{ background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "#2f3b4f" }}>식사</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                  {meals.map((m) => (
                    <li key={m.mealId ?? m.time} style={{ padding: "5px 0", borderBottom: "1px solid #e6e9f1", fontSize: 13 }}>
                      {mealTypeLabel(m.mealType)}
                      {" / "}
                      {m.time}
                      {" / "}
                      상태: {mealStatusLabel(m.status)}
                    </li>
                  ))}
                  {meals.length === 0 && (
                    <li style={{ color: "#8a93a3", fontSize: 12 }}>등록된 식사가 없습니다.</li>
                  )}
                </ul>
              </div>

              <div style={{ background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "#2f3b4f" }}>운동</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                  {exercises.map((e) => (
                    <li key={e.exerciseId ?? e.time} style={{ padding: "5px 0", borderBottom: "1px solid #e6e9f1", fontSize: 13 }}>
                      {e.time}
                      {" / "}
                      {e.type}
                      {" / "}
                      강도: {intensityLabel(e.intensity)}
                      {" / "}
                      상태: {exerciseStatusLabel(e.status)}
                    </li>
                  ))}
                  {exercises.length === 0 && (
                    <li style={{ color: "#8a93a3", fontSize: 12 }}>등록된 운동이 없습니다.</li>
                  )}
                </ul>
              </div>

              <div style={{ background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", color: "#2f3b4f" }}>컨디션</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                  {conditions.map((c) => (
                    <li key={c.conditionId ?? c.at} style={{ padding: "5px 0", borderBottom: "1px solid #e6e9f1", fontSize: 13 }}>
                      {c.at}
                      {" / "}
                      상태: {conditionStateLabel(c.state)}
                      {" / "}
                      {c.note ?? "-"}
                    </li>
                  ))}
                  {conditions.length === 0 && (
                    <li style={{ color: "#8a93a3", fontSize: 12 }}>등록된 컨디션이 없습니다.</li>
                  )}
                </ul>
              </div>
            </div>

            <button type="button" onClick={runCheck} disabled={checking} style={{ ...buttonStyle, marginTop: 12 }}>
              {checking ? "체크 중..." : "상태 체크하기"}
            </button>

            {checkResult && (
              <div style={{ marginTop: 16, background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: BASE_GAP, boxShadow: CARD_SHADOW }}>
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
              <div style={{ marginTop: 12, background: "#f7f8fc", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: BASE_GAP, boxShadow: CARD_SHADOW }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#2f3b4f" }}>알림</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: "disc", paddingLeft: 18 }}>
                  {alerts.map((a) => (
                    <li
                      key={a.alertId}
                      style={{
                        marginBottom: 8,
                        padding: "8px 10px",
                        background: "#fff",
                        border: "1px solid #e6e9f1",
                        borderRadius: 8,
                        fontSize: 13.5,
                      }}
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
          </div>
        </section>
      )}
    </div>
  );
}
